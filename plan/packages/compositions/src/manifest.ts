import type { ArtifactRef } from "@neuraforge-ui/schemas";

import type { BrandingInvariant, CompositionManifest } from "./types.js";
import { COMPOSITION_CATEGORIES, INVARIANT_TYPES } from "./types.js";

// ---------------------------------------------------------------------------
// Manifest Validation and Resolution (Task 14.1)
// ---------------------------------------------------------------------------

/** Result of validating a composition manifest. */
export interface ManifestValidationResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

/**
 * Validates that a CompositionManifest is complete and resolvable:
 * - Has a valid ref with stableId, version, and kind="composition"
 * - Has at least one artifact ref
 * - Has source files
 * - Has a valid category
 * - Has a checksum
 * - All invariants reference valid types and constrained elements
 * - All customization inputs have valid types and IDs
 * - All artifact refs have exact versions (not ranges)
 *
 * Requirements: 6.1, 6.10
 */
export function validateManifest(manifest: CompositionManifest): ManifestValidationResult {
  const issues: string[] = [];

  // Identity
  if (!manifest.ref.stableId) issues.push("Missing ref.stableId");
  if (!manifest.ref.version) issues.push("Missing ref.version");
  if (manifest.ref.kind !== "composition")
    issues.push(`Invalid ref.kind: expected "composition", got "${manifest.ref.kind}"`);
  if (!manifest.name) issues.push("Missing name");
  if (!manifest.description) issues.push("Missing description");
  if (!manifest.schemaVersion) issues.push("Missing schemaVersion");

  // Category
  if (!COMPOSITION_CATEGORIES.includes(manifest.category)) {
    issues.push(`Invalid category: ${manifest.category}`);
  }

  // Artifact refs
  if (manifest.artifactRefs.length === 0) {
    issues.push("Must reference at least one artifact");
  }
  for (const ref of manifest.artifactRefs) {
    if (!ref.stableId || !ref.version) {
      issues.push(`Artifact ref missing stableId or version: ${JSON.stringify(ref)}`);
    }
    if (ref.version.includes("*") || ref.version.includes("^") || ref.version.includes("~")) {
      issues.push(
        `Artifact ref must use exact version (no ranges): ${ref.stableId}@${ref.version}`,
      );
    }
  }

  // Source files
  if (manifest.sourceFiles.length === 0) {
    issues.push("Must have at least one source file");
  }

  // Checksum
  if (!manifest.checksum.digest) {
    issues.push("Missing checksum digest");
  }

  // Customization inputs
  const inputIds = new Set<string>();
  for (const input of manifest.customizationInputs) {
    if (!input.id) issues.push("Customization input missing id");
    if (inputIds.has(input.id)) issues.push(`Duplicate customization input id: ${input.id}`);
    inputIds.add(input.id);
  }

  // Invariants
  for (const inv of manifest.invariants) {
    if (!inv.id) issues.push("Invariant missing id");
    if (!INVARIANT_TYPES.includes(inv.type)) {
      issues.push(`Invalid invariant type: ${inv.type}`);
    }
    if (inv.constrainedElements.length === 0) {
      issues.push(`Invariant "${inv.id}" must constrain at least one element`);
    }
  }

  // Provenance
  if (manifest.provenance.length === 0) {
    issues.push("Missing provenance");
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Resolves all artifact references in a manifest against a registry lookup function.
 * Returns unresolved refs if any cannot be found.
 */
export function resolveManifestRefs(
  manifest: CompositionManifest,
  lookup: (ref: ArtifactRef) => boolean,
): { resolved: boolean; unresolvedRefs: readonly ArtifactRef[] } {
  const unresolved: ArtifactRef[] = [];

  for (const ref of manifest.artifactRefs) {
    if (!lookup(ref)) {
      unresolved.push(ref);
    }
  }

  return { resolved: unresolved.length === 0, unresolvedRefs: unresolved };
}

/**
 * Extracts all customization input IDs from a manifest. Used to validate that
 * a Brand Config only edits declared inputs.
 */
export function getDeclaredInputIds(manifest: CompositionManifest): readonly string[] {
  return manifest.customizationInputs.map((i) => i.id);
}

/**
 * Extracts all invariant IDs grouped by type.
 */
export function getInvariantsByType(
  manifest: CompositionManifest,
): Readonly<Record<string, readonly BrandingInvariant[]>> {
  const grouped: Record<string, BrandingInvariant[]> = {};

  for (const inv of manifest.invariants) {
    if (!grouped[inv.type]) {
      grouped[inv.type] = [];
    }
    grouped[inv.type]!.push(inv);
  }

  return grouped;
}

/**
 * Returns the default values for all customization inputs in a manifest.
 */
export function getInputDefaults(manifest: CompositionManifest): Readonly<Record<string, unknown>> {
  const defaults: Record<string, unknown> = {};
  for (const input of manifest.customizationInputs) {
    defaults[input.id] = input.default;
  }
  return defaults;
}
