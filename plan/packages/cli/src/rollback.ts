/**
 * Rollback operations.
 *
 * executeRollback: applies rollback actions in order (already reversed by preview).
 * rollbackFromJournal: loads a journal, validates it including embedded plan
 * integrity, and applies only the verified plan's rollback actions.
 *
 * Repeated rollback is safe (idempotent). Malformed/substituted journals fail closed.
 */

import { CANONICALIZATION_VERSION } from "@neuraforge/schemas";
import { canonicalizeTextBytes, computeSha256Digest } from "@neuraforge/catalog-core";
import type { Checksum } from "@neuraforge/schemas";
import { toJsonValue } from "@neuraforge/registry-builder";
import type { MutableTarget } from "./target.js";
import type {
  RollbackAction,
  RollbackReport,
  RollbackCompletedAction,
  InstallJournal,
  InstallPlan,
  InstallerResult,
} from "./types.js";
import { validateConfinedPath } from "./path-security.js";
import { verifyPlanIntegrity } from "./plan-integrity.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function computeContentChecksum(content: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(content);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

const JOURNAL_DIR = ".neuraforge/transactions";

function journalPath(planId: string): string {
  return `${JOURNAL_DIR}/${planId}.json`;
}

// ---------------------------------------------------------------------------
// Execute rollback actions (used by apply on failure and by rollback command)
// ---------------------------------------------------------------------------

export async function executeRollback(
  actions: readonly RollbackAction[],
  target: MutableTarget,
  planId?: string,
): Promise<RollbackReport> {
  const completedActions: RollbackCompletedAction[] = [];
  const residualMismatches: { path: string; expected?: string; actual?: string }[] = [];

  for (const action of actions) {
    // Validate path
    const pathError = validateConfinedPath(action.path);
    if (pathError) {
      completedActions.push({
        path: action.path,
        kind: action.kind,
        status: "residual_mismatch",
        message: `Path security violation: ${pathError.reason}`,
      });
      residualMismatches.push({
        path: action.path,
        expected: "valid confined path",
        actual: pathError.reason,
      });
      continue;
    }

    try {
      if (action.kind === "delete") {
        const exists = await target.exists(action.path);
        if (!exists) {
          completedActions.push({
            path: action.path,
            kind: action.kind,
            status: "already_restored",
            message: "File already absent",
          });
        } else {
          await target.deleteFile(action.path);
          // Verify deletion
          const stillExists = await target.exists(action.path);
          if (stillExists) {
            completedActions.push({
              path: action.path,
              kind: action.kind,
              status: "residual_mismatch",
              message: "File still exists after delete",
            });
            residualMismatches.push({
              path: action.path,
              expected: "deleted",
              actual: "still exists",
            });
          } else {
            completedActions.push({
              path: action.path,
              kind: action.kind,
              status: "completed",
            });
          }
        }
      } else {
        if (action.restoreContent === undefined || action.restoreChecksum === undefined) {
          completedActions.push({
            path: action.path,
            kind: action.kind,
            status: "residual_mismatch",
            message: "Missing restore content/checksum in rollback action",
          });
          residualMismatches.push({
            path: action.path,
            expected: "restore content",
            actual: "missing",
          });
          continue;
        }

        // Check if already restored
        const currentContent = await target.readFile(action.path);
        if (currentContent !== undefined) {
          const currentChecksum = await computeContentChecksum(currentContent);
          if (currentChecksum.digest === action.restoreChecksum.digest) {
            completedActions.push({
              path: action.path,
              kind: action.kind,
              status: "already_restored",
              message: "File already has original content",
            });
            continue;
          }
        }

        // Ensure parent directory
        const lastSlash = action.path.lastIndexOf("/");
        if (lastSlash > 0) {
          await target.ensureDir(action.path.slice(0, lastSlash));
        }

        await target.writeFile(action.path, action.restoreContent);

        // Verify restoration
        const verifyChecksum = await target.checksum(action.path);
        if (verifyChecksum && verifyChecksum.digest === action.restoreChecksum.digest) {
          completedActions.push({
            path: action.path,
            kind: action.kind,
            status: "completed",
          });
        } else {
          completedActions.push({
            path: action.path,
            kind: action.kind,
            status: "residual_mismatch",
            message: "Restored file checksum mismatch",
          });
          residualMismatches.push({
            path: action.path,
            expected: action.restoreChecksum.digest,
            actual: verifyChecksum?.digest ?? "missing",
          });
        }
      }
    } catch (err) {
      completedActions.push({
        path: action.path,
        kind: action.kind,
        status: "residual_mismatch",
        message: err instanceof Error ? err.message : String(err),
      });
      residualMismatches.push({
        path: action.path,
        expected: action.kind === "delete" ? "deleted" : "restored",
        actual: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return {
    planId: planId ?? "",
    completedActions,
    residualMismatches,
    success: residualMismatches.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Journal type guard
// ---------------------------------------------------------------------------

function isValidChecksum(value: unknown): value is Checksum {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.algorithm === "sha256" &&
    typeof obj.canonicalization === "string" &&
    typeof obj.digest === "string"
  );
}

function isValidRollbackAction(value: unknown): value is RollbackAction {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.path !== "string") return false;
  if (obj.kind !== "restore" && obj.kind !== "delete") return false;

  // Validate path security
  const pathError = validateConfinedPath(obj.path);
  if (pathError) return false;

  if (obj.kind === "restore") {
    if (obj.restoreContent !== undefined && typeof obj.restoreContent !== "string") return false;
    if (obj.restoreChecksum !== undefined && !isValidChecksum(obj.restoreChecksum)) return false;
  }

  return true;
}

function isValidInstallPlan(value: unknown): value is InstallPlan {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.planId !== "string") return false;
  if (!isValidChecksum(obj.planChecksum)) return false;
  if (typeof obj.request !== "object" || obj.request === null) return false;
  if (typeof obj.artifactRef !== "object" || obj.artifactRef === null) return false;
  if (typeof obj.registryLocation !== "string") return false;
  if (!isValidChecksum(obj.artifactChecksum)) return false;
  if (!Array.isArray(obj.sourceChecksums)) return false;
  if (!Array.isArray(obj.dependencies)) return false;
  if (!Array.isArray(obj.fileChanges)) return false;
  if (!Array.isArray(obj.preconditions)) return false;
  if (!Array.isArray(obj.operations)) return false;
  if (!Array.isArray(obj.rollbackActions)) return false;
  if (!Array.isArray(obj.compatibility)) return false;
  if (!Array.isArray(obj.provenance)) return false;
  if (!Array.isArray(obj.installation)) return false;

  // Validate all rollback actions
  for (const ra of obj.rollbackActions as unknown[]) {
    if (!isValidRollbackAction(ra)) return false;
  }

  return true;
}

function isValidJournal(value: unknown): value is InstallJournal {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.planId !== "string") return false;
  if (typeof obj.status !== "string") return false;
  if (typeof obj.operationIndex !== "number") return false;
  if (!isValidChecksum(obj.planChecksum)) return false;
  if (!Array.isArray(obj.backups)) return false;
  if (!Array.isArray(obj.rollbackActions)) return false;

  // Validate the embedded plan is present and valid
  if (!isValidInstallPlan(obj.plan)) return false;

  // Validate rollback actions structure
  for (const ra of obj.rollbackActions as unknown[]) {
    if (!isValidRollbackAction(ra)) return false;
  }

  // Validate backups structure
  for (const b of obj.backups as unknown[]) {
    if (typeof b !== "object" || b === null) return false;
    const backup = b as Record<string, unknown>;
    if (typeof backup.path !== "string") return false;
    if (typeof backup.content !== "string") return false;
    if (!isValidChecksum(backup.checksum)) return false;
  }

  // Reject unknown fields
  const knownKeys = new Set([
    "planId",
    "planChecksum",
    "status",
    "operationIndex",
    "backups",
    "rollbackActions",
    "plan",
  ]);
  for (const key of Object.keys(obj)) {
    if (!knownKeys.has(key)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Rollback from journal
// ---------------------------------------------------------------------------

export async function rollbackFromJournal(
  planId: string,
  target: MutableTarget,
): Promise<InstallerResult<RollbackReport>> {
  // Validate planId for path safety
  const jPath = journalPath(planId);
  const jPathError = validateConfinedPath(jPath);
  if (jPathError) {
    return {
      ok: false,
      error: {
        code: "path_security_violation",
        message: `Journal path for plan '${planId}' is invalid: ${jPathError.reason}`,
      },
    };
  }

  // Load journal
  const content = await target.readFile(jPath);
  if (content === undefined) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `No journal found for plan '${planId}'`,
      },
    };
  }

  // Parse journal
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Journal for plan '${planId}' is malformed (invalid JSON)`,
      },
    };
  }

  // Type-guard validate journal
  if (!isValidJournal(parsed)) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Journal for plan '${planId}' is malformed or contains unsafe paths`,
      },
    };
  }

  const journal: InstallJournal = parsed;

  // Verify journal belongs to requested plan
  if (journal.planId !== planId) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Journal planId '${journal.planId}' does not match requested '${planId}'`,
      },
    };
  }

  // Verify embedded plan's planId matches journal planId
  if (journal.plan.planId !== journal.planId) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Embedded plan planId '${journal.plan.planId}' does not match journal planId '${journal.planId}'`,
      },
    };
  }

  // Verify embedded plan's checksum matches journal planChecksum
  // Use runtime string comparison to catch substitution even though types are literals
  const planAlg: string = journal.plan.planChecksum.algorithm;
  const journalAlg: string = journal.planChecksum.algorithm;
  const planCan: string = journal.plan.planChecksum.canonicalization;
  const journalCan: string = journal.planChecksum.canonicalization;
  if (
    journal.plan.planChecksum.digest !== journal.planChecksum.digest ||
    planAlg !== journalAlg ||
    planCan !== journalCan
  ) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Embedded plan checksum does not match journal planChecksum`,
      },
    };
  }

  // (D) PLAN INTEGRITY: verify embedded plan's integrity using shared verifyPlanIntegrity
  const integrityResult = await verifyPlanIntegrity(journal.plan);
  if (!integrityResult.valid) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Embedded plan integrity verification failed: expected checksum ${integrityResult.expectedChecksum}, got ${integrityResult.actualChecksum}`,
      },
    };
  }

  // Verify rollback actions in journal match embedded plan's rollback actions exactly
  const planActions = journal.plan.rollbackActions;
  const journalActions = journal.rollbackActions;

  if (planActions.length !== journalActions.length) {
    return {
      ok: false,
      error: {
        code: "journal_invalid",
        message: `Journal rollbackActions count (${String(journalActions.length)}) does not match embedded plan (${String(planActions.length)})`,
      },
    };
  }

  for (let i = 0; i < planActions.length; i++) {
    const pa = planActions[i];
    const ja = journalActions[i];
    if (!pa || !ja) {
      return {
        ok: false,
        error: {
          code: "journal_invalid",
          message: `Rollback action at index ${String(i)} is missing`,
        },
      };
    }
    if (pa.path !== ja.path || pa.kind !== ja.kind) {
      return {
        ok: false,
        error: {
          code: "journal_invalid",
          message: `Journal rollbackAction at index ${String(i)} does not match embedded plan`,
        },
      };
    }
    if (pa.kind === "restore") {
      if (pa.restoreContent !== ja.restoreContent) {
        return {
          ok: false,
          error: {
            code: "journal_invalid",
            message: `Journal rollbackAction restoreContent at index ${String(i)} does not match embedded plan`,
          },
        };
      }
      if (pa.restoreChecksum?.digest !== ja.restoreChecksum?.digest) {
        return {
          ok: false,
          error: {
            code: "journal_invalid",
            message: `Journal rollbackAction restoreChecksum at index ${String(i)} does not match embedded plan`,
          },
        };
      }
    }
  }

  // Execute rollback using ONLY the verified embedded plan's rollback actions
  const report = await executeRollback(journal.plan.rollbackActions, target, planId);

  // Update journal status
  try {
    const updatedJournal: InstallJournal = {
      ...journal,
      status: "rolled_back",
    };
    await target.writeFile(jPath, serializeJournal(updatedJournal));
  } catch {
    // Journal update failure after rollback is acceptable
  }

  return { ok: true, value: report };
}

// ---------------------------------------------------------------------------
// Journal serialization (shared with apply)
// ---------------------------------------------------------------------------

function serializeJournal(journal: InstallJournal): string {
  return JSON.stringify(toJsonValue(journal));
}
