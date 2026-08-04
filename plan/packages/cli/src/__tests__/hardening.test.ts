/**
 * Hardening tests for CLI integrity defects A-F.
 *
 * Required tests:
 * 1. Forged operation content/path with recomputed caller checksum+ID still rejected by Registry comparison, zero writes
 * 2. Changed rollback restore/delete action rejected before apply
 * 3. Exact approval set required
 * 4. Journal action/embedded plan/checksum/planId substitution all rejected, zero writes
 * 5. Apply failure rollbackReport.planId equals plan.planId
 * 6. Plan ID changes when precondition/operation/rollback changes
 */

import { describe, it, expect, beforeAll } from "vitest";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import type { Checksum } from "@neuraforge-ui/schemas";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import type { InstallPlan, Confirmation, InstallJournal } from "../types.js";
import type { MutableTarget } from "../target.js";
import { verifyPlanIntegrity, computePlanChecksum, derivePlanId } from "../plan-integrity.js";
import { createMockReader, createMemoryMutableTarget, makeChecksum } from "./fixtures.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let installer: Installer;

async function setup(): Promise<void> {
  const reader = await createMockReader();
  const result = createInstaller(reader);
  if (!result.ok) throw new Error("unreachable");
  installer = result.value;
}

async function getValidPlan(): Promise<InstallPlan> {
  const target = createMemoryMutableTarget({});
  const result = await installer.preview(
    { stableId: "button", version: "1.0.0", destination: "src/components" },
    target,
  );
  if (!result.ok) throw new Error("unreachable");
  return result.value;
}

function makeConfirmation(plan: InstallPlan): Confirmation {
  return {
    confirmed: true,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    approvedOverwritePaths: plan.request.approvedOverwritePaths,
  };
}

/** Creates a mutation-spy target that tracks all writes */
function createSpyTarget(): MutableTarget & { writes: string[]; files: Record<string, string> } {
  const files: Record<string, string> = {};
  const writes: string[] = [];
  return {
    files,
    writes,
    exists(path: string): Promise<boolean> {
      return Promise.resolve(path in files);
    },
    readFile(path: string): Promise<string | undefined> {
      return Promise.resolve(files[path]);
    },
    checksum(path: string) {
      const content = files[path];
      if (content === undefined) return Promise.resolve(undefined);
      return makeChecksum(content);
    },
    writeFile(path: string, content: string): Promise<void> {
      writes.push(path);
      files[path] = content;
      return Promise.resolve();
    },
    deleteFile(path: string): Promise<void> {
      writes.push(`DELETE:${path}`);
      Reflect.deleteProperty(files, path);
      return Promise.resolve();
    },
    ensureDir(): Promise<void> {
      return Promise.resolve();
    },
  };
}

// ===========================================================================
// Test 1: Forged operation content/path with recomputed caller checksum+ID
//          still rejected by Registry comparison, zero writes
// ===========================================================================

describe("forged operation content rejected by Registry revalidation", () => {
  beforeAll(setup);

  it("rejects forged operation content even with recomputed checksum and planId", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    // Forge the plan: change operation content
    const forgedOps = plan.operations.map((op, i) =>
      i === 0 ? { ...op, content: "// EVIL CONTENT", checksum: op.checksum } : op,
    );
    const forgedPlan: InstallPlan = { ...plan, operations: forgedOps };

    // Attacker recomputes checksum and planId
    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    // Zero non-journal writes
    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects forged operation path even with recomputed checksum and planId", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    // Forge: change operation path
    const forgedOps = plan.operations.map((op, i) =>
      i === 0 ? { ...op, path: "src/components/Evil.tsx" } : op,
    );
    const forgedPlan: InstallPlan = { ...plan, operations: forgedOps };

    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects forged artifact checksum even with recomputed plan checksum", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    const forgedPlan: InstallPlan = {
      ...plan,
      artifactChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: "forged",
      },
    };

    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects forged source checksum even with recomputed plan checksum", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    const forgedChecksum: Checksum = {
      algorithm: "sha256",
      canonicalization: CANONICALIZATION_VERSION,
      digest: "forged",
    };
    const forgedSourceChecksums = plan.sourceChecksums.map((sc, i) =>
      i === 0 ? { ...sc, checksum: forgedChecksum } : sc,
    );
    const forgedPlan: InstallPlan = { ...plan, sourceChecksums: forgedSourceChecksums };

    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });
});

// ===========================================================================
// Test 2: Changed rollback restore/delete action rejected before apply
// ===========================================================================

describe("changed rollback action rejected before apply", () => {
  beforeAll(setup);

  it("rejects plan with modified rollback action path (recomputed checksum)", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    // Change a rollback action path
    const forgedRollback = plan.rollbackActions.map((ra, i) =>
      i === 0 ? { ...ra, path: "src/components/Evil.tsx" } : ra,
    );
    const forgedPlan: InstallPlan = { ...plan, rollbackActions: forgedRollback };

    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects plan with rollback kind changed from delete to restore", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    // Change a delete rollback to restore
    const forgedRollback = plan.rollbackActions.map((ra) =>
      ra.kind === "delete"
        ? {
            ...ra,
            kind: "restore" as const,
            restoreContent: "evil",
            restoreChecksum: ra.restoreChecksum,
          }
        : ra,
    );
    const forgedPlan: InstallPlan = { ...plan, rollbackActions: forgedRollback };

    const newDigest = await computePlanChecksum(forgedPlan);
    const newPlanId = derivePlanId(newDigest);
    const attackerPlan: InstallPlan = {
      ...forgedPlan,
      planId: newPlanId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: newDigest,
      },
    };

    const confirmation: Confirmation = {
      confirmed: true,
      planId: attackerPlan.planId,
      planChecksum: attackerPlan.planChecksum,
      approvedOverwritePaths: attackerPlan.request.approvedOverwritePaths,
    };

    const result = await installer.apply(attackerPlan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });
});

// ===========================================================================
// Test 3: Exact approval set required
// ===========================================================================

describe("exact approval set required", () => {
  beforeAll(setup);

  async function getPlanWithApproval(): Promise<InstallPlan> {
    const target = createMemoryMutableTarget({
      "src/components/Button.tsx": "// old content",
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
    if (!result.ok) throw new Error("unreachable");
    return result.value;
  }

  it("rejects when confirmation omits an approval (zero writes)", async () => {
    const plan = await getPlanWithApproval();
    const target = createSpyTarget();
    // Pre-populate target for preconditions
    target.files["src/components/Button.tsx"] = "// old content";

    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      // Missing the approval
      approvedOverwritePaths: [],
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects when confirmation adds an extra approval (zero writes)", async () => {
    const plan = await getPlanWithApproval();
    const target = createSpyTarget();
    target.files["src/components/Button.tsx"] = "// old content";

    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      approvedOverwritePaths: ["src/components/Button.tsx", "src/components/Extra.tsx"],
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects when confirmation has wrong approval path (zero writes)", async () => {
    const plan = await getPlanWithApproval();
    const target = createSpyTarget();
    target.files["src/components/Button.tsx"] = "// old content";

    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      approvedOverwritePaths: ["src/components/Wrong.tsx"],
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });

  it("rejects confirmation with wrong checksum algorithm field", async () => {
    const plan = await getValidPlan();
    const target = createSpyTarget();

    // Use runtime-unknown boundary to simulate untrusted confirmation with wrong canonicalization
    const untrustedConfirmation: unknown = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: "wrong-canonicalization",
        digest: plan.planChecksum.digest,
      },
    };

    const result = await installer.apply(plan, untrustedConfirmation as Confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");

    const nonJournalWrites = target.writes.filter((w) => !w.includes(".neuraforge"));
    expect(nonJournalWrites.length).toBe(0);
  });
});

// ===========================================================================
// Test 4: Journal action/embedded plan/checksum/planId substitution all rejected
// ===========================================================================

describe("journal substitution rejected", () => {
  beforeAll(setup);

  async function performInstall(): Promise<{
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
    const confirmation = makeConfirmation(plan);
    const applyResult = await installer.apply(plan, confirmation, target);
    if (!applyResult.ok) throw new Error("apply failed: " + applyResult.error.message);
    return { plan, target };
  }

  it("rejects journal with substituted rollback action path (zero writes)", async () => {
    const { plan, target } = await performInstall();

    // Tamper with the stored journal: change rollback action path
    const jPath = `.neuraforge/transactions/${plan.planId}.json`;
    const journalContent = target.files[jPath];
    if (!journalContent) throw new Error("journal missing");
    const journal = JSON.parse(journalContent) as InstallJournal;

    const tamperedJournal = {
      ...journal,
      rollbackActions: journal.rollbackActions.map((ra, i) =>
        i === 0 ? { ...ra, path: "src/components/Evil.tsx" } : ra,
      ),
    };
    target.files[jPath] = JSON.stringify(tamperedJournal);

    const result = await installer.rollback(plan.planId, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");

    // No target mutations (files count unchanged except possibly journal status update)
    // Actually since we reject before rollback, files written should remain the same
    expect(target.files["src/components/Evil.tsx"]).toBeUndefined();
  });

  it("rejects journal with substituted embedded plan checksum", async () => {
    const { plan, target } = await performInstall();

    const jPath = `.neuraforge/transactions/${plan.planId}.json`;
    const journalContent = target.files[jPath];
    if (!journalContent) throw new Error("journal missing");
    const journal = JSON.parse(journalContent) as Record<string, unknown>;

    // Tamper: change embedded plan checksum
    const tamperedPlan = { ...(journal.plan as Record<string, unknown>) };
    tamperedPlan.planChecksum = {
      algorithm: "sha256",
      canonicalization: CANONICALIZATION_VERSION,
      digest: "tampered_digest",
    };
    const tamperedJournal = { ...journal, plan: tamperedPlan };
    target.files[jPath] = JSON.stringify(tamperedJournal);

    const result = await installer.rollback(plan.planId, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("rejects journal with substituted embedded plan planId", async () => {
    const { plan, target } = await performInstall();

    const jPath = `.neuraforge/transactions/${plan.planId}.json`;
    const journalContent = target.files[jPath];
    if (!journalContent) throw new Error("journal missing");
    const journal = JSON.parse(journalContent) as Record<string, unknown>;

    // Tamper: change embedded plan planId
    const tamperedPlan = { ...(journal.plan as Record<string, unknown>) };
    tamperedPlan.planId = "plan_evil";
    const tamperedJournal = { ...journal, plan: tamperedPlan };
    target.files[jPath] = JSON.stringify(tamperedJournal);

    const result = await installer.rollback(plan.planId, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("rejects journal with substituted rollback action content", async () => {
    // Install with an overwrite to get restore actions in the journal
    const target2 = createMemoryMutableTarget({
      "src/components/Button.tsx": "// original",
    });
    const previewResult2 = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      target2,
    );
    if (!previewResult2.ok) throw new Error("unreachable");
    const plan2 = previewResult2.value;
    const confirmation2 = makeConfirmation(plan2);
    const applyResult2 = await installer.apply(plan2, confirmation2, target2);
    if (!applyResult2.ok) throw new Error("apply2 failed: " + applyResult2.error.message);

    const jPath2 = `.neuraforge/transactions/${plan2.planId}.json`;
    const journalContent2 = target2.files[jPath2];
    if (!journalContent2) throw new Error("journal2 missing");
    const journal2 = JSON.parse(journalContent2) as Record<string, unknown>;

    // Tamper: change restore content in rollback actions
    const actions = (journal2.rollbackActions as Record<string, unknown>[]).map((ra) =>
      ra.kind === "restore" ? { ...ra, restoreContent: "// EVIL RESTORE" } : ra,
    );
    const tamperedJournal2 = { ...journal2, rollbackActions: actions };
    target2.files[jPath2] = JSON.stringify(tamperedJournal2);

    const result = await installer.rollback(plan2.planId, target2);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });

  it("rejects journal with unknown fields", async () => {
    const { plan, target } = await performInstall();

    const jPath = `.neuraforge/transactions/${plan.planId}.json`;
    const journalContent = target.files[jPath];
    if (!journalContent) throw new Error("journal missing");
    const journal = JSON.parse(journalContent) as Record<string, unknown>;

    // Add unknown field
    const tamperedJournal = { ...journal, evilField: "injected" };
    target.files[jPath] = JSON.stringify(tamperedJournal);

    const result = await installer.rollback(plan.planId, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("journal_invalid");
  });
});

// ===========================================================================
// Test 5: Apply failure rollbackReport.planId equals plan.planId
// ===========================================================================

describe("apply failure rollbackReport contains planId", () => {
  beforeAll(setup);

  it("rollbackReport.planId equals plan.planId on apply failure", async () => {
    const plan = await getValidPlan();
    const files: Record<string, string> = {};
    let fileWriteCount = 0;

    const faultyTarget: MutableTarget = {
      exists(path) {
        return Promise.resolve(path in files);
      },
      readFile(path) {
        return Promise.resolve(files[path]);
      },
      checksum(path) {
        const content = files[path];
        if (content === undefined) return Promise.resolve(undefined);
        return makeChecksum(content);
      },
      writeFile(path, content) {
        if (!path.includes(".neuraforge")) {
          fileWriteCount++;
          if (fileWriteCount === 2) {
            return Promise.reject(new Error("Injected failure"));
          }
        }
        files[path] = content;
        return Promise.resolve();
      },
      deleteFile(path) {
        Reflect.deleteProperty(files, path);
        return Promise.resolve();
      },
      ensureDir() {
        return Promise.resolve();
      },
    };

    const confirmation = makeConfirmation(plan);
    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.rollbackReport).toBeDefined();
    expect(result.error.rollbackReport?.planId).toBe(plan.planId);
  });
});

// ===========================================================================
// Test 6: Plan ID changes when precondition/operation/rollback changes
// ===========================================================================

describe("plan ID determinism", () => {
  beforeAll(setup);

  it("plan ID changes when target preconditions differ", async () => {
    // Plan against empty target
    const emptyTarget = createMemoryMutableTarget({});
    const result1 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      emptyTarget,
    );
    if (!result1.ok) throw new Error("unreachable");

    // Plan against target with existing (conflicting) file
    const conflictTarget = createMemoryMutableTarget({
      "src/components/Button.tsx": "// existing",
    });
    const result2 = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      conflictTarget,
    );
    if (!result2.ok) throw new Error("unreachable");

    // Plan IDs must differ because preconditions and operations differ
    expect(result1.value.planId).not.toBe(result2.value.planId);
  });

  it("plan ID is stable for identical request and target", async () => {
    const target = createMemoryMutableTarget({});
    const result1 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    const result2 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    if (!result1.ok || !result2.ok) throw new Error("unreachable");
    expect(result1.value.planId).toBe(result2.value.planId);
    expect(result1.value.planChecksum.digest).toBe(result2.value.planChecksum.digest);
  });

  it("plan ID changes when destination changes", async () => {
    const target = createMemoryMutableTarget({});
    const result1 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    const result2 = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "lib/ui" },
      target,
    );
    if (!result1.ok || !result2.ok) throw new Error("unreachable");
    expect(result1.value.planId).not.toBe(result2.value.planId);
  });

  it("verifyPlanIntegrity confirms a valid plan", async () => {
    const plan = await getValidPlan();
    const integrity = await verifyPlanIntegrity(plan);
    expect(integrity.valid).toBe(true);
    expect(integrity.checksumMatch).toBe(true);
    expect(integrity.planIdMatch).toBe(true);
  });

  it("verifyPlanIntegrity detects tampered plan", async () => {
    const plan = await getValidPlan();
    // Tamper without recomputing checksum
    const tampered: InstallPlan = {
      ...plan,
      registryLocation: "registry/components/evil/1.0.0",
    };
    const integrity = await verifyPlanIntegrity(tampered);
    expect(integrity.valid).toBe(false);
    expect(integrity.checksumMatch).toBe(false);
  });
});
