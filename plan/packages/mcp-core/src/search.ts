/**
 * Deterministic search scoring and ranking for search_components.
 *
 * Selection Rule version: "neuraforge-search-v1"
 *
 * Scoring model:
 * - Normalize Unicode/case/whitespace of query and fields
 * - Rank based ONLY on public summary fields with explicit numeric contributions:
 *   - Exact stableId match: 100 points
 *   - Exact name match: 80 points
 *   - stableId prefix match: 40 points
 *   - Name prefix match: 30 points
 *   - Tag exact match: 25 points (per matching tag)
 *   - Category match: 20 points
 *   - Description token overlap: 10 points (per matching unique token)
 *
 * Tie-breaking: score descending, then stableId ascending, then version ascending.
 * Identical input + snapshot => byte-equivalent result/order/boundaries.
 */

import type { ComponentSummary } from "./types.js";

export const SEARCH_RULE_VERSION = "neuraforge-search-v1";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes text for comparison: Unicode NFC, lowercase, collapsed whitespace.
 */
export function normalizeText(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Tokenizes normalized text into unique words for overlap comparison.
 */
function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  if (normalized.length === 0) return new Set();
  return new Set(normalized.split(" "));
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface ScoreContribution {
  readonly field: string;
  readonly points: number;
}

export interface ScoredEntry {
  readonly stableId: string;
  readonly version: string;
  readonly score: number;
  readonly contributions: readonly ScoreContribution[];
  readonly explanations: readonly string[];
}

export function scoreComponent(
  component: ComponentSummary,
  normalizedQuery: string,
  queryTokens: Set<string>,
): ScoredEntry {
  const contributions: ScoreContribution[] = [];
  const explanations: string[] = [];
  let score = 0;

  const normStableId = normalizeText(component.stableId);
  const normName = normalizeText(component.name);
  const normCategory = normalizeText(component.category);
  const normDescription = normalizeText(component.description);

  // Exact stableId match
  if (normStableId === normalizedQuery) {
    score += 100;
    contributions.push({ field: "stableId", points: 100 });
    explanations.push(`Exact stableId match: '${component.stableId}'`);
  } else if (normStableId.startsWith(normalizedQuery)) {
    // stableId prefix match
    score += 40;
    contributions.push({ field: "stableId", points: 40 });
    explanations.push(`stableId prefix match: '${component.stableId}'`);
  }

  // Exact name match
  if (normName === normalizedQuery) {
    score += 80;
    contributions.push({ field: "name", points: 80 });
    explanations.push(`Exact name match: '${component.name}'`);
  } else if (normName.startsWith(normalizedQuery)) {
    // Name prefix match
    score += 30;
    contributions.push({ field: "name", points: 30 });
    explanations.push(`Name prefix match: '${component.name}'`);
  }

  // Tag exact match (per matching tag)
  for (const tag of component.tags) {
    const normTag = normalizeText(tag);
    if (normTag === normalizedQuery || queryTokens.has(normTag)) {
      score += 25;
      contributions.push({ field: "tags", points: 25 });
      explanations.push(`Tag match: '${tag}'`);
    }
  }

  // Category match
  if (normCategory === normalizedQuery || queryTokens.has(normCategory)) {
    score += 20;
    contributions.push({ field: "category", points: 20 });
    explanations.push(`Category match: '${component.category}'`);
  }

  // Description token overlap
  const descriptionTokens = tokenize(normDescription);
  let descPoints = 0;
  for (const qt of queryTokens) {
    if (descriptionTokens.has(qt)) {
      descPoints += 10;
    }
  }
  if (descPoints > 0) {
    score += descPoints;
    contributions.push({ field: "description", points: descPoints });
    explanations.push(`Description token overlap: ${String(descPoints / 10)} matching terms`);
  }

  return {
    stableId: component.stableId,
    version: component.version,
    score,
    contributions,
    explanations,
  };
}

// ---------------------------------------------------------------------------
// Sorting (deterministic)
// ---------------------------------------------------------------------------

export function compareScoredEntries(a: ScoredEntry, b: ScoredEntry): number {
  // Score descending
  if (a.score !== b.score) return b.score - a.score;
  // stableId ascending
  if (a.stableId !== b.stableId) return a.stableId < b.stableId ? -1 : 1;
  // version ascending
  if (a.version !== b.version) return a.version < b.version ? -1 : 1;
  return 0;
}

export function rankComponents(
  components: readonly ComponentSummary[],
  normalizedQuery: string,
): ScoredEntry[] {
  const queryTokens = new Set(normalizedQuery.split(" ").filter((t) => t.length > 0));

  const scored = components.map((c) => scoreComponent(c, normalizedQuery, queryTokens));

  // Filter out zero-score entries
  const nonZero = scored.filter((entry) => entry.score > 0);

  // Sort deterministically
  return nonZero.sort(compareScoredEntries);
}
