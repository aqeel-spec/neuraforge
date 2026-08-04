import type { AccessClassification, FieldError } from "@neuraforge-ui/schemas";

/**
 * Entitlement-free artifact access validation.
 *
 * `AccessClassification` is a closed contract: every field is a fixed constant that
 * describes a public, entitlement-free artifact. Because the constants never vary by
 * Hosted Plan, tier, or artifact maturity (MVP vs. Advanced Capability), any record that
 * validates against this shape automatically satisfies Requirements 1.9, 1.10, 1.11,
 * 18.4, and 18.5: the available artifact/operation set cannot differ by account or plan.
 *
 * This module validates untrusted candidate data (JSON from a release manifest, an
 * external contribution, or a hosted-gateway boundary) against that closed contract and
 * reports every private, premium, paid-only, or license-key violation it detects.
 */

export interface AccessValidation {
  valid: boolean;
  errors: FieldError[];
}

const ALLOWED_ACCESS_FIELDS = new Set<keyof AccessClassification>([
  "visibility",
  "entitlement",
  "paymentRequired",
  "licenseKeyRequired",
  "privateVariant",
  "paidOnlyVariant",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

/**
 * Validates that a candidate access-classification record grants no entitlement,
 * payment, license-key, private-variant, paid-only-variant, or non-public visibility.
 *
 * Accumulates every detected violation instead of stopping at the first one so a caller
 * (Quality Gate, Registry builder, or hosted gateway) can report every blocking condition
 * at once.
 */
export function validateAccessClassification(
  candidate: unknown,
  path = "access",
): AccessValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "access_classification_required",
      path,
      "must be an AccessClassification object",
      "Publish an entitlement-free access classification record.",
    );
    return { valid: false, errors };
  }

  for (const key of Object.keys(candidate)) {
    if (!ALLOWED_ACCESS_FIELDS.has(key as keyof AccessClassification)) {
      error(
        errors,
        "unexpected_access_field",
        `${path}.${key}`,
        "must not declare fields outside the closed AccessClassification contract",
        "Remove the field; entitlement, plan, or tier distinctions are not permitted on artifact access records.",
      );
    }
  }

  if (candidate.visibility !== "public") {
    error(
      errors,
      "private_access_forbidden",
      `${path}.visibility`,
      'must equal "public"',
      "Publish the artifact without a private variant.",
    );
  }
  if (candidate.entitlement !== "none") {
    error(
      errors,
      "premium_entitlement_forbidden",
      `${path}.entitlement`,
      'must equal "none"',
      "Remove premium or plan-scoped entitlement from the artifact.",
    );
  }
  if (candidate.paymentRequired !== false) {
    error(
      errors,
      "payment_required_forbidden",
      `${path}.paymentRequired`,
      "must equal false",
      "Publish the artifact without requiring payment.",
    );
  }
  if (candidate.licenseKeyRequired !== false) {
    error(
      errors,
      "license_key_required_forbidden",
      `${path}.licenseKeyRequired`,
      "must equal false",
      "Publish the artifact without requiring a license key.",
    );
  }
  if (candidate.privateVariant !== false) {
    error(
      errors,
      "private_variant_forbidden",
      `${path}.privateVariant`,
      "must equal false",
      "Remove the private variant of this artifact.",
    );
  }
  if (candidate.paidOnlyVariant !== false) {
    error(
      errors,
      "paid_only_variant_forbidden",
      `${path}.paidOnlyVariant`,
      "must equal false",
      "Remove the paid-only variant of this artifact.",
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that every entry in a set of access-classification records is
 * entitlement-free, and that Advanced Capabilities (recorded here only by their access
 * classification) use the identical policy as MVP artifacts. Because the policy is a
 * single closed contract rather than a per-kind contract, identical validation is applied
 * regardless of artifact kind.
 */
export function validateAccessClassifications(
  candidates: readonly { path: string; access: unknown }[],
): AccessValidation {
  const errors: FieldError[] = [];
  for (const candidate of candidates) {
    errors.push(...validateAccessClassification(candidate.access, candidate.path).errors);
  }
  return { valid: errors.length === 0, errors };
}
