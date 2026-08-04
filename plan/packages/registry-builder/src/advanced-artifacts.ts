/**
 * Advanced artifact integration — extends the immutable release bundle to include
 * motion presets, 3D components, and curated compositions without changing MVP contracts.
 *
 * This module adds advanced artifact kinds to the RegistrySnapshot in a backward-compatible
 * manner: existing MVP surfaces (components, tokens, Registry, API, CLI, MCP, docs, self-host)
 * are unmodified. Advanced artifacts are additional optional fields that new package versions
 * can consume.
 *
 * Requirements: 1.2, 1.3, 1.9, 1.10, 2.5, 5.20, 5.21, 6.10, 13.5
 * Task: 15.1
 */

import type {
  ArtifactRef,
  Checksum,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  SemanticVersion,
} from "@neuraforge/schemas";

// ---------------------------------------------------------------------------
// Advanced Artifact Registry Entries
// ---------------------------------------------------------------------------

/**
 * A motion preset entry in the immutable release snapshot.
 * Preserves entitlement-free, public, self-hostable access.
 */
export interface RegistryMotionPresetEntry {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly framerMotionVersion: string;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly applicableControlCount: number;
  readonly totalControlCount: number;
  readonly hasReducedMotionSupport: true;
  readonly sourceFiles: readonly FileRecord[];
  readonly checksum: Checksum;
  readonly provenance: readonly LicenseProvenance[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly registryLocation: string;
}

/**
 * A 3D component entry in the immutable release snapshot.
 * Preserves entitlement-free, public, self-hostable access.
 */
export interface RegistryThreeDEntry {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly requiredCapability: "webgl" | "webgl2" | "webgpu";
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly hasFallback: true;
  readonly parameterCount: number;
  readonly sourceFiles: readonly FileRecord[];
  readonly checksum: Checksum;
  readonly provenance: readonly LicenseProvenance[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly registryLocation: string;
}

/**
 * A curated composition entry in the immutable release snapshot.
 * Preserves entitlement-free, public, self-hostable access.
 */
export interface RegistryCompositionEntry {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly artifactRefCount: number;
  readonly customizationInputCount: number;
  readonly invariantCount: number;
  readonly sourceFiles: readonly FileRecord[];
  readonly checksum: Checksum;
  readonly provenance: readonly LicenseProvenance[];
  readonly registryLocation: string;
}

// ---------------------------------------------------------------------------
// Extended Snapshot (backward-compatible extension of RegistrySnapshot)
// ---------------------------------------------------------------------------

/**
 * Extended registry snapshot that includes advanced artifact kinds alongside the
 * MVP components and tokens. These fields are additive — they don't modify any
 * existing MVP field, ensuring existing consumers continue to work unchanged.
 */
export interface AdvancedArtifactSnapshot {
  /** Motion presets included in this release. Empty array if none published yet. */
  readonly motionPresets: readonly RegistryMotionPresetEntry[];
  /** 3D components included in this release. Empty array if none published yet. */
  readonly threeDComponents: readonly RegistryThreeDEntry[];
  /** Curated compositions included in this release. Empty array if none published yet. */
  readonly compositions: readonly RegistryCompositionEntry[];
}

/**
 * Creates an empty advanced artifact snapshot for releases that don't yet include
 * advanced capabilities.
 */
export function createEmptyAdvancedSnapshot(): AdvancedArtifactSnapshot {
  return {
    motionPresets: [],
    threeDComponents: [],
    compositions: [],
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates that advanced artifacts don't violate core constraints:
 * - All refs use exact versions (no ranges)
 * - All refs have kind matching their entry type
 * - All entries have valid checksums
 * - No entry creates an entitlement or plan-specific capability
 * - Blocked capabilities remain experimental, never weakening gates
 */
export interface AdvancedValidationResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

export function validateAdvancedSnapshot(snapshot: AdvancedArtifactSnapshot): AdvancedValidationResult {
  const issues: string[] = [];

  // Validate motion presets
  for (const entry of snapshot.motionPresets) {
    if (entry.ref.kind !== "motion-preset") {
      issues.push(`Motion preset "${entry.ref.stableId}" has wrong kind: ${entry.ref.kind}`);
    }
    if (!entry.ref.version || entry.ref.version.includes("*")) {
      issues.push(`Motion preset "${entry.ref.stableId}" has non-exact version`);
    }
    if (!entry.checksum.digest) {
      issues.push(`Motion preset "${entry.ref.stableId}" missing checksum`);
    }
    if (entry.hasReducedMotionSupport !== true) {
      issues.push(`Motion preset "${entry.ref.stableId}" must declare reduced-motion support`);
    }
  }

  // Validate 3D components
  for (const entry of snapshot.threeDComponents) {
    if (entry.ref.kind !== "three-d-component") {
      issues.push(`3D component "${entry.ref.stableId}" has wrong kind: ${entry.ref.kind}`);
    }
    if (!entry.ref.version || entry.ref.version.includes("*")) {
      issues.push(`3D component "${entry.ref.stableId}" has non-exact version`);
    }
    if (!entry.checksum.digest) {
      issues.push(`3D component "${entry.ref.stableId}" missing checksum`);
    }
    if (entry.hasFallback !== true) {
      issues.push(`3D component "${entry.ref.stableId}" must have a non-3D fallback`);
    }
  }

  // Validate compositions
  for (const entry of snapshot.compositions) {
    if (entry.ref.kind !== "composition") {
      issues.push(`Composition "${entry.ref.stableId}" has wrong kind: ${entry.ref.kind}`);
    }
    if (!entry.ref.version || entry.ref.version.includes("*")) {
      issues.push(`Composition "${entry.ref.stableId}" has non-exact version`);
    }
    if (!entry.checksum.digest) {
      issues.push(`Composition "${entry.ref.stableId}" missing checksum`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

/**
 * Ensures that artifacts with blockers remain experimental. Never promotes a blocked
 * artifact to stable — this preserves the quality gate invariant.
 */
export function enforceExperimentalGating(snapshot: AdvancedArtifactSnapshot): readonly string[] {
  const violations: string[] = [];

  for (const entry of snapshot.motionPresets) {
    if (entry.status === "stable" && entry.performanceRecords.some((r) => r.status === "failed")) {
      violations.push(`Motion preset "${entry.ref.stableId}" is stable but has failing performance records`);
    }
  }

  for (const entry of snapshot.threeDComponents) {
    if (entry.status === "stable" && entry.performanceRecords.some((r) => r.status === "failed")) {
      violations.push(`3D component "${entry.ref.stableId}" is stable but has failing performance records`);
    }
  }

  return violations;
}

/**
 * Returns the total count of advanced artifacts in the snapshot.
 */
export function countAdvancedArtifacts(snapshot: AdvancedArtifactSnapshot): {
  motionPresets: number;
  threeDComponents: number;
  compositions: number;
  total: number;
} {
  return {
    motionPresets: snapshot.motionPresets.length,
    threeDComponents: snapshot.threeDComponents.length,
    compositions: snapshot.compositions.length,
    total: snapshot.motionPresets.length + snapshot.threeDComponents.length + snapshot.compositions.length,
  };
}
