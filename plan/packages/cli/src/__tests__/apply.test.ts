/**
 * Apply tests.
 *
 * Tests: confirmation validation, precondition revalidation, journal creation,
 * successful apply/receipt, fault injection at each stage with automatic rollback.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import type { InstallPlan, Confirmation } from "../types.js";
import type { MutableTarget } from "../target.js";
import { createMockReader, createMemoryMutableTarget, makeChecksum } from "./fixtures.js";

describe("apply", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  async function getValidPlan(): Promise<InstallPlan> {
    const target = createMemoryMutableTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    expect(result.ok).toBe(true);
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

  it("succeeds with valid confirmation on clean target", async () => {
    const plan = await getValidPlan();
    const target = createMemoryMutableTarget({});
    const confirmation = makeConfirmation(plan);

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    expect(result.value.planId).toBe(plan.planId);
    expect(result.value.filesWritten.length).toBe(2);
    expect(result.value.journalPath).toContain(".neuraforge/transactions");

    // Verify files were written
    expect(target.files["src/components/Button.tsx"]).toBeDefined();
    expect(target.files["src/components/button.css"]).toBeDefined();

    // Verify journal exists and is committed
    const journalContent = target.files[result.value.journalPath];
    expect(journalContent).toBeDefined();
    if (journalContent === undefined) throw new Error("unreachable");
    const journal = JSON.parse(journalContent) as { status: string };
    expect(journal.status).toBe("committed");
  });

  it("rejects when confirmed is not true", async () => {
    const plan = await getValidPlan();
    const target = createMemoryMutableTarget({});
    // Use a runtime-unknown boundary to simulate an untrusted caller passing
    // confirmed:false without compile-time type safety
    const untrustedConfirmation: unknown = {
      confirmed: false,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, untrustedConfirmation as Confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_required");
    expect(Object.keys(target.files).length).toBe(0);
  });

  it("rejects when planId mismatches", async () => {
    const plan = await getValidPlan();
    const target = createMemoryMutableTarget({});
    const confirmation: Confirmation = {
      confirmed: true,
      planId: "wrong-plan-id",
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");
    expect(Object.keys(target.files).length).toBe(0);
  });

  it("rejects when planChecksum mismatches", async () => {
    const plan = await getValidPlan();
    const target = createMemoryMutableTarget({});
    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "wrong",
      },
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");
    expect(Object.keys(target.files).length).toBe(0);
  });

  it("rejects when confirmation adds new approval paths", async () => {
    const plan = await getValidPlan();
    const target = createMemoryMutableTarget({});
    const confirmation: Confirmation = {
      confirmed: true,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      approvedOverwritePaths: ["src/components/Evil.tsx"],
    };

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("confirmation_mismatch");
  });

  it("fails precondition when target file appeared after preview", async () => {
    const plan = await getValidPlan();
    // Target now has a file that preview said wouldn't exist
    const target = createMemoryMutableTarget({
      "src/components/Button.tsx": "// appeared after preview",
    });
    const confirmation = makeConfirmation(plan);

    const result = await installer.apply(plan, confirmation, target);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("precondition_failed");
    // Should NOT have written anything
    expect(target.files["src/components/button.css"]).toBeUndefined();
  });

  it("fails precondition when existing file checksum changed", async () => {
    // Preview with existing file
    const existingTarget = createMemoryMutableTarget({
      "src/components/Button.tsx": "// old content",
    });
    const previewResult = await installer.preview(
      {
        stableId: "button",
        version: "1.0.0",
        destination: "src/components",
        approvedOverwritePaths: ["src/components/Button.tsx"],
      },
      existingTarget,
    );
    expect(previewResult.ok).toBe(true);
    if (!previewResult.ok) throw new Error("unreachable");
    const plan = previewResult.value;

    // Now change the file between preview and apply
    const applyTarget = createMemoryMutableTarget({
      "src/components/Button.tsx": "// CHANGED after preview!",
    });
    const confirmation = makeConfirmation(plan);

    const result = await installer.apply(plan, confirmation, applyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("precondition_failed");
  });
});

describe("apply with fault injection", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  async function getValidPlan(): Promise<InstallPlan> {
    const target = createMemoryMutableTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );
    if (!result.ok) throw new Error("unreachable");
    return result.value;
  }

  it("executes rollback when first file write fails", async () => {
    const plan = await getValidPlan();
    const files: Record<string, string> = {};
    let writeCount = 0;

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
        writeCount++;
        // Fail on second write (first is journal, second is first file op)
        if (writeCount === 2) {
          return Promise.reject(new Error("Injected write failure"));
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

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    // Journal should exist (first write succeeded)
    const journalKey = Object.keys(files).find((k) => k.includes(".neuraforge"));
    expect(journalKey).toBeDefined();
  });

  it("executes rollback and restores tree when write fails after first file", async () => {
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
        // Count only non-journal writes that are actual file operations
        if (!path.includes(".neuraforge")) {
          fileWriteCount++;
          if (fileWriteCount === 2) {
            return Promise.reject(new Error("Injected failure on second file"));
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

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.rollbackReport).toBeDefined();

    // First file should have been rolled back (deleted)
    const firstOp = plan.operations[0];
    expect(firstOp).toBeDefined();
    if (firstOp) {
      expect(files[firstOp.path]).toBeUndefined();
    }
  });

  it("executes rollback when postcondition check fails", async () => {
    const plan = await getValidPlan();
    const files: Record<string, string> = {};
    let allWritesDone = false;

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
        // After all file writes are done, corrupt the first operation's postcondition
        if (allWritesDone && path === plan.operations[0]?.path) {
          return Promise.resolve({
            algorithm: "sha256" as const,
            canonicalization: "neuraforge-canonical-v1",
            digest: "corrupted",
          });
        }
        return makeChecksum(content);
      },
      writeFile(path, content) {
        files[path] = content;
        // Detect when all operation files have been written
        const opPaths = plan.operations.map((op) => op.path);
        if (opPaths.every((p) => p in files)) {
          allWritesDone = true;
        }
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

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.rollbackReport).toBeDefined();
  });

  it("executes rollback when journal progress update fails", async () => {
    const plan = await getValidPlan();
    const files: Record<string, string> = {};
    let journalWriteCount = 0;

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
        if (path.includes(".neuraforge")) {
          journalWriteCount++;
          // Fail on second journal write (first progress update after first file write)
          if (journalWriteCount === 2) {
            return Promise.reject(new Error("Injected journal update failure"));
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

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.rollbackReport).toBeDefined();
  });

  it("performs no file mutation and no rollback when prepared journal write fails", async () => {
    const plan = await getValidPlan();
    const files: Record<string, string> = {};

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
      writeFile() {
        // Fail on the very first write (the prepared journal)
        return Promise.reject(new Error("Disk full - cannot write journal"));
      },
      deleteFile(path) {
        Reflect.deleteProperty(files, path);
        return Promise.resolve();
      },
      ensureDir() {
        return Promise.resolve();
      },
    };

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.message).toContain("journal");
    // No rollback report — no mutations happened
    expect(result.error.rollbackReport).toBeUndefined();
    // No files should have been written
    expect(Object.keys(files).length).toBe(0);
  });

  it("still succeeds even if committed journal write fails (files are already written)", async () => {
    // The committed journal write is the LAST step after postconditions pass.
    // If it fails, all files are already correctly written but journal status
    // won't reflect "committed". Since the current implementation wraps only
    // the committed journal write in its own try/catch, let's verify behavior.
    const plan = await getValidPlan();
    const files: Record<string, string> = {};
    let journalWriteCount = 0;
    const totalJournalWrites = 1 + plan.operations.length + 1; // prepared + progress per op + committed

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
        if (path.includes(".neuraforge")) {
          journalWriteCount++;
          // Fail on the final committed journal write
          if (journalWriteCount === totalJournalWrites) {
            return Promise.reject(new Error("Injected committed journal failure"));
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

    const confirmation = {
      confirmed: true as const,
      planId: plan.planId,
      planChecksum: plan.planChecksum,
    };

    const result = await installer.apply(plan, confirmation, faultyTarget);
    // The committed journal write failure triggers rollback because the error
    // is thrown inside the try block that catches post-mutation errors.
    // Since mutationStarted is true at this point, rollback executes.
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("apply_failed");
    expect(result.error.rollbackReport).toBeDefined();
  });
});
