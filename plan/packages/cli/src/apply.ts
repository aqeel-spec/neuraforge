/**
 * Journaled apply operation.
 *
 * Requires confirmed:true, exact planId and plan checksum match.
 * Before any write:
 *   1. Verifies plan integrity (recomputes checksum and planId)
 *   2. Revalidates artifact from Registry (all source files and artifact checksum)
 *   3. Validates operations map exactly to registry source content
 *   4. Validates rollback actions correspond exactly to operations
 *   5. Validates confirmation approval set equality
 *   6. Revalidates every target precondition
 *
 * Transaction ordering:
 *  a) write prepared journal
 *  b) apply operations one at a time, updating journal progress
 *  c) verify postconditions
 *  d) mark journal committed and return receipt
 *
 * On failure after mutation: executes exact rollback in reverse order.
 */

import type { Checksum } from "@neuraforge-ui/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import {
  canonicalizeTextBytes,
  computeSha256Digest,
  computeFileSetChecksum,
} from "@neuraforge-ui/catalog-core";
import { toJsonValue } from "@neuraforge-ui/registry-builder";
import type { RegistryBundleReader, RegistryArtifactEntry } from "@neuraforge-ui/registry-builder";
import type { MutableTarget } from "./target.js";
import type {
  InstallPlan,
  Confirmation,
  InstallJournal,
  InstallReceipt,
  InstallerResult,
} from "./types.js";
import { validateConfinedPath } from "./path-security.js";
import { executeRollback } from "./rollback.js";
import { verifyPlanIntegrity } from "./plan-integrity.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function computeContentChecksum(content: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(content);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

function checksumsEqual(a: Checksum, b: Checksum): boolean {
  // Runtime string comparison — the type says literals, but untrusted input
  // may have arbitrary values at runtime.
  const aAlg: string = a.algorithm;
  const bAlg: string = b.algorithm;
  const aCan: string = a.canonicalization;
  const bCan: string = b.canonicalization;
  return aAlg === bAlg && aCan === bCan && a.digest === b.digest;
}

// ---------------------------------------------------------------------------
// Journal path helper
// ---------------------------------------------------------------------------

const JOURNAL_DIR = ".neuraforge/transactions";

function journalPath(planId: string): string {
  return `${JOURNAL_DIR}/${planId}.json`;
}

// ---------------------------------------------------------------------------
// Journal serialization
// ---------------------------------------------------------------------------

function serializeJournal(journal: InstallJournal): string {
  return JSON.stringify(toJsonValue(journal));
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

export async function apply(
  plan: InstallPlan,
  confirmation: Confirmation,
  target: MutableTarget,
  reader?: RegistryBundleReader,
): Promise<InstallerResult<InstallReceipt>> {
  // --- Validate confirmation (runtime check against untrusted input) ---
  const confirmedValue: unknown = confirmation.confirmed;
  if (confirmedValue !== true) {
    return {
      ok: false,
      error: {
        code: "confirmation_required",
        message: "Confirmation must have confirmed:true",
      },
    };
  }

  if (confirmation.planId !== plan.planId) {
    return {
      ok: false,
      error: {
        code: "confirmation_mismatch",
        message: `Confirmation planId '${confirmation.planId}' does not match plan '${plan.planId}'`,
      },
    };
  }

  // Compare full checksum object (algorithm, canonicalization, digest)
  if (!checksumsEqual(confirmation.planChecksum, plan.planChecksum)) {
    return {
      ok: false,
      error: {
        code: "confirmation_mismatch",
        message: "Confirmation planChecksum does not match plan checksum",
      },
    };
  }

  // --- (C) CONFIRMATION AUTHORITY: exact set equality of approved overwrite paths ---
  const planApproved = new Set(plan.request.approvedOverwritePaths ?? []);
  const confirmApproved = new Set(confirmation.approvedOverwritePaths ?? []);

  if (planApproved.size !== confirmApproved.size) {
    return {
      ok: false,
      error: {
        code: "confirmation_mismatch",
        message:
          "Confirmation approvedOverwritePaths must exactly match plan request approvedOverwritePaths",
      },
    };
  }

  for (const cp of confirmApproved) {
    if (!planApproved.has(cp)) {
      return {
        ok: false,
        error: {
          code: "confirmation_mismatch",
          message: `Confirmation approvedOverwritePaths contains '${cp}' not in plan request`,
        },
      };
    }
  }

  for (const pp of planApproved) {
    if (!confirmApproved.has(pp)) {
      return {
        ok: false,
        error: {
          code: "confirmation_mismatch",
          message: `Confirmation approvedOverwritePaths missing '${pp}' from plan request`,
        },
      };
    }
  }

  // --- (A) PLAN INTEGRITY: recompute checksum and planId, reject tampered plans ---
  const integrityResult = await verifyPlanIntegrity(plan);
  if (!integrityResult.valid) {
    return {
      ok: false,
      error: {
        code: "integrity_failed",
        message: `Plan integrity verification failed: expected checksum ${integrityResult.expectedChecksum}, got ${integrityResult.actualChecksum}; expected planId ${integrityResult.expectedPlanId}, got ${integrityResult.actualPlanId}`,
      },
    };
  }

  // --- (B) REGISTRY REVALIDATION: verify artifact and source content from Registry ---
  if (reader) {
    const componentResult = reader.getComponent(
      plan.artifactRef.stableId,
      plan.artifactRef.version,
    );
    if (!componentResult.ok) {
      return {
        ok: false,
        error: {
          code: "integrity_failed",
          message: `Registry artifact not found: ${componentResult.error.message}`,
        },
      };
    }

    const entry: RegistryArtifactEntry = componentResult.value;

    // Verify artifact checksum matches plan
    if (!checksumsEqual(plan.artifactChecksum, entry.checksum)) {
      return {
        ok: false,
        error: {
          code: "integrity_failed",
          message: `Plan artifactChecksum does not match Registry entry`,
        },
      };
    }

    // Verify all source file checksums from Registry
    for (const file of entry.sourceFiles) {
      const recomputed = await computeContentChecksum(file.content);
      if (recomputed.digest !== file.checksum.digest) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Registry source file '${file.path}' checksum mismatch`,
          },
        };
      }
    }

    // Recompute file-set checksum from Registry source
    const recomputedArtifact = await computeFileSetChecksum(
      entry.sourceFiles.map((f) => ({ path: f.path, content: f.content })),
    );
    if (recomputedArtifact.digest !== entry.checksum.digest) {
      return {
        ok: false,
        error: {
          code: "integrity_failed",
          message: `Registry file-set checksum recomputation failed`,
        },
      };
    }

    // Verify plan sourceChecksums match Registry exactly
    const registrySourceMap = new Map(entry.sourceFiles.map((f) => [f.path, f]));
    for (const sc of plan.sourceChecksums) {
      const registryFile = registrySourceMap.get(sc.path);
      if (!registryFile) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Plan sourceChecksum path '${sc.path}' not found in Registry`,
          },
        };
      }
      if (!checksumsEqual(sc.checksum, registryFile.checksum)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Plan sourceChecksum for '${sc.path}' does not match Registry`,
          },
        };
      }
    }

    // --- Validate operations map exactly to registry source content ---
    const operationPaths = new Set<string>();
    const operationIndexes = new Set<number>();

    for (const op of plan.operations) {
      // Reject duplicate indexes
      if (operationIndexes.has(op.index)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Duplicate operation index ${String(op.index)}`,
          },
        };
      }
      operationIndexes.add(op.index);

      // Reject duplicate paths
      if (operationPaths.has(op.path)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Duplicate operation path '${op.path}'`,
          },
        };
      }
      operationPaths.add(op.path);

      // Operation path must be ${destination}/${registrySource.path}
      const prefix = plan.request.destination + "/";
      if (!op.path.startsWith(prefix)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Operation path '${op.path}' does not start with destination '${plan.request.destination}/'`,
          },
        };
      }
      const relativePath = op.path.slice(prefix.length);
      const registryFile = registrySourceMap.get(relativePath);
      if (!registryFile) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Operation path '${op.path}' (relative: '${relativePath}') not found in Registry sources`,
          },
        };
      }

      // Operation content must equal verified Registry source content
      if (op.content !== registryFile.content) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Operation content for '${op.path}' does not match Registry source`,
          },
        };
      }

      // Operation checksum must match content
      const recomputedOpChecksum = await computeContentChecksum(op.content);
      if (!checksumsEqual(op.checksum, recomputedOpChecksum)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Operation checksum for '${op.path}' does not match recomputed content checksum`,
          },
        };
      }
    }

    // Validate no extra operations beyond what fileChanges allow
    // Operations can only include add/modify fileChanges; unchanged/conflict are omitted
    const expectedOpPaths = new Set(
      plan.fileChanges
        .filter((fc) => fc.kind === "add" || fc.kind === "modify")
        .map((fc) => fc.path),
    );
    for (const opPath of operationPaths) {
      if (!expectedOpPaths.has(opPath)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Operation path '${opPath}' not represented in fileChanges as add/modify`,
          },
        };
      }
    }

    // --- Validate rollback actions correspond exactly to operations ---
    // Each add operation => delete rollback; each modify operation => restore rollback
    const addOps = plan.fileChanges.filter((fc) => fc.kind === "add").map((fc) => fc.path);
    const modifyOps = plan.fileChanges.filter((fc) => fc.kind === "modify").map((fc) => fc.path);
    for (const addPath of addOps) {
      const ra = plan.rollbackActions.find((r) => r.path === addPath);
      if (!ra || ra.kind !== "delete") {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Add operation '${addPath}' missing corresponding delete rollback action`,
          },
        };
      }
    }

    for (const modPath of modifyOps) {
      const ra = plan.rollbackActions.find((r) => r.path === modPath);
      if (!ra || ra.kind !== "restore") {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Modify operation '${modPath}' missing corresponding restore rollback action`,
          },
        };
      }
      // Validate restore content checksum matches the precondition
      const precondition = plan.preconditions.find((p) => p.path === modPath);
      if (precondition?.checksum && ra.restoreChecksum) {
        if (!checksumsEqual(ra.restoreChecksum, precondition.checksum)) {
          return {
            ok: false,
            error: {
              code: "integrity_failed",
              message: `Rollback restore checksum for '${modPath}' does not match precondition`,
            },
          };
        }
      }
    }

    // No extra rollback actions
    for (const ra of plan.rollbackActions) {
      if (!operationPaths.has(ra.path)) {
        return {
          ok: false,
          error: {
            code: "integrity_failed",
            message: `Rollback action path '${ra.path}' has no corresponding operation`,
          },
        };
      }
    }

    // Verify rollback restore content checksums are valid
    for (const ra of plan.rollbackActions) {
      if (
        ra.kind === "restore" &&
        ra.restoreContent !== undefined &&
        ra.restoreChecksum !== undefined
      ) {
        const recomputedRestore = await computeContentChecksum(ra.restoreContent);
        if (!checksumsEqual(ra.restoreChecksum, recomputedRestore)) {
          return {
            ok: false,
            error: {
              code: "integrity_failed",
              message: `Rollback restore content checksum mismatch for '${ra.path}'`,
            },
          };
        }
      }
    }
  }

  // --- Revalidate target preconditions ---
  for (const precondition of plan.preconditions) {
    const pathError = validateConfinedPath(precondition.path);
    if (pathError) {
      return {
        ok: false,
        error: {
          code: "path_security_violation",
          message: `Precondition path '${precondition.path}' is invalid: ${pathError.reason}`,
        },
      };
    }

    const exists = await target.exists(precondition.path);
    if (exists !== precondition.exists) {
      return {
        ok: false,
        error: {
          code: "precondition_failed",
          message: `Target precondition failed for '${precondition.path}': expected exists=${String(precondition.exists)}, got ${String(exists)}`,
        },
      };
    }

    if (precondition.exists && precondition.checksum) {
      const currentChecksum = await target.checksum(precondition.path);
      if (!currentChecksum || currentChecksum.digest !== precondition.checksum.digest) {
        return {
          ok: false,
          error: {
            code: "precondition_failed",
            message: `Target precondition failed for '${precondition.path}': checksum changed since preview`,
          },
        };
      }
    }
  }

  // --- Validate journal path ---
  const jPath = journalPath(plan.planId);
  const jPathError = validateConfinedPath(jPath);
  if (jPathError) {
    return {
      ok: false,
      error: {
        code: "path_security_violation",
        message: `Journal path '${jPath}' is invalid: ${jPathError.reason}`,
      },
    };
  }

  // --- Build journal (stores full immutable plan for rollback verification) ---
  const backups = plan.rollbackActions
    .filter(
      (
        ra,
      ): ra is typeof ra & {
        restoreContent: string;
        restoreChecksum: NonNullable<typeof ra.restoreChecksum>;
      } =>
        ra.kind === "restore" &&
        ra.restoreContent !== undefined &&
        ra.restoreChecksum !== undefined,
    )
    .map((ra) => ({
      path: ra.path,
      content: ra.restoreContent,
      checksum: ra.restoreChecksum,
    }));

  const journal: InstallJournal = {
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    status: "prepared",
    operationIndex: -1,
    backups,
    rollbackActions: plan.rollbackActions,
    plan,
  };

  // --- Step a) Write prepared journal ---
  try {
    await target.ensureDir(JOURNAL_DIR);
    await target.writeFile(jPath, serializeJournal(journal));
  } catch (err) {
    // Failure before any mutation — no rollback needed
    return {
      ok: false,
      error: {
        code: "apply_failed",
        message: `Failed to write prepared journal: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }

  // --- Step b) Apply operations one at a time ---
  let mutationStarted = false;
  try {
    for (const op of plan.operations) {
      // Validate operation path
      const opPathError = validateConfinedPath(op.path);
      if (opPathError) {
        throw new Error(`Operation path '${op.path}' is invalid: ${opPathError.reason}`);
      }

      // Ensure parent directory exists
      const lastSlash = op.path.lastIndexOf("/");
      if (lastSlash > 0) {
        await target.ensureDir(op.path.slice(0, lastSlash));
      }

      // Write file
      await target.writeFile(op.path, op.content);
      mutationStarted = true;

      // Update journal progress
      const progressJournal: InstallJournal = {
        ...journal,
        status: "in_progress",
        operationIndex: op.index,
      };
      await target.writeFile(jPath, serializeJournal(progressJournal));
    }

    // --- Step c) Verify postconditions ---
    for (const op of plan.operations) {
      const currentChecksum = await target.checksum(op.path);
      if (!currentChecksum || currentChecksum.digest !== op.checksum.digest) {
        throw new Error(
          `Postcondition failed for '${op.path}': expected ${op.checksum.digest}, got ${currentChecksum?.digest ?? "missing"}`,
        );
      }
    }

    // --- Step d) Mark journal committed ---
    const committedJournal: InstallJournal = {
      ...journal,
      status: "committed",
      operationIndex: plan.operations.length - 1,
    };
    await target.writeFile(jPath, serializeJournal(committedJournal));

    const receipt: InstallReceipt = {
      planId: plan.planId,
      planChecksum: plan.planChecksum,
      artifactRef: plan.artifactRef,
      filesWritten: plan.operations.map((op) => op.path),
      journalPath: jPath,
    };

    return { ok: true, value: receipt };
  } catch (err) {
    // Failure after mutation — execute rollback
    if (!mutationStarted) {
      return {
        ok: false,
        error: {
          code: "apply_failed",
          message: `Apply failed before mutation: ${err instanceof Error ? err.message : String(err)}`,
        },
      };
    }

    // Execute exact rollback from plan with planId
    const rollbackReport = await executeRollback(plan.rollbackActions, target, plan.planId);

    // Update journal to rolled_back
    try {
      const rolledBackJournal: InstallJournal = {
        ...journal,
        status: "rolled_back",
        operationIndex: plan.operations.length - 1,
      };
      await target.writeFile(jPath, serializeJournal(rolledBackJournal));
    } catch {
      // Journal update failure after rollback is documented/acceptable
    }

    return {
      ok: false,
      error: {
        code: "apply_failed",
        message: `Apply failed after mutation: ${err instanceof Error ? err.message : String(err)}. Rollback executed.`,
        rollbackReport,
      },
    };
  }
}
