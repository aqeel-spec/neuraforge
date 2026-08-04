import type { ArtifactRef, Checksum, FileRecord } from "@neuraforge/schemas";

import type {
  AvailableElement,
  CompositionManifest,
  CompositionRequest,
  FailedConstraint,
  NoMatchResult,
  PartialResult,
  SelectionRuleSet,
  UnavailableElement,
} from "./types.js";
import { selectCompositions } from "./selection.js";

// ---------------------------------------------------------------------------
// Composition Retrieval, Partial-Result, and No-Match (Task 14.7)
// ---------------------------------------------------------------------------

/**
 * Full retrieval result for a composition request. One of:
 * - `complete` — all requested elements are available.
 * - `partial` — some elements available, some not.
 * - `no-match` — no composition satisfies all constraints.
 */
export type RetrievalResult =
  | { readonly type: "complete"; readonly manifest: CompositionManifest; readonly elements: readonly AvailableElement[] }
  | { readonly type: "partial"; readonly partial: PartialResult }
  | { readonly type: "no-match"; readonly noMatch: NoMatchResult };

/**
 * A registry lookup that can resolve artifact refs to available source files and checksums.
 */
export interface ArtifactLookup {
  /** Returns true if the artifact is available in the registry. */
  exists(ref: ArtifactRef): boolean;
  /** Returns source files for an available artifact. */
  getSourceFiles(ref: ArtifactRef): readonly FileRecord[];
  /** Returns the checksum for an available artifact. */
  getChecksum(ref: ArtifactRef): Checksum;
  /** Returns alternative artifacts for a given kind and stableId. */
  getAlternatives(ref: ArtifactRef): readonly ArtifactRef[];
}

/**
 * Retrieves a specific composition by reference, checking element availability.
 * Returns a complete result with manifest/source/install/checksums if all elements
 * are available, or a partial result identifying unavailable elements with alternatives.
 *
 * Requirements: 6.4, 6.5
 */
export function retrieveComposition(
  manifest: CompositionManifest,
  lookup: ArtifactLookup,
): RetrievalResult {
  const available: AvailableElement[] = [];
  const unavailable: UnavailableElement[] = [];

  for (const ref of manifest.artifactRefs) {
    if (lookup.exists(ref)) {
      available.push({
        artifactRef: ref,
        sourceFiles: lookup.getSourceFiles(ref),
        checksum: lookup.getChecksum(ref),
      });
    } else {
      unavailable.push({
        artifactRef: ref,
        reason: `Artifact ${ref.stableId}@${ref.version} is not available in the registry`,
        alternatives: lookup.getAlternatives(ref),
      });
    }
  }

  if (unavailable.length === 0) {
    return {
      type: "complete",
      manifest,
      elements: available,
    };
  }

  return {
    type: "partial",
    partial: {
      compositionRef: manifest.ref,
      availableElements: available,
      unavailableElements: unavailable,
    },
  };
}

/**
 * Handles a composition search request where no composition satisfies all constraints.
 * Returns a structured no-match result with failed constraints and ranked public
 * alternatives selected by the published selection rules.
 *
 * Requirement 6.6
 */
export function buildNoMatchResult(
  request: CompositionRequest,
  manifests: readonly CompositionManifest[],
  rules: SelectionRuleSet,
  registryVersion: string,
): NoMatchResult {
  // Run selection without category constraint to find alternatives
  const relaxedRequest: CompositionRequest = {
    intent: request.intent,
    constraints: [], // Drop all constraints to find alternatives
    limit: 5,
  };

  const result = selectCompositions(relaxedRequest, manifests, rules, registryVersion);

  // Identify which constraints failed
  const failedConstraints: FailedConstraint[] = [];

  if (request.category) {
    const categoryMatches = manifests.filter((m) => m.category === request.category);
    if (categoryMatches.length === 0) {
      failedConstraints.push({
        constraintId: "category",
        description: `Category "${request.category}"`,
        reason: `No compositions exist in the "${request.category}" category`,
      });
    }
  }

  for (const constraint of request.constraints) {
    failedConstraints.push({
      constraintId: `${constraint.field}-${constraint.operator}`,
      description: `${constraint.field} ${constraint.operator} ${JSON.stringify(constraint.value)}`,
      reason: "No composition satisfies this constraint with the given intent",
    });
  }

  return {
    failedConstraints,
    alternatives: result.results.slice(0, 3),
  };
}

/**
 * Performs a full composition retrieval workflow:
 * 1. Selects compositions matching the request.
 * 2. If no match, returns a no-match result with alternatives.
 * 3. If matched, retrieves the top result checking element availability.
 * 4. Returns complete, partial, or no-match as appropriate.
 *
 * Requirements: 6.4, 6.5, 6.6
 */
export function handleCompositionRequest(
  request: CompositionRequest,
  manifests: readonly CompositionManifest[],
  rules: SelectionRuleSet,
  registryVersion: string,
  lookup: ArtifactLookup,
): RetrievalResult {
  const selection = selectCompositions(request, manifests, rules, registryVersion);

  // No match — return alternatives
  if (selection.results.length === 0) {
    const noMatch = buildNoMatchResult(request, manifests, rules, registryVersion);
    return { type: "no-match", noMatch };
  }

  // Find the manifest for the top result
  const topResult = selection.results[0]!;
  const manifest = manifests.find(
    (m) => m.ref.stableId === topResult.ref.stableId && m.ref.version === topResult.ref.version,
  );

  if (!manifest) {
    // Should not happen if selection is consistent, but handle gracefully
    return {
      type: "no-match",
      noMatch: {
        failedConstraints: [{
          constraintId: "internal",
          description: "Selected composition not found in manifest list",
          reason: "Internal consistency error",
        }],
        alternatives: [],
      },
    };
  }

  // Retrieve the composition checking element availability
  return retrieveComposition(manifest, lookup);
}
