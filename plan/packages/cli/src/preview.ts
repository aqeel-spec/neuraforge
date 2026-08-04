/**
 * Pure preview operation.
 *
 * Validates the request, resolves the exact component from a verified bundle,
 * verifies every source byte + artifact checksum, maps paths deterministically,
 * and produces a deterministic InstallPlan.
 *
 * Invokes ZERO target mutation methods. Identical inputs/target => byte-equivalent plan.
 *
 * Plan computation order:
 *   1. Build draft plan (without planId and planChecksum)
 *   2. Compute checksum over complete canonical payload
 *   3. Derive planId from checksum
 *   4. Produce final plan with planId and planChecksum
 */

import type { Checksum } from "@neuraforge/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge/schemas";
import {
  canonicalizeTextBytes,
  computeSha256Digest,
  computeFileSetChecksum,
} from "@neuraforge/catalog-core";
import type { RegistryBundleReader, RegistryArtifactEntry } from "@neuraforge/registry-builder";
import type { ReadOnlyTarget } from "./target.js";
import type {
  InstallRequest,
  InstallPlan,
  FileChange,
  DependencyChange,
  TargetPrecondition,
  ApplyOperation,
  RollbackAction,
  InstallerResult,
  InstallerError,
} from "./types.js";
import { validateConfinedPath } from "./path-security.js";
import { isExactSemanticVersion } from "@neuraforge/catalog-core";
import { computePlanChecksum, derivePlanId } from "./plan-integrity.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function computeContentChecksum(content: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(content);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function preview(
  reader: RegistryBundleReader,
  request: InstallRequest,
  target: ReadOnlyTarget,
): Promise<InstallerResult<InstallPlan>> {
  // --- Validate request fields ---
  const validationErrors: InstallerError["fields"] extends readonly (infer T)[] | undefined
    ? T[]
    : never = [];

  if (!request.stableId || request.stableId.trim().length === 0) {
    validationErrors.push({
      path: "stableId",
      constraint: "non_empty",
      guidance: "Provide a component stableId",
    });
  }

  if (!request.version || !isExactSemanticVersion(request.version)) {
    validationErrors.push({
      path: "version",
      constraint: "exact_semver",
      guidance: "Provide an exact semantic version (e.g. 1.0.0)",
    });
  }

  if (!request.destination || request.destination.trim().length === 0) {
    validationErrors.push({
      path: "destination",
      constraint: "non_empty",
      guidance: "Provide a destination path",
    });
  } else {
    const destError = validateConfinedPath(request.destination);
    if (destError) {
      validationErrors.push({
        path: "destination",
        constraint: "confined_path",
        guidance: destError.reason,
      });
    }
  }

  // Validate approvedOverwritePaths
  if (request.approvedOverwritePaths) {
    for (const ap of request.approvedOverwritePaths) {
      const apError = validateConfinedPath(ap);
      if (apError) {
        validationErrors.push({
          path: `approvedOverwritePaths[${ap}]`,
          constraint: "confined_path",
          guidance: apError.reason,
        });
      }
    }
  }

  if (validationErrors.length > 0) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Install request validation failed",
        fields: validationErrors,
      },
    };
  }

  // --- Resolve component ---
  const componentResult = reader.getComponent(request.stableId, request.version);
  if (!componentResult.ok) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: componentResult.error.message,
        alternatives: componentResult.error.alternatives,
      },
    };
  }

  const entry: RegistryArtifactEntry = componentResult.value;

  // --- Verify every source file checksum ---
  for (const file of entry.sourceFiles) {
    const recomputed = await computeContentChecksum(file.content);
    if (recomputed.digest !== file.checksum.digest) {
      return {
        ok: false,
        error: {
          code: "integrity_failed",
          message: `Source file '${file.path}' checksum mismatch: expected ${file.checksum.digest}, got ${recomputed.digest}`,
        },
      };
    }
  }

  // --- Verify artifact checksum (file-set checksum) ---
  const artifactChecksum = await computeFileSetChecksum(
    entry.sourceFiles.map((f) => ({ path: f.path, content: f.content })),
  );
  if (artifactChecksum.digest !== entry.checksum.digest) {
    return {
      ok: false,
      error: {
        code: "integrity_failed",
        message: `Artifact checksum mismatch: expected ${entry.checksum.digest}, got ${artifactChecksum.digest}`,
      },
    };
  }

  // --- Map source paths under destination ---
  const approvedPaths = new Set(request.approvedOverwritePaths ?? []);
  const fileChanges: FileChange[] = [];
  const preconditions: TargetPrecondition[] = [];
  const operations: ApplyOperation[] = [];
  const rollbackActions: RollbackAction[] = [];
  const sourceChecksums: { path: string; checksum: Checksum }[] = [];

  // Sort source files by path for deterministic order
  const sortedFiles = [...entry.sourceFiles].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );

  // Track approved paths that matched conflicts for validation
  const usedApprovals = new Set<string>();

  for (const file of sortedFiles) {
    // Validate source file path
    const filePathError = validateConfinedPath(file.path);
    if (filePathError) {
      return {
        ok: false,
        error: {
          code: "path_security_violation",
          message: `Source file path '${file.path}' is invalid: ${filePathError.reason}`,
        },
      };
    }

    const targetPath = `${request.destination}/${file.path}`;
    const targetPathError = validateConfinedPath(targetPath);
    if (targetPathError) {
      return {
        ok: false,
        error: {
          code: "path_security_violation",
          message: `Target path '${targetPath}' is invalid: ${targetPathError.reason}`,
        },
      };
    }

    sourceChecksums.push({ path: file.path, checksum: file.checksum });

    const existingContent = await target.readFile(targetPath);
    const afterChecksum = await computeContentChecksum(file.content);

    if (existingContent === undefined) {
      // File does not exist — add
      preconditions.push({ path: targetPath, exists: false });
      fileChanges.push({
        path: targetPath,
        kind: "add",
        sourceChecksum: file.checksum,
        afterChecksum,
      });
      operations.push({
        index: operations.length,
        kind: "write",
        path: targetPath,
        content: file.content,
        checksum: afterChecksum,
      });
      rollbackActions.push({ path: targetPath, kind: "delete" });
    } else {
      const beforeChecksum = await computeContentChecksum(existingContent);
      preconditions.push({ path: targetPath, exists: true, checksum: beforeChecksum });

      if (beforeChecksum.digest === afterChecksum.digest) {
        // Unchanged
        fileChanges.push({
          path: targetPath,
          kind: "unchanged",
          sourceChecksum: file.checksum,
          beforeChecksum,
          afterChecksum,
        });
      } else if (approvedPaths.has(targetPath)) {
        // Approved overwrite (modify)
        usedApprovals.add(targetPath);
        fileChanges.push({
          path: targetPath,
          kind: "modify",
          sourceChecksum: file.checksum,
          beforeChecksum,
          afterChecksum,
        });
        operations.push({
          index: operations.length,
          kind: "write",
          path: targetPath,
          content: file.content,
          checksum: afterChecksum,
        });
        rollbackActions.push({
          path: targetPath,
          kind: "restore",
          restoreContent: existingContent,
          restoreChecksum: beforeChecksum,
        });
      } else {
        // Conflict — not approved
        fileChanges.push({
          path: targetPath,
          kind: "conflict",
          sourceChecksum: file.checksum,
          beforeChecksum,
          afterChecksum,
        });
      }
    }
  }

  // Validate that approved paths only reference actual conflicts or modifications
  for (const ap of approvedPaths) {
    if (!usedApprovals.has(ap)) {
      // Check if it's a known target path at all
      const isKnownPath = sortedFiles.some((f) => `${request.destination}/${f.path}` === ap);
      if (!isKnownPath) {
        return {
          ok: false,
          error: {
            code: "validation_error",
            message: `approvedOverwritePaths contains unknown path '${ap}' that is not a target file`,
            fields: [
              {
                path: `approvedOverwritePaths[${ap}]`,
                constraint: "known_conflict_path",
                guidance: "Only paths that exist and differ can be approved for overwrite",
              },
            ],
          },
        };
      }
      // It's a known path but not conflicting — also a validation error
      const isUnchanged = fileChanges.some((fc) => fc.path === ap && fc.kind === "unchanged");
      if (isUnchanged) {
        return {
          ok: false,
          error: {
            code: "validation_error",
            message: `approvedOverwritePaths contains '${ap}' which is unchanged (no conflict)`,
            fields: [
              {
                path: `approvedOverwritePaths[${ap}]`,
                constraint: "conflicting_path_only",
                guidance:
                  "Only conflicting paths (existing files with different content) can be approved",
              },
            ],
          },
        };
      }
    }
  }

  // Reverse rollback actions for reverse-order execution
  const reversedRollback = [...rollbackActions].reverse();

  // --- Compute dependencies ---
  const dependencies: DependencyChange[] = entry.dependencies.map((d) => ({
    name: d.name,
    version: d.version,
    source: d.source,
    action: "add" as const,
  }));

  // --- Build draft plan (planId and planChecksum are placeholders for computation) ---
  const draftPlan: InstallPlan = {
    planId: "",
    planChecksum: { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest: "" },
    request,
    artifactRef: entry.ref,
    registryLocation: entry.registryLocation,
    artifactChecksum: entry.checksum,
    sourceChecksums,
    dependencies,
    fileChanges,
    preconditions,
    operations,
    rollbackActions: reversedRollback,
    compatibility: [...entry.compatibility],
    provenance: [...entry.provenance],
    installation: entry.installation.map((i) => ({
      step: i.step,
      description: i.description,
      ...(i.command !== undefined ? { command: i.command } : {}),
    })),
  };

  // --- Compute checksum over complete canonical payload, then derive planId ---
  const digest = await computePlanChecksum(draftPlan);
  const planId = derivePlanId(digest);
  const planChecksumRecord: Checksum = {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };

  const plan: InstallPlan = {
    ...draftPlan,
    planId,
    planChecksum: planChecksumRecord,
  };

  return { ok: true, value: plan };
}
