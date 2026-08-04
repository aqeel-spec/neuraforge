/**
 * Rollback tests.
 *
 * Tests: journal loading/validation, idempotent rollback, residual mismatch
 * reporting, malformed/substituted journal rejection, repeated rollback safety.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import type { InstallPlan, Confirmation } from "../types.js";
import { createMockReader, createMemoryMutableTarget } from "./fixtures.js";

describe("rollback", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  async function performSuccessfulInstall(): Promise<{
    plan: InstallPlan;
    target: ReturnType<typeof createMemoryMutableTarget>;
  }> {
    const target = createMemoryMutableTarget({});
    const previewResult = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    if (!previewResult.ok) throw new Error("unreachable");
    const plan = previewResult.value;
    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };
    const applyResult = await installer.apply(plan, confirmation, target);
    if (!applyResult.ok) throw new Error("apply failed: " + applyResult.error.message);
    return { plan, target };
  }

  it("successfully rolls back a committed install", async () => {
    const { plan, target } = await performSuccessfulInstall();

    // Verify files exist before rollback
    expect(target.files["src/components/Button.tsx"]).toBeDefined();
    expect(target.files["src/components/button.css"]).toBeDefined();

    const result = await installer.rollback(plan.planId, target);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    expect(result.value.planId).toBe(plan.planId);
    expect(result.value.success).toBe(true);

    // Files should be deleted (they were additions)
    expect(target.files["src/components/Button.tsx"]).toBeUndefined();
    expect(target.files["src/components/button.css"]).toBeUndefined();
  });

  it("repeated rollback is safe and idempotent", async () => {
    const { plan, target } = await performSuccessfulInstall();

    const r1 = await installer.rollback(plan.planId, target);
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error("unreachable");
    expect(r1.value.success).toBe(true);

    // Second rollback should also succeed (already_restored)
    const r2 = await installer.rollback(plan.planId, target);
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error("unreachable");
    expect(r2.value.success).toBe(true);
    expect(
      r2.value.completedActions.every(
        (a) => a.status === "already_restored" || a.status === "completed",
      ),
    ).toBe(true);
  });

  it("reports residual mismatches when rollback cannot fully restore", async () => {
    const { plan, target } = await performSuccessfulInstall();

    // Simulate a file that can't be deleted
    const originalDelete = target.deleteFile.bind(target);
    const blockedTarget = {
      ...target,
      deleteFile(path: string): Promise<void> {
        if (path === "src/components/Button.tsx") {
          return Promise.reject(new Error("Permission denied"));
        }
        return originalDelete(path);
      },
    };

    const result = await installer.rollback(plan.planId, blockedTarget);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    expect(result.value.success).toBe(false);
    expect(result.value.residualMismatches.length).toBeGreaterThan(0);
    expect(result.value.residualMismatches[0]?.path).toBe("src/components/Button.tsx");
  });

  it("fails when no journal exists", async () => {
    const target = createMemoryMutableTarget({});
    const result = await installer.rollback("nonexistent-plan", target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("fails when journal is malformed", async () => {
    const target = createMemoryMutableTarget({
      ".neuraforge/transactions/bad-plan.json": "{ invalid json",
    });
    const result = await installer.rollback("bad-plan", target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("fails when journal planId doesn't match requested plan", async () => {
    const target = createMemoryMutableTarget({
      ".neuraforge/transactions/requested-plan.json": JSON.stringify({
        planId: "different-plan",
        planChecksum: {
          algorithm: "sha256",
          canonicalization: "neuraforge-canonical-v1",
          digest: "abc",
        },
        status: "committed",
        operationIndex: 0,
        backups: [],
        rollbackActions: [],
      }),
    });
    const result = await installer.rollback("requested-plan", target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("rejects journal with unsafe paths in rollback actions", async () => {
    const target = createMemoryMutableTarget({
      ".neuraforge/transactions/evil-plan.json": JSON.stringify({
        planId: "evil-plan",
        planChecksum: {
          algorithm: "sha256",
          canonicalization: "neuraforge-canonical-v1",
          digest: "abc",
        },
        status: "committed",
        operationIndex: 0,
        backups: [],
        rollbackActions: [{ path: "../../../etc/passwd", kind: "delete" }],
      }),
    });
    const result = await installer.rollback("evil-plan", target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("rejects journal with absolute paths", async () => {
    const target = createMemoryMutableTarget({
      ".neuraforge/transactions/abs-plan.json": JSON.stringify({
        planId: "abs-plan",
        planChecksum: {
          algorithm: "sha256",
          canonicalization: "neuraforge-canonical-v1",
          digest: "abc",
        },
        status: "committed",
        operationIndex: 0,
        backups: [],
        rollbackActions: [{ path: "/etc/passwd", kind: "delete" }],
      }),
    });
    const result = await installer.rollback("abs-plan", target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });
});
