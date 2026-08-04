import type { JsonValue } from "@neuraforge/schemas";

import type {
  CompositionManifest,
  CompositionRequest,
  CompositionSelectionResult,
  EligibilityFilter,
  FailedConstraint,
  NormalizationStep,
  RequestConstraint,
  ScoreDimension,
  ScoredComposition,
  SelectionRuleSet,
} from "./types.js";

// ---------------------------------------------------------------------------
// Deterministic Composition Filtering, Scoring, and Explanations (Task 14.5)
// ---------------------------------------------------------------------------

/**
 * Performs deterministic composition selection given a request, a set of candidate
 * manifests, and published selection rules. Guarantees:
 *
 * 1. Same inputs + same registry version = same ordered results (Requirement 6.3).
 * 2. Filtering uses published eligibility rules.
 * 3. Scoring uses published weights and directions.
 * 4. Tie-breaking uses stable ID (lexicographic) for determinism.
 * 5. Every result includes a reproducible explanation.
 *
 * Requirements: 6.2, 6.3, 6.8
 */
export function selectCompositions(
  request: CompositionRequest,
  manifests: readonly CompositionManifest[],
  rules: SelectionRuleSet,
  registryVersion: string,
): CompositionSelectionResult {
  // 1. Normalize the request intent
  const normalizedIntent = normalizeIntent(request.intent, rules.normalization);

  // 2. Filter eligible candidates
  const { eligible, failedConstraints } = filterEligible(
    manifests,
    request,
    rules.eligibilityFilters,
  );

  // 3. Score eligible candidates
  const scored = eligible.map((manifest) =>
    scoreComposition(manifest, normalizedIntent, request, rules),
  );

  // 4. Sort by total score descending, then tie-break by stable ID
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.ref.stableId.localeCompare(b.ref.stableId);
  });

  // 5. Limit results
  const results = scored.slice(0, request.limit);

  // 6. Compute alternatives (top results from all manifests if no exact matches)
  const alternatives =
    results.length === 0 ? computeAlternatives(manifests, normalizedIntent, request, rules) : [];

  return {
    registryVersion: registryVersion,
    ruleSetVersion: rules.version,
    results,
    failedConstraints,
    alternatives: alternatives.map((a) => a.ref),
  };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes an intent string using the published normalization steps.
 * Steps are applied in declared order for determinism.
 */
export function normalizeIntent(intent: string, steps: readonly NormalizationStep[]): string {
  let normalized = intent;

  for (const step of steps) {
    switch (step.operation) {
      case "lowercase":
        normalized = normalized.toLowerCase();
        break;
      case "trim":
        normalized = normalized.trim();
        break;
      case "stem":
        // Simple suffix stripping for determinism
        normalized = normalized.replace(/\b(\w+)(ing|tion|ment|ness|ly)\b/g, "$1");
        break;
      case "remove-stop-words":
        normalized = removeStopWords(normalized);
        break;
      case "synonym-expand":
        // Deterministic synonym mapping
        normalized = expandSynonyms(normalized);
        break;
    }
  }

  return normalized;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
]);

function removeStopWords(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
    .join(" ");
}

const SYNONYM_MAP: ReadonlyMap<string, string> = new Map([
  ["pricing", "pricing tiers plans"],
  ["hero", "hero banner landing"],
  ["faq", "faq questions answers"],
  ["testimonial", "testimonial review quote"],
  ["cta", "cta call-to-action action button"],
  ["feature", "feature capability benefit"],
  ["contact", "contact form reach-out"],
  ["stats", "stats metrics numbers"],
  ["team", "team members people staff"],
  ["blog", "blog articles posts"],
  ["footer", "footer bottom navigation"],
  ["header", "header top navigation navbar"],
]);

function expandSynonyms(text: string): string {
  let expanded = text;
  for (const [key, synonyms] of SYNONYM_MAP) {
    if (expanded.includes(key)) {
      expanded = `${expanded} ${synonyms}`;
    }
  }
  return expanded;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filters manifests against eligibility filters and request constraints.
 * Returns eligible manifests and any failed constraints.
 */
function filterEligible(
  manifests: readonly CompositionManifest[],
  request: CompositionRequest,
  filters: readonly EligibilityFilter[],
): { eligible: CompositionManifest[]; failedConstraints: FailedConstraint[] } {
  const failedConstraints: FailedConstraint[] = [];
  const eligible: CompositionManifest[] = [];

  for (const manifest of manifests) {
    let passes = true;

    // Check eligibility filters
    for (const filter of filters) {
      if (!evaluateFilter(manifest, filter)) {
        passes = false;
        break;
      }
    }

    // Check request category constraint
    if (request.category && manifest.category !== request.category) {
      passes = false;
    }

    // Check request constraints
    for (const constraint of request.constraints) {
      if (!evaluateRequestConstraint(manifest, constraint)) {
        passes = false;
        failedConstraints.push({
          constraintId: `${constraint.field}-${constraint.operator}`,
          description: `Constraint on "${constraint.field}" ${constraint.operator} ${JSON.stringify(constraint.value)}`,
          reason: `Manifest "${manifest.ref.stableId}" does not satisfy this constraint`,
        });
      }
    }

    if (passes) {
      eligible.push(manifest);
    }
  }

  return { eligible, failedConstraints };
}

function evaluateFilter(manifest: CompositionManifest, filter: EligibilityFilter): boolean {
  const value = getManifestField(manifest, filter.field);

  switch (filter.operator) {
    case "equals":
      return JSON.stringify(value) === JSON.stringify(filter.value);
    case "contains":
      if (typeof value === "string" && typeof filter.value === "string") {
        return value.includes(filter.value);
      }
      if (Array.isArray(value)) {
        return value.some((v) => JSON.stringify(v) === JSON.stringify(filter.value));
      }
      return false;
    case "in":
      if (Array.isArray(filter.value)) {
        return filter.value.some((v) => JSON.stringify(v) === JSON.stringify(value));
      }
      return false;
    case "gte":
      return typeof value === "number" && typeof filter.value === "number" && value >= filter.value;
    case "lte":
      return typeof value === "number" && typeof filter.value === "number" && value <= filter.value;
    case "exists":
      return value !== undefined && value !== null;
  }
}

function evaluateRequestConstraint(
  manifest: CompositionManifest,
  constraint: RequestConstraint,
): boolean {
  const value = getManifestField(manifest, constraint.field);

  switch (constraint.operator) {
    case "equals":
      return JSON.stringify(value) === JSON.stringify(constraint.value);
    case "contains":
      if (typeof value === "string" && typeof constraint.value === "string") {
        return value.includes(constraint.value);
      }
      if (Array.isArray(value)) {
        return value.some((v) => JSON.stringify(v) === JSON.stringify(constraint.value));
      }
      return false;
    case "in":
      if (Array.isArray(constraint.value)) {
        return constraint.value.some((v) => JSON.stringify(v) === JSON.stringify(value));
      }
      return false;
    case "gte":
      return (
        typeof value === "number" &&
        typeof constraint.value === "number" &&
        value >= constraint.value
      );
    case "lte":
      return (
        typeof value === "number" &&
        typeof constraint.value === "number" &&
        value <= constraint.value
      );
  }
}

function getManifestField(manifest: CompositionManifest, field: string): JsonValue | undefined {
  switch (field) {
    case "category":
      return manifest.category;
    case "name":
      return manifest.name;
    case "description":
      return manifest.description;
    case "tags":
      return manifest.tags as unknown as JsonValue;
    case "schemaVersion":
      return manifest.schemaVersion;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Scores a single composition against the normalized intent and request using
 * the published score dimensions.
 */
function scoreComposition(
  manifest: CompositionManifest,
  normalizedIntent: string,
  request: CompositionRequest,
  rules: SelectionRuleSet,
): ScoredComposition {
  const dimensionScores: Record<string, number> = {};
  let totalScore = 0;

  for (const dim of rules.scoreDimensions) {
    const rawScore = computeDimensionScore(manifest, normalizedIntent, request, dim, rules);
    const weightedScore = rawScore * dim.weight;
    dimensionScores[dim.id] = rawScore;
    totalScore += weightedScore;
  }

  const explanation = buildExplanation(manifest, dimensionScores, totalScore, rules);

  return {
    ref: manifest.ref,
    score: Math.round(totalScore * 1000) / 1000, // 3 decimal places for determinism
    dimensionScores,
    explanation,
  };
}

function computeDimensionScore(
  manifest: CompositionManifest,
  normalizedIntent: string,
  _request: CompositionRequest,
  dim: ScoreDimension,
  rules: SelectionRuleSet,
): number {
  switch (dim.computation) {
    case "tag-overlap": {
      const intentWords = new Set(normalizedIntent.split(/\s+/).filter(Boolean));
      const tagWords = new Set(manifest.tags.flatMap((t) => t.toLowerCase().split(/\s+/)));
      let overlap = 0;
      for (const word of intentWords) {
        if (tagWords.has(word)) overlap++;
      }
      return intentWords.size > 0 ? overlap / intentWords.size : rules.missingEvidenceValue;
    }
    case "category-match": {
      const intentLower = normalizedIntent.toLowerCase();
      return intentLower.includes(manifest.category) ? 1.0 : 0.0;
    }
    case "recency":
      // Use schema version as proxy for recency (higher = more recent)
      return parseVersionScore(manifest.schemaVersion);
    case "quality-score":
      // Based on completeness of manifest (source files, examples, invariants)
      return computeQualityScore(manifest);
    case "usage-evidence":
      // Default to missing evidence value since we don't have usage data
      return rules.missingEvidenceValue;
  }
}

function parseVersionScore(version: string): number {
  const parts = version.split(".").map(Number);
  return ((parts[0] ?? 0) * 100 + (parts[1] ?? 0) * 10 + (parts[2] ?? 0)) / 1000;
}

function computeQualityScore(manifest: CompositionManifest): number {
  let score = 0;
  if (manifest.sourceFiles.length > 0) score += 0.25;
  if (manifest.customizationInputs.length > 0) score += 0.25;
  if (manifest.invariants.length > 0) score += 0.25;
  if (manifest.provenance.length > 0) score += 0.25;
  return score;
}

// ---------------------------------------------------------------------------
// Explanations
// ---------------------------------------------------------------------------

function buildExplanation(
  manifest: CompositionManifest,
  dimensionScores: Readonly<Record<string, number>>,
  totalScore: number,
  rules: SelectionRuleSet,
): string {
  const parts: string[] = [
    `Selected "${manifest.name}" (${manifest.ref.stableId}@${manifest.ref.version})`,
    `with total score ${totalScore.toFixed(3)}`,
  ];

  const dimParts: string[] = [];
  for (const dim of rules.scoreDimensions) {
    const score = dimensionScores[dim.id];
    if (score !== undefined) {
      dimParts.push(`${dim.id}=${score.toFixed(2)}×${dim.weight}`);
    }
  }

  if (dimParts.length > 0) {
    parts.push(`[${dimParts.join(", ")}]`);
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------------

function computeAlternatives(
  manifests: readonly CompositionManifest[],
  normalizedIntent: string,
  request: CompositionRequest,
  rules: SelectionRuleSet,
): ScoredComposition[] {
  // Score all manifests regardless of constraints, return top 3
  const scored = manifests.map((m) => scoreComposition(m, normalizedIntent, request, rules));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.ref.stableId.localeCompare(b.ref.stableId);
  });
  return scored.slice(0, 3);
}
