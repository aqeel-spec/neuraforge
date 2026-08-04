import type {
  ArtifactRef,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  SemanticVersion,
} from "@neuraforge/schemas";

import type {
  MotionBlockingCondition,
  MotionControl,
  MotionControlName,
  MotionCustomizationSchema,
  MotionDependencyRef,
  MotionExample,
  MotionPresetRecord,
  ReducedMotionBehavior,
} from "./types.js";
import { MOTION_CONTROL_NAMES } from "./types.js";
import { isApplicableControl } from "./schema.js";

// ---------------------------------------------------------------------------
// Motion Registry/MCP Projections and Evidence (Task 12.9)
// ---------------------------------------------------------------------------

/**
 * A JSON-safe, deterministic projection of a motion preset for Registry and MCP
 * consumers. Includes all metadata required by Requirement 5.13:
 * - Original source
 * - Exact dependencies and provenance
 * - Schema version and applicability metadata
 * - Defaults, ranges, and validation constraints
 * - Reduced-motion behavior contract
 * - Representative examples
 * - Performance records
 * - Experimental blockers (when applicable)
 *
 * Requirements: 5.13–5.15, 5.20–5.22
 */
export interface ProjectedMotionPreset {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly framerMotionVersion: string;
  readonly framerMotionProvenance: LicenseProvenance;
  readonly sourceFiles: readonly FileRecord[];
  readonly dependencies: readonly MotionDependencyRef[];
  readonly applicability: ProjectedApplicabilityMap;
  readonly reducedMotionContract: ProjectedReducedMotionContract;
  readonly examples: readonly ProjectedMotionExample[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly blockers: readonly MotionBlockingCondition[];
  readonly experimentalWarnings: readonly string[];
}

/**
 * Projected applicability map showing which controls are applicable (with their
 * defaults, ranges, and constraints) and which are not applicable (with reasons).
 * This is the MCP-facing representation agents use to understand what's configurable.
 */
export interface ProjectedApplicabilityMap {
  readonly applicable: readonly ProjectedApplicableControl[];
  readonly nonApplicable: readonly ProjectedNonApplicableControl[];
}

/** Projected view of an applicable control for Registry/MCP consumers. */
export interface ProjectedApplicableControl {
  readonly name: MotionControlName;
  readonly type: string;
  readonly default: unknown;
  readonly allowedValues?: readonly unknown[];
  readonly range?: { readonly min: number; readonly max: number };
  readonly constraints: readonly ProjectedConstraint[];
  readonly breakpointSupport: "all" | "none" | readonly string[];
}

/** Projected view of a non-applicable control for Registry/MCP consumers. */
export interface ProjectedNonApplicableControl {
  readonly name: MotionControlName;
  readonly reason: string;
}

/** Projected constraint with related control names. */
export interface ProjectedConstraint {
  readonly constraintId: string;
  readonly description: string;
  readonly relatedControls: readonly MotionControlName[];
}

/** Projected reduced-motion contract for the Registry/MCP output. */
export interface ProjectedReducedMotionContract {
  readonly disabledDecorativeMotion: string;
  readonly essentialTransitions: readonly {
    readonly id: string;
    readonly description: string;
    readonly reducedDurationMs: number;
  }[];
}

/** Projected example stripped of any runtime-only data. */
export interface ProjectedMotionExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly config: Record<string, unknown>;
  readonly sourcePath: string;
  readonly interactive: boolean;
}

// ---------------------------------------------------------------------------
// Projection functions
// ---------------------------------------------------------------------------

/**
 * Projects a `MotionPresetRecord` into a deterministic, JSON-safe Registry projection.
 * Deep-copies all data, freezes the result, and ensures no mutable references leak.
 *
 * For experimental artifacts, includes all blockers and generated warnings.
 * For stable artifacts, blockers array is empty and no warnings are generated.
 *
 * Requirements: 5.13, 5.20, 5.21
 */
export function projectMotionPreset(record: MotionPresetRecord): ProjectedMotionPreset {
  const applicability = projectApplicabilityMap(record.customizationSchema);
  const reducedMotionContract = projectReducedMotionContract(record.reducedMotionContract);
  const examples = record.examples.map(projectExample);
  const blockers = record.blockers ? deepClone(record.blockers) : [];
  const experimentalWarnings = generateExperimentalWarnings(record);

  const projection: ProjectedMotionPreset = {
    ref: deepClone(record.ref),
    status: record.status,
    schemaVersion: record.schemaVersion,
    framerMotionVersion: record.framerMotionVersion,
    framerMotionProvenance: deepClone(record.framerMotionProvenance),
    sourceFiles: deepClone(record.sourceFiles),
    dependencies: deepClone(record.dependencies),
    applicability,
    reducedMotionContract,
    examples,
    performanceRecords: deepClone(record.performanceRecords),
    blockers,
    experimentalWarnings,
  };

  return Object.freeze(projection);
}

/**
 * Validates that a motion preset record has all required fields for a stable projection.
 * Returns an array of missing/invalid field names. An empty array means the record is
 * complete and eligible for stable classification.
 *
 * Requirements: 5.14, 5.15, 12.7
 */
export function validateProjectionCompleteness(record: MotionPresetRecord): readonly string[] {
  const missing: string[] = [];

  if (!record.ref.stableId) missing.push("ref.stableId");
  if (!record.ref.version) missing.push("ref.version");
  if (!record.schemaVersion) missing.push("schemaVersion");
  if (!record.framerMotionVersion) missing.push("framerMotionVersion");
  if (!record.framerMotionProvenance.spdxIdentifier)
    missing.push("framerMotionProvenance.spdxIdentifier");
  if (record.framerMotionProvenance.reviewStatus !== "approved")
    missing.push("framerMotionProvenance.reviewStatus");
  if (record.sourceFiles.length === 0) missing.push("sourceFiles");
  if (record.examples.length === 0) missing.push("examples");
  if (record.performanceRecords.length === 0) missing.push("performanceRecords");

  // Must have the reduced-motion contract fully specified
  if (!record.reducedMotionContract.disabledDecorativeMotion) {
    missing.push("reducedMotionContract.disabledDecorativeMotion");
  }

  // Check for failing performance records
  const failingPerf = record.performanceRecords.filter((r) => r.status === "failed");
  if (failingPerf.length > 0) {
    missing.push(`performanceRecords (${failingPerf.length} failing)`);
  }

  return missing;
}

/**
 * Determines whether a motion preset should be classified as experimental based on
 * completeness and evidence. Returns the blocking conditions if experimental, or an
 * empty array if eligible for stable.
 *
 * Requirements: 5.15, 5.20
 */
export function classifyMotionPresetStatus(record: MotionPresetRecord): {
  status: "stable" | "experimental";
  blockers: MotionBlockingCondition[];
} {
  const completenessIssues = validateProjectionCompleteness(record);
  const blockers: MotionBlockingCondition[] = [];

  for (const issue of completenessIssues) {
    blockers.push({
      code: "incomplete_evidence",
      description: `Missing or invalid: ${issue}`,
    });
  }

  // Include any explicitly declared blockers
  if (record.blockers) {
    blockers.push(...record.blockers);
  }

  return {
    status: blockers.length === 0 ? "stable" : "experimental",
    blockers,
  };
}

// ---------------------------------------------------------------------------
// MCP response builders
// ---------------------------------------------------------------------------

/**
 * Builds the MCP `get_component`-equivalent response payload for a motion preset.
 * This is the full artifact retrieval payload an MCP consumer receives.
 *
 * Requirement 5.13
 */
export function buildMotionMcpPayload(record: MotionPresetRecord): Record<string, unknown> {
  const projected = projectMotionPreset(record);

  return {
    kind: "motion-preset",
    stableId: projected.ref.stableId,
    version: projected.ref.version,
    status: projected.status,
    schemaVersion: projected.schemaVersion,
    framerMotion: {
      version: projected.framerMotionVersion,
      license: projected.framerMotionProvenance.spdxIdentifier,
      source: projected.framerMotionProvenance.source,
    },
    source: projected.sourceFiles.map((f) => ({
      path: f.path,
      mediaType: f.mediaType,
      size: f.size,
      checksum: f.checksum.digest,
    })),
    dependencies: projected.dependencies,
    controls: {
      applicable: projected.applicability.applicable.map((c) => ({
        name: c.name,
        type: c.type,
        default: c.default,
        ...(c.allowedValues ? { allowedValues: c.allowedValues } : {}),
        ...(c.range ? { range: c.range } : {}),
        constraints: c.constraints,
        breakpoints: c.breakpointSupport,
      })),
      nonApplicable: projected.applicability.nonApplicable.map((c) => ({
        name: c.name,
        reason: c.reason,
      })),
    },
    reducedMotion: projected.reducedMotionContract,
    examples: projected.examples,
    performance: projected.performanceRecords.map((r) => ({
      metric: r.metric,
      scenario: r.scenario,
      result: r.result,
      threshold: r.threshold,
      unit: r.unit,
      status: r.status,
    })),
    ...(projected.status === "experimental"
      ? {
          experimental: {
            blockers: projected.blockers,
            warnings: projected.experimentalWarnings,
          },
        }
      : {}),
  };
}

/**
 * Builds a summary entry for motion presets in list/search MCP responses.
 */
export function buildMotionMcpSummary(record: MotionPresetRecord): Record<string, unknown> {
  const applicableCount = MOTION_CONTROL_NAMES.filter((name) =>
    isApplicableControl(record.customizationSchema.controls[name]),
  ).length;

  return {
    kind: "motion-preset",
    stableId: record.ref.stableId,
    version: record.ref.version,
    status: record.status,
    framerMotionVersion: record.framerMotionVersion,
    applicableControls: applicableCount,
    totalControls: MOTION_CONTROL_NAMES.length,
    hasReducedMotionSupport: true,
    exampleCount: record.examples.length,
    performanceStatus: record.performanceRecords.every((r) => r.status === "passed")
      ? "passing"
      : "failing",
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function projectApplicabilityMap(schema: MotionCustomizationSchema): ProjectedApplicabilityMap {
  const applicable: ProjectedApplicableControl[] = [];
  const nonApplicable: ProjectedNonApplicableControl[] = [];

  for (const name of MOTION_CONTROL_NAMES) {
    const control: MotionControl = schema.controls[name];

    if (isApplicableControl(control)) {
      const projected: ProjectedApplicableControl = {
        name,
        type: control.type,
        default: control.default,
        ...(control.allowedValues ? { allowedValues: [...control.allowedValues] } : {}),
        ...(control.range ? { range: { min: control.range.min, max: control.range.max } } : {}),
        constraints: control.constraints.map((c) => ({
          constraintId: c.constraintId,
          description: c.description,
          relatedControls: c.relatedControls ? [...c.relatedControls] : [],
        })),
        breakpointSupport:
          control.breakpoints === "all" || control.breakpoints === "none"
            ? control.breakpoints
            : [...control.breakpoints],
      };
      applicable.push(projected);
    } else {
      nonApplicable.push({
        name,
        reason: control.reason,
      });
    }
  }

  return { applicable, nonApplicable };
}

function projectReducedMotionContract(
  behavior: ReducedMotionBehavior,
): ProjectedReducedMotionContract {
  return {
    disabledDecorativeMotion: behavior.disabledDecorativeMotion,
    essentialTransitions: behavior.essentialTransitions.map((t) => ({
      id: t.id,
      description: t.description,
      reducedDurationMs: t.reducedDuration,
    })),
  };
}

function projectExample(example: MotionExample): ProjectedMotionExample {
  return {
    id: example.id,
    title: example.title,
    description: example.description,
    config: deepClone(example.config) as Record<string, unknown>,
    sourcePath: example.sourcePath,
    interactive: example.interactive,
  };
}

function generateExperimentalWarnings(record: MotionPresetRecord): string[] {
  if (record.status !== "experimental") return [];

  const warnings: string[] = [];

  if (record.blockers && record.blockers.length > 0) {
    warnings.push(
      `This motion preset has ${record.blockers.length} blocking condition(s) preventing stable classification.`,
    );
  }

  const failingPerf = record.performanceRecords.filter((r) => r.status === "failed");
  if (failingPerf.length > 0) {
    warnings.push(
      `${failingPerf.length} performance check(s) are failing. Review thresholds before production use.`,
    );
  }

  if (record.examples.length === 0) {
    warnings.push(
      "No usage examples are published. Configuration may require manual reference to source.",
    );
  }

  if (record.performanceRecords.length === 0) {
    warnings.push(
      "No performance records are published. Runtime and bundle-size impact is undocumented.",
    );
  }

  return warnings;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
