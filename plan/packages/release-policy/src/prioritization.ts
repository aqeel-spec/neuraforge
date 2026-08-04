import type { FieldError } from "@neuraforge/schemas";

import type { PublicProcessLink } from "./governance.js";

export type ScoreDirection = "maximize" | "minimize";

export const PRIORITIZATION_DIMENSIONS = [
  "impact",
  "effort",
  "accessibilityRisk",
  "securityRisk",
  "demand",
] as const;

export type PrioritizationDimension = (typeof PRIORITIZATION_DIMENSIONS)[number];

export interface PrioritizationDimensionRule {
  dimension: PrioritizationDimension;
  direction: string;
  weight: number;
  missingEvidenceValue: number;
}

export interface PrioritizationRuleSet {
  schemaVersion: string;
  dimensions: PrioritizationDimensionRule[];
}

export interface PrioritizationEvidence {
  value: number;
  source: PublicProcessLink;
}

export interface PrioritizationCandidate {
  stableId: string;
  evidence: Partial<Record<PrioritizationDimension, PrioritizationEvidence>>;
}

export interface PrioritizationDimensionScore {
  dimension: PrioritizationDimension;
  rawValue: number;
  evidenceMissing: boolean;
  direction: ScoreDirection;
  weight: number;
  contribution: number;
}

export interface PrioritizedCandidate {
  stableId: string;
  score: number;
  dimensions: PrioritizationDimensionScore[];
}

export interface PrioritizationResult {
  ruleSetSchemaVersion: string;
  ordered: PrioritizedCandidate[];
}

export interface PrioritizationValidation {
  valid: boolean;
  errors: FieldError[];
}

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const list = (value: unknown): value is unknown[] => Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function pushError(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

function requireText(errors: FieldError[], value: unknown, path: string): void {
  if (!text(value)) {
    pushError(errors, "required", path, "must be a non-empty string", `Provide ${path}.`);
  }
}

function isKnownDimension(value: unknown): value is PrioritizationDimension {
  return (
    typeof value === "string" && (PRIORITIZATION_DIMENSIONS as readonly string[]).includes(value)
  );
}

function validateEvidenceSource(errors: FieldError[], value: unknown, path: string): void {
  const link = value as Partial<PublicProcessLink> | undefined;
  if (!link || link.visibility !== "public") {
    pushError(
      errors,
      "public_evidence_source_required",
      `${path}.visibility`,
      'must equal "public"',
      "Publish this evidence source without authentication or payment.",
    );
  }
  if (!link || !text(link.url) || !(link.url.startsWith("/") || link.url.startsWith("https://"))) {
    pushError(
      errors,
      "invalid_evidence_source",
      `${path}.url`,
      "must be an absolute site path or HTTPS URL",
      "Provide the public repository or documentation path for this evidence.",
    );
  }
}

/**
 * Validates a published prioritization rule set: every dimension must be
 * declared exactly once with a numeric scoring direction, a positive weight,
 * and a finite missing-evidence value.
 *
 * Validates: Requirements 2.7
 */
export function validatePrioritizationRuleSet(
  ruleSet: PrioritizationRuleSet,
): PrioritizationValidation {
  const errors: FieldError[] = [];
  requireText(errors, ruleSet.schemaVersion, "schemaVersion");

  if (!list(ruleSet.dimensions)) {
    pushError(
      errors,
      "prioritization_dimensions_required",
      "dimensions",
      "must be an array of dimension rules",
      "Publish scoring rules for every prioritization dimension.",
    );
    return { valid: errors.length === 0, errors };
  }

  const seen = new Map<string, number>();
  ruleSet.dimensions.forEach((rule, index) => {
    const path = `dimensions[${String(index)}]`;
    if (!isKnownDimension(rule.dimension)) {
      pushError(
        errors,
        "unknown_prioritization_dimension",
        `${path}.dimension`,
        `must be one of ${PRIORITIZATION_DIMENSIONS.join(", ")}`,
        "Use a published prioritization dimension.",
      );
    } else {
      seen.set(rule.dimension, (seen.get(rule.dimension) ?? 0) + 1);
    }
    if (rule.direction !== "maximize" && rule.direction !== "minimize") {
      pushError(
        errors,
        "invalid_prioritization_direction",
        `${path}.direction`,
        'must be "maximize" or "minimize"',
        "Publish the numeric scoring direction for this dimension.",
      );
    }
    if (!finite(rule.weight) || rule.weight <= 0) {
      pushError(
        errors,
        "invalid_prioritization_weight",
        `${path}.weight`,
        "must be a positive finite number",
        "Publish a positive weight for this dimension.",
      );
    }
    if (!finite(rule.missingEvidenceValue)) {
      pushError(
        errors,
        "invalid_missing_evidence_value",
        `${path}.missingEvidenceValue`,
        "must be a finite number",
        "Publish the value applied when this dimension's evidence is missing.",
      );
    }
  });

  seen.forEach((count, dimension) => {
    if (count > 1) {
      pushError(
        errors,
        "duplicate_prioritization_dimension",
        "dimensions",
        `must declare ${dimension} exactly once`,
        "Remove the duplicate dimension rule.",
      );
    }
  });

  PRIORITIZATION_DIMENSIONS.forEach((dimension) => {
    if (!seen.has(dimension)) {
      pushError(
        errors,
        "missing_prioritization_dimension",
        "dimensions",
        `must declare a rule for ${dimension}`,
        `Publish a scoring rule for ${dimension}.`,
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a single prioritization candidate's stable identifier and any
 * published evidence entries.
 *
 * Validates: Requirements 2.6
 */
export function validatePrioritizationCandidate(
  candidate: PrioritizationCandidate,
  path = "candidate",
): PrioritizationValidation {
  const errors: FieldError[] = [];
  requireText(errors, candidate.stableId, `${path}.stableId`);

  Object.entries(candidate.evidence).forEach(([dimension, evidence]) => {
    const entryPath = `${path}.evidence.${dimension}`;
    if (!isKnownDimension(dimension)) {
      pushError(
        errors,
        "unknown_evidence_dimension",
        entryPath,
        `must be one of ${PRIORITIZATION_DIMENSIONS.join(", ")}`,
        "Publish evidence only for known prioritization dimensions.",
      );
      return;
    }
    if (!finite(evidence.value)) {
      pushError(
        errors,
        "invalid_evidence_value",
        `${entryPath}.value`,
        "must be a finite number",
        "Publish a numeric evidence value.",
      );
    }
    validateEvidenceSource(errors, evidence.source, `${entryPath}.source`);
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a full candidate set: each candidate individually, plus a
 * stable-identifier uniqueness check used for deterministic tie-breaking.
 *
 * Validates: Requirements 2.6, 2.7
 */
export function validatePrioritizationCandidates(
  candidates: PrioritizationCandidate[],
): PrioritizationValidation {
  const errors: FieldError[] = [];
  if (!list(candidates)) {
    pushError(
      errors,
      "prioritization_candidates_required",
      "candidates",
      "must be an array of candidates",
      "Publish the candidate set being prioritized.",
    );
    return { valid: errors.length === 0, errors };
  }

  const stableIds = new Map<string, number>();
  candidates.forEach((candidate, index) => {
    errors.push(
      ...validatePrioritizationCandidate(candidate, `candidates[${String(index)}]`).errors,
    );
    if (text(candidate.stableId)) {
      stableIds.set(candidate.stableId, (stableIds.get(candidate.stableId) ?? 0) + 1);
    }
  });

  stableIds.forEach((count, stableId) => {
    if (count > 1) {
      pushError(
        errors,
        "duplicate_candidate_stable_id",
        "candidates",
        `must publish ${stableId} at most once`,
        "Remove or merge the duplicate candidate.",
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

function compareStableIds(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Computes a deterministic total order over a candidate set using a
 * published prioritization rule set: every accepted candidate is scored on
 * every published dimension (applying the missing-evidence value when a
 * candidate omits a dimension), scores are combined using the published
 * numeric direction and weight, and ties are broken by ascending stable
 * identifier. Identical inputs always produce identical ordered output.
 *
 * Validates: Requirements 2.6, 2.7, 2.8, 16.5
 */
export function prioritizeCandidates(
  ruleSet: PrioritizationRuleSet,
  candidates: PrioritizationCandidate[],
): PrioritizationResult {
  const ruleSetValidation = validatePrioritizationRuleSet(ruleSet);
  if (!ruleSetValidation.valid) {
    throw new RangeError(
      `Invalid prioritization rule set: ${ruleSetValidation.errors.map((e) => e.path).join(", ")}`,
    );
  }
  const candidateValidation = validatePrioritizationCandidates(candidates);
  if (!candidateValidation.valid) {
    throw new RangeError(
      `Invalid prioritization candidates: ${candidateValidation.errors.map((e) => e.path).join(", ")}`,
    );
  }

  const rulesByDimension = new Map<PrioritizationDimension, PrioritizationDimensionRule>();
  ruleSet.dimensions.forEach((rule) => rulesByDimension.set(rule.dimension, rule));

  const scored: PrioritizedCandidate[] = candidates.map((candidate) => {
    let score = 0;
    const dimensions: PrioritizationDimensionScore[] = PRIORITIZATION_DIMENSIONS.map(
      (dimension) => {
        const rule = rulesByDimension.get(dimension);
        if (!rule) throw new RangeError(`Missing rule for dimension: ${dimension}`);
        const evidence = candidate.evidence[dimension];
        const evidenceMissing = evidence === undefined;
        const rawValue = evidenceMissing ? rule.missingEvidenceValue : evidence.value;
        const direction: ScoreDirection = rule.direction === "maximize" ? "maximize" : "minimize";
        const signedValue = direction === "maximize" ? rawValue : -rawValue;
        const contribution = signedValue * rule.weight;
        score += contribution;
        return {
          dimension,
          rawValue,
          evidenceMissing,
          direction,
          weight: rule.weight,
          contribution,
        };
      },
    );
    return { stableId: candidate.stableId, score, dimensions };
  });

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return compareStableIds(a.stableId, b.stableId);
  });

  return { ruleSetSchemaVersion: ruleSet.schemaVersion, ordered: scored };
}
