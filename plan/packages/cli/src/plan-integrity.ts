/**
 * Plan integrity module.
 *
 * Defines the canonical plan payload (all authority/behavior-bearing fields
 * except planId and planChecksum), computes SHA-256 over canonical JSON bytes,
 * and derives planId deterministically from the complete checksum.
 *
 * Uses registry-builder toJsonValue for closed JSON projection and
 * catalog-core canonicalizeJsonBytes/computeJsonChecksum for deterministic
 * canonical byte generation with lexicographically sorted keys.
 *
 * The canonical payload is: request (including approvals), artifactRef,
 * registryLocation, artifactChecksum, sourceChecksums, dependencies,
 * fileChanges, preconditions, operations (including exact content and checksum),
 * rollbackActions (including restore content/checksum), compatibility,
 * provenance, installation.
 *
 * planId = `plan_${digest}` where digest is the full 64-hex SHA-256 of the
 * canonical payload. No circular fields. Identical request+target => identical
 * plan bytes.
 */

import type { JsonValue } from "@neuraforge/schemas";
import { canonicalizeJsonBytes, computeSha256Digest } from "@neuraforge/catalog-core";
import { toJsonValue } from "@neuraforge/registry-builder";
import type { InstallPlan } from "./types.js";

// ---------------------------------------------------------------------------
// Canonical plan payload
// ---------------------------------------------------------------------------

/**
 * Extracts the canonical plan payload from a plan: all authority/behavior-bearing
 * fields EXCEPT planId and planChecksum.
 */
function extractCanonicalPayload(plan: InstallPlan): JsonValue {
  return toJsonValue({
    request: {
      stableId: plan.request.stableId,
      version: plan.request.version,
      destination: plan.request.destination,
      approvedOverwritePaths: plan.request.approvedOverwritePaths ?? [],
    },
    artifactRef: plan.artifactRef,
    registryLocation: plan.registryLocation,
    artifactChecksum: plan.artifactChecksum,
    sourceChecksums: plan.sourceChecksums,
    dependencies: plan.dependencies,
    fileChanges: plan.fileChanges,
    preconditions: plan.preconditions,
    operations: plan.operations.map((op) => ({
      index: op.index,
      kind: op.kind,
      path: op.path,
      content: op.content,
      checksum: op.checksum,
    })),
    rollbackActions: plan.rollbackActions.map((ra) => ({
      path: ra.path,
      kind: ra.kind,
      ...(ra.restoreContent !== undefined ? { restoreContent: ra.restoreContent } : {}),
      ...(ra.restoreChecksum !== undefined ? { restoreChecksum: ra.restoreChecksum } : {}),
    })),
    compatibility: plan.compatibility,
    provenance: plan.provenance,
    installation: plan.installation,
  });
}

// ---------------------------------------------------------------------------
// Compute plan checksum (SHA-256 over canonical JSON bytes)
// ---------------------------------------------------------------------------

/**
 * Computes the plan checksum: SHA-256 over canonical JSON bytes of the full
 * plan payload (everything except planId and planChecksum).
 */
export async function computePlanChecksum(plan: InstallPlan): Promise<string> {
  const payload = extractCanonicalPayload(plan);
  const bytes = canonicalizeJsonBytes(payload);
  return computeSha256Digest(bytes);
}

/**
 * Derives the planId from the plan checksum digest.
 * Format: `plan_${full64hexDigest}`
 */
export function derivePlanId(digest: string): string {
  return `plan_${digest}`;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface PlanIntegrityResult {
  readonly valid: boolean;
  readonly expectedChecksum: string;
  readonly actualChecksum: string;
  readonly expectedPlanId: string;
  readonly actualPlanId: string;
  readonly checksumMatch: boolean;
  readonly planIdMatch: boolean;
}

/**
 * Recomputes the plan checksum and ID and returns a structured verification
 * result. Does NOT throw; always returns a result.
 */
export async function verifyPlanIntegrity(plan: InstallPlan): Promise<PlanIntegrityResult> {
  const expectedChecksum = await computePlanChecksum(plan);
  const expectedPlanId = derivePlanId(expectedChecksum);
  const actualChecksum = plan.planChecksum.digest;
  const actualPlanId = plan.planId;
  const checksumMatch = expectedChecksum === actualChecksum;
  const planIdMatch = expectedPlanId === actualPlanId;

  return {
    valid: checksumMatch && planIdMatch,
    expectedChecksum,
    actualChecksum,
    expectedPlanId,
    actualPlanId,
    checksumMatch,
    planIdMatch,
  };
}
