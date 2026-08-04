/**
 * Preview tests.
 *
 * Tests: preview purity, deterministic plan, file changes, conflicts,
 * checksums, rollback data, path validation, approved overwrite semantics.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import {
  createMockReader,
  createMemoryReadOnlyTarget,
  createThrowingMutableTarget,
  BUTTON_SOURCE,
  BUTTON_STYLES,
} from "./fixtures.js";

describe("preview", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  it("produces a valid plan for new files (additions)", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const plan = result.value;
    expect(plan.planId).toBeDefined();
    expect(plan.planChecksum.algorithm).toBe("sha256");
    expect(plan.artifactRef.stableId).toBe("button");
    expect(plan.artifactRef.version).toBe("1.0.0");
    expect(plan.fileChanges.length).toBe(2);
    expect(plan.fileChanges.every((fc) => fc.kind === "add")).toBe(true);
    expect(plan.operations.length).toBe(2);
    expect(plan.rollbackActions.length).toBe(2);
    expect(plan.rollbackActions.every((ra) => ra.kind === "delete")).toBe(true);
    expect(plan.preconditions.length).toBe(2);
    expect(plan.preconditions.every((p) => !p.exists)).toBe(true);
  });

  it("invokes ZERO mutation methods (preview purity)", async () => {
    const target = createThrowingMutableTarget({});
    // The preview function accepts ReadOnlyTarget, so mutation methods won't be called
    // But let's explicitly test with a target that throws on mutation
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
  });

  it("is deterministic — identical inputs produce byte-equivalent plan", async () => {
    const target = createMemoryReadOnlyTarget({});
    const r1 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    const r2 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it("detects conflicts for existing files with different content", async () => {
    const target = createMemoryReadOnlyTarget({
      "src/components/Button.tsx": "// different content",
      "src/components/button.css": "/* different */",
    });
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const conflicts = result.value.fileChanges.filter((fc) => fc.kind === "conflict");
    expect(conflicts.length).toBe(2);
    // No operations for conflicts without approval
    expect(result.value.operations.length).toBe(0);
  });

  it("marks unchanged when existing file matches source", async () => {
    const target = createMemoryReadOnlyTarget({
      "src/components/Button.tsx": BUTTON_SOURCE,
      "src/components/button.css": BUTTON_STYLES,
    });
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    expect(result.value.fileChanges.every((fc) => fc.kind === "unchanged")).toBe(true);
    expect(result.value.operations.length).toBe(0);
    expect(result.value.rollbackActions.length).toBe(0);
  });

  it("allows approved overwrite of conflicting files", async () => {
    const target = createMemoryReadOnlyTarget({
      "src/components/Button.tsx": "// different content",
    });
    const result = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const modify = result.value.fileChanges.filter((fc) => fc.kind === "modify");
    expect(modify.length).toBe(1);
    expect(modify[0]?.path).toBe("src/components/Button.tsx");

    // Rollback should restore original content
    const restoreActions = result.value.rollbackActions.filter((ra) => ra.kind === "restore");
    expect(restoreActions.length).toBe(1);
    expect(restoreActions[0]?.restoreContent).toBe("// different content");
  });

  it("rejects approval of non-conflicting path (validation error)", async () => {
    const target = createMemoryReadOnlyTarget({
      "src/components/Button.tsx": BUTTON_SOURCE, // same content — unchanged
    });
    const result = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("rejects approval of unknown path (validation error)", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Unknown.tsx"],
      },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("includes dependency changes", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.dependencies.length).toBe(1);
    expect(result.value.dependencies[0]?.name).toBe("react");
    expect(result.value.dependencies[0]?.version).toBe("19.0.0");
  });

  it("includes source checksums for all files", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.sourceChecksums.length).toBe(2);
  });

  // --- Validation error tests ---

  it("rejects missing stableId", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("rejects invalid semver", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "latest", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("rejects unsafe destination path", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "../escape" },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("rejects backslash in destination", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src\\components" },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("returns not_found for nonexistent component", async () => {
    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "nonexistent", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("not_found");
  });

  it("plan contains rollback actions in reverse operation order", async () => {
    const target = createMemoryReadOnlyTarget({
      "src/components/Button.tsx": "// old",
    });
    const result = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      target,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    // Operations: write button.css (add), write Button.tsx (modify)
    // Rollback should be reversed: restore Button.tsx first, then delete button.css
    const plan = result.value;
    expect(plan.rollbackActions.length).toBe(2);
    // First rollback action should be for the last operation (reverse order)
    const lastOp = plan.operations[plan.operations.length - 1];
    expect(lastOp).toBeDefined();
    if (lastOp) {
      expect(plan.rollbackActions[0]?.path).toBe(lastOp.path);
    }
  });
});
