import type { ArtifactRef, FieldError, Result } from "@neuraforge-ui/schemas";

import { validateAccessClassification } from "./access.js";
import { prefixFieldErrors, type ValidationContext } from "./errors.js";
import {
  traverseProductionInventory,
  validateDependencyReplacementRecord,
  type DependencyReplacementRecord,
  type ProvenanceRejectionReason,
} from "./provenance.js";

/**
 * Entitlement-free access and provenance eligibility evaluation for a candidate release.
 *
 * Combines the closed access-classification policy (`access.ts`) with license/source
 * provenance traversal (`provenance.ts`) into the single rejection decision required by
 * Requirements 1.2, 1.4 through 1.12, and 11.11: a release is ineligible if any artifact
 * declares a private, premium, paid-only, or license-key entitlement, or if any direct or
 * transitive dependency/asset in its production inventory has an incompatible license, an
 * unresolved source, or incomplete provenance.
 */

export interface ReleaseArtifactCandidate {
  ref: ArtifactRef;
  access: unknown;
}

export interface ReleaseEligibilityInput {
  artifacts: readonly ReleaseArtifactCandidate[];
  productionInventory: readonly unknown[];
  dependencyReplacements?: readonly unknown[];
}

/** Closed set of reasons the whole release was rejected. */
export type ReleaseRejectionCategory =
  | "private_variant"
  | "premium_entitlement"
  | "paid_only_variant"
  | "license_key_required"
  | ProvenanceRejectionReason;

export interface ReleaseEligibilityResult {
  eligible: boolean;
  rejectionCategories: ReleaseRejectionCategory[];
  dependencyReplacements: DependencyReplacementRecord[];
}

const ACCESS_ERROR_CODE_TO_CATEGORY: Record<string, ReleaseRejectionCategory> = {
  private_access_forbidden: "private_variant",
  premium_entitlement_forbidden: "premium_entitlement",
  payment_required_forbidden: "paid_only_variant",
  license_key_required_forbidden: "license_key_required",
  private_variant_forbidden: "private_variant",
  paid_only_variant_forbidden: "paid_only_variant",
};

function addCategory(
  categories: ReleaseRejectionCategory[],
  category: ReleaseRejectionCategory,
): void {
  if (!categories.includes(category)) categories.push(category);
}

/**
 * Evaluates whether a candidate release satisfies the entitlement-free access policy and
 * complete/compatible provenance requirements.
 *
 * This is a pure decision function: it accumulates every detected field error and
 * rejection category rather than stopping at the first violation, so a caller (the
 * Registry builder or Quality Gate) can report every blocking condition in one pass.
 */
export function evaluateReleaseEligibility(input: ReleaseEligibilityInput): {
  result: ReleaseEligibilityResult;
  fieldErrors: FieldError[];
} {
  const fieldErrors: FieldError[] = [];
  const rejectionCategories: ReleaseRejectionCategory[] = [];

  input.artifacts.forEach((artifact, index) => {
    const accessResult = validateAccessClassification(
      artifact.access,
      `artifacts[${String(index)}].access`,
    );
    fieldErrors.push(...accessResult.errors);
    for (const err of accessResult.errors) {
      const category = ACCESS_ERROR_CODE_TO_CATEGORY[err.code];
      if (category) addCategory(rejectionCategories, category);
    }
  });

  const traversal = traverseProductionInventory(input.productionInventory);
  fieldErrors.push(...traversal.errors);
  for (const reason of traversal.rejectionReasons) addCategory(rejectionCategories, reason);

  const dependencyReplacements: DependencyReplacementRecord[] = [];
  (input.dependencyReplacements ?? []).forEach((candidate, index) => {
    const replacementResult = validateDependencyReplacementRecord(
      candidate,
      `dependencyReplacements[${String(index)}]`,
    );
    fieldErrors.push(...replacementResult.errors);
    if (replacementResult.valid) {
      dependencyReplacements.push(candidate as DependencyReplacementRecord);
    }
  });

  return {
    result: {
      eligible: fieldErrors.length === 0,
      rejectionCategories,
      dependencyReplacements,
    },
    fieldErrors,
  };
}

/**
 * Result-wrapped entry point for adapters (Registry builder, Quality Gate, hosted
 * gateway boundary) that need an `ErrorEnvelope` rather than raw field errors.
 */
export function checkReleaseEligibility(
  input: ReleaseEligibilityInput,
  context: ValidationContext,
): Result<ReleaseEligibilityResult> {
  const { result, fieldErrors } = evaluateReleaseEligibility(input);

  if (result.eligible) {
    return { ok: true, value: result };
  }

  const category = result.rejectionCategories[0];
  const code = category ? `release_rejected_${category}` : "release_rejected";

  return {
    ok: false,
    error: {
      error: {
        code,
        category: "policy",
        message: "The release contains one or more entitlement, license, or provenance violations.",
        retryable: false,
        fields: prefixFieldErrors(fieldErrors, ""),
        resource: { kind: "release" },
        requestId: context.requestId,
      },
    },
  };
}
