import type { DependencyInventoryItem, FieldError, LicenseProvenance } from "@neuraforge/schemas";

/**
 * License provenance and dependency-inventory validation.
 *
 * Covers the "incompatible-license", "unresolved-source", and "incomplete-provenance"
 * rejection categories from Requirements 1.4, 1.5, 1.6, 3.5, 3.7, 5.2, 5.22, and 11.11.
 * `access.ts` covers the "private", "premium", "paid-only", and "license-key" categories.
 */

/** Closed set of reasons a candidate artifact/dependency record must be rejected for. */
export type ProvenanceRejectionReason =
  | "incompatible_license"
  | "unresolved_source"
  | "incomplete_provenance";

export interface ProvenanceValidation {
  valid: boolean;
  errors: FieldError[];
  rejectionReasons: ProvenanceRejectionReason[];
}

const REQUIRED_NON_EMPTY_FIELDS: (keyof LicenseProvenance)[] = [
  "name",
  "version",
  "source",
  "copyright",
  "spdxIdentifier",
  "licenseTextPath",
];

const REVIEW_STATUSES = new Set(["pending", "approved", "rejected"]);
/** Version tokens that reference a moving target instead of an exact resolvable version. */
const UNRESOLVED_VERSION_PATTERN = /^\s*$|[\^~*xX]|>=?|<=?|\blatest\b|\bnext\b/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function looksLikeResolvableUri(value: unknown): boolean {
  if (!isNonEmptyString(value)) return false;
  try {
    // A resolvable source must carry an explicit scheme (https:, git+https:, file:, npm:, etc.).
    const parsed = new URL(value);
    return parsed.protocol.length > 1;
  } catch {
    return false;
  }
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

function addReason(reasons: ProvenanceRejectionReason[], reason: ProvenanceRejectionReason): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

/**
 * Validates a single License Provenance record.
 *
 * Rejects incomplete provenance (missing/empty required fields or a pending review),
 * unresolved source references (missing, empty, or non-resolvable source URI, or an
 * unpinned/range dependency version), and incompatible licenses (a review that concluded
 * the material is not under a Compatible License).
 */
export function validateLicenseProvenance(
  candidate: unknown,
  path = "provenance",
): ProvenanceValidation {
  const errors: FieldError[] = [];
  const rejectionReasons: ProvenanceRejectionReason[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "provenance_required",
      path,
      "must be a LicenseProvenance object",
      "Publish complete License Provenance for this dependency or asset.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
    return { valid: false, errors, rejectionReasons };
  }

  for (const field of REQUIRED_NON_EMPTY_FIELDS) {
    if (!isNonEmptyString(candidate[field])) {
      error(
        errors,
        "incomplete_provenance",
        `${path}.${field}`,
        "must be a non-empty string",
        `Publish the ${field} for this dependency or asset's License Provenance.`,
      );
      addReason(rejectionReasons, "incomplete_provenance");
    }
  }

  if (!Array.isArray(candidate.redistributionObligations)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.redistributionObligations`,
      "must be an array of redistribution obligation strings",
      "Publish the redistribution obligations, or an empty array if none apply.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  const reviewStatus = candidate.reviewStatus;
  if (typeof reviewStatus !== "string" || !REVIEW_STATUSES.has(reviewStatus)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.reviewStatus`,
      'must be one of "pending", "approved", or "rejected"',
      "Publish the license-compatibility review outcome.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  } else if (reviewStatus === "rejected") {
    error(
      errors,
      "incompatible_license",
      `${path}.reviewStatus`,
      "must not be a reviewed-incompatible license",
      "Replace or remove the dependency or asset until it uses a Compatible License.",
    );
    addReason(rejectionReasons, "incompatible_license");
  } else if (reviewStatus === "pending") {
    error(
      errors,
      "incomplete_provenance",
      `${path}.reviewStatus`,
      'must not be "pending" for a published release',
      "Complete the license-compatibility review before this material can be released.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  if (isNonEmptyString(candidate.source) && !looksLikeResolvableUri(candidate.source)) {
    error(
      errors,
      "unresolved_source",
      `${path}.source`,
      "must be a resolvable absolute URI",
      "Publish a resolvable source location (an absolute URL) for this dependency or asset.",
    );
    addReason(rejectionReasons, "unresolved_source");
  }

  return { valid: errors.length === 0, errors, rejectionReasons };
}

/**
 * Validates a Dependency Inventory Item: its own required fields plus its nested
 * License Provenance. Also rejects an unresolved (range/tag/moving-target) dependency
 * version, since a range cannot be an exact, checksum-verifiable release dependency.
 */
export function validateDependencyInventoryItem(
  candidate: unknown,
  path = "dependency",
): ProvenanceValidation {
  const errors: FieldError[] = [];
  const rejectionReasons: ProvenanceRejectionReason[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "dependency_required",
      path,
      "must be a DependencyInventoryItem object",
      "Publish a complete dependency inventory item.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
    return { valid: false, errors, rejectionReasons };
  }

  if (!isNonEmptyString(candidate.name)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.name`,
      "must be a non-empty string",
      "Publish the dependency or asset name.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  if (!isNonEmptyString(candidate.version)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.version`,
      "must be a non-empty string",
      "Publish the exact dependency or asset version.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  } else if (UNRESOLVED_VERSION_PATTERN.test(candidate.version)) {
    error(
      errors,
      "unresolved_source",
      `${path}.version`,
      "must be an exact pinned version, not a range or moving target",
      "Pin the dependency to one exact published version.",
    );
    addReason(rejectionReasons, "unresolved_source");
  }

  if (candidate.relationship !== "direct" && candidate.relationship !== "transitive") {
    error(
      errors,
      "incomplete_provenance",
      `${path}.relationship`,
      'must be "direct" or "transitive"',
      "Publish whether this dependency is direct or transitive.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  const materialTypes = new Set(["dependency", "asset", "font", "example"]);
  if (typeof candidate.materialType !== "string" || !materialTypes.has(candidate.materialType)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.materialType`,
      'must be "dependency", "asset", "font", or "example"',
      "Publish the material type for this inventory entry.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  if (isNonEmptyString(candidate.source) && !looksLikeResolvableUri(candidate.source)) {
    error(
      errors,
      "unresolved_source",
      `${path}.source`,
      "must be a resolvable absolute URI",
      "Publish a resolvable source location for this dependency or asset.",
    );
    addReason(rejectionReasons, "unresolved_source");
  } else if (!isNonEmptyString(candidate.source)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.source`,
      "must be a non-empty string",
      "Publish the source location for this dependency or asset.",
    );
    addReason(rejectionReasons, "incomplete_provenance");
  }

  const provenanceResult = validateLicenseProvenance(candidate.provenance, `${path}.provenance`);
  errors.push(...provenanceResult.errors);
  for (const reason of provenanceResult.rejectionReasons) addReason(rejectionReasons, reason);

  return { valid: errors.length === 0, errors, rejectionReasons };
}

export interface DependencyInventoryTraversal {
  valid: boolean;
  errors: FieldError[];
  rejectionReasons: ProvenanceRejectionReason[];
  direct: DependencyInventoryItem[];
  transitive: DependencyInventoryItem[];
}

/**
 * Traverses a release's flat production dependency/asset inventory (which already
 * enumerates both direct and transitive entries, per the Release Manifest contract),
 * validating every entry's completeness, source resolvability, and license
 * compatibility, and partitioning entries by direct/transitive relationship for
 * auditability.
 *
 * Implements Property 2's completeness requirement: any missing, unresolved, or
 * incompatible node in the reachable dependency/asset graph makes the manifest
 * ineligible for stable release.
 */
export function traverseProductionInventory(
  items: readonly unknown[],
): DependencyInventoryTraversal {
  const errors: FieldError[] = [];
  const rejectionReasons: ProvenanceRejectionReason[] = [];
  const direct: DependencyInventoryItem[] = [];
  const transitive: DependencyInventoryItem[] = [];

  items.forEach((item, index) => {
    const result = validateDependencyInventoryItem(item, `productionInventory[${String(index)}]`);
    errors.push(...result.errors);
    for (const reason of result.rejectionReasons) addReason(rejectionReasons, reason);
    if (result.valid && isRecord(item)) {
      if (item.relationship === "direct") direct.push(item as DependencyInventoryItem);
      else if (item.relationship === "transitive") transitive.push(item as DependencyInventoryItem);
    }
  });

  return { valid: errors.length === 0, errors, rejectionReasons, direct, transitive };
}

/**
 * An auditable record of a dependency or asset replacement, per Requirement 1.7: the
 * Public Repository retains the previous item, replacement item, versions, sources,
 * License Provenance, change rationale, reviewer, and approval date.
 */
export interface DependencyReplacementRecord {
  previousItem: DependencyInventoryItem;
  replacementItem: DependencyInventoryItem;
  changeRationale: string;
  reviewer: string;
  approvalDate: string;
}

export interface DependencyReplacementValidation {
  valid: boolean;
  errors: FieldError[];
}

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: unknown): boolean {
  if (typeof value !== "string" || !CALENDAR_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Validates that a dependency/asset change carries a complete, auditable replacement
 * record: the previous item, the replacement item, both versions/sources resolvable, the
 * replacement's License Provenance reviewed, a change rationale, a reviewer, and an
 * approval date.
 */
export function validateDependencyReplacementRecord(
  candidate: unknown,
  path = "replacement",
): DependencyReplacementValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "replacement_record_required",
      path,
      "must be a DependencyReplacementRecord object",
      "Publish the previous item, replacement item, rationale, reviewer, and approval date.",
    );
    return { valid: false, errors };
  }

  errors.push(
    ...validateDependencyInventoryItem(candidate.previousItem, `${path}.previousItem`).errors,
  );
  errors.push(
    ...validateDependencyInventoryItem(candidate.replacementItem, `${path}.replacementItem`).errors,
  );

  if (!isNonEmptyString(candidate.changeRationale)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.changeRationale`,
      "must be a non-empty string",
      "Publish why the dependency or asset was replaced.",
    );
  }
  if (!isNonEmptyString(candidate.reviewer)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.reviewer`,
      "must be a non-empty string",
      "Publish who reviewed and approved the replacement.",
    );
  }
  if (!isCalendarDate(candidate.approvalDate)) {
    error(
      errors,
      "incomplete_provenance",
      `${path}.approvalDate`,
      "must be a real YYYY-MM-DD calendar date",
      "Publish the approval date without a time or time zone.",
    );
  }

  if (
    isRecord(candidate.previousItem) &&
    isRecord(candidate.replacementItem) &&
    candidate.previousItem.name === candidate.replacementItem.name &&
    candidate.previousItem.version === candidate.replacementItem.version
  ) {
    error(
      errors,
      "no_op_replacement",
      path,
      "must record a distinct previous and replacement item",
      "Publish a replacement item with a different name or version than the previous item.",
    );
  }

  return { valid: errors.length === 0, errors };
}
