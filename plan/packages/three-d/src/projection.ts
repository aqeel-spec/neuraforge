import type {
  ArtifactRef,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  SemanticVersion,
} from "@neuraforge-ui/schemas";

import type {
  ThreeDAssetRef,
  ThreeDBlockingCondition,
  ThreeDCapability,
  ThreeDComponentRecord,
  ThreeDDependencyRef,
  ThreeDErrorBoundary,
  ThreeDExample,
  ThreeDFallbackContract,
  ThreeDParameter,
} from "./types.js";
import { validateComponentRecord } from "./capability.js";

// ---------------------------------------------------------------------------
// 3D Registry/MCP Projections and Evidence (Task 13.4)
// ---------------------------------------------------------------------------

/**
 * A JSON-safe, deterministic projection of a 3D component for Registry and MCP
 * consumers. Includes all metadata required by Requirements 5.14–5.17, 5.20–5.22.
 */
export interface ProjectedThreeDComponent {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly requiredCapability: ThreeDCapability;
  readonly fallback: ProjectedFallback;
  readonly errorBoundary: ThreeDErrorBoundary;
  readonly parameters: readonly ProjectedParameter[];
  readonly resumeStateDescription: string;
  readonly sourceFiles: readonly ProjectedSourceFile[];
  readonly dependencies: readonly ThreeDDependencyRef[];
  readonly assets: readonly ProjectedAsset[];
  readonly provenance: readonly LicenseProvenance[];
  readonly examples: readonly ProjectedExample[];
  readonly performanceRecords: readonly ProjectedPerformanceRecord[];
  readonly blockers: readonly ThreeDBlockingCondition[];
  readonly experimentalWarnings: readonly string[];
}

/** Projected fallback contract for MCP consumers. */
export interface ProjectedFallback {
  readonly description: string;
  readonly preservesContent: true;
  readonly preservesStatus: true;
  readonly preservesPrimaryActions: true;
  readonly fallbackSourcePath: string;
  readonly fallbackArtifactRef?: ArtifactRef;
}

/** Projected parameter for MCP consumers. */
export interface ProjectedParameter {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly default: unknown;
  readonly required: boolean;
  readonly group: string;
  readonly allowedValues?: readonly unknown[];
  readonly range?: { readonly min: number; readonly max: number };
}

/** Projected source file entry. */
export interface ProjectedSourceFile {
  readonly path: string;
  readonly mediaType: string;
  readonly size: number;
  readonly checksum: string;
}

/** Projected asset entry with provenance. */
export interface ProjectedAsset {
  readonly path: string;
  readonly mediaType: string;
  readonly size: number;
  readonly license: string;
  readonly source: string;
}

/** Projected example for MCP consumers. */
export interface ProjectedExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly sourcePath: string;
  readonly interactive: boolean;
}

/** Projected performance record (simplified for MCP output). */
export interface ProjectedPerformanceRecord {
  readonly metric: string;
  readonly scenario: string;
  readonly result: number;
  readonly threshold: number;
  readonly unit: string;
  readonly status: "passed" | "failed";
}

// ---------------------------------------------------------------------------
// Projection functions
// ---------------------------------------------------------------------------

/**
 * Projects a `ThreeDComponentRecord` into a deterministic, JSON-safe Registry
 * projection. Deep-copies all data and freezes the result.
 *
 * For experimental artifacts, includes blockers and generated warnings.
 * For stable artifacts, blockers array is empty.
 *
 * Requirements: 5.14, 5.16, 5.20, 5.21
 */
export function projectThreeDComponent(record: ThreeDComponentRecord): ProjectedThreeDComponent {
  const blockers = record.blockers ? deepClone(record.blockers) : [];
  const experimentalWarnings = generateExperimentalWarnings(record);

  const projection: ProjectedThreeDComponent = {
    ref: deepClone(record.ref),
    status: record.status,
    schemaVersion: record.schemaVersion,
    requiredCapability: record.requiredCapability,
    fallback: projectFallback(record.fallback),
    errorBoundary: deepClone(record.errorBoundary),
    parameters: record.parameters.map(projectParameter),
    resumeStateDescription: record.resumeStateDescription,
    sourceFiles: record.sourceFiles.map(projectSourceFile),
    dependencies: deepClone(record.dependencies),
    assets: record.assets.map(projectAsset),
    provenance: deepClone(record.provenance),
    examples: record.examples.map(projectExample),
    performanceRecords: record.performanceRecords.map(projectPerformanceRecord),
    blockers: [...blockers],
    experimentalWarnings,
  };

  return Object.freeze(projection);
}

/**
 * Determines stable/experimental classification based on completeness and evidence.
 */
export function classifyThreeDStatus(record: ThreeDComponentRecord): {
  status: "stable" | "experimental";
  blockers: ThreeDBlockingCondition[];
} {
  const blockers: ThreeDBlockingCondition[] = [];

  const validation = validateComponentRecord(record);
  for (const issue of validation.issues) {
    blockers.push({ code: "incomplete_evidence", description: issue });
  }

  // Check for failing performance records
  const failingPerf = record.performanceRecords.filter((r) => r.status === "failed");
  if (failingPerf.length > 0) {
    blockers.push({
      code: "performance_failure",
      description: `${failingPerf.length} performance check(s) failing`,
    });
  }

  // Include explicit blockers
  if (record.blockers) {
    blockers.push(...record.blockers);
  }

  return {
    status: blockers.length === 0 ? "stable" : "experimental",
    blockers,
  };
}

// ---------------------------------------------------------------------------
// MCP Response Builders
// ---------------------------------------------------------------------------

/**
 * Builds the full MCP retrieval payload for a 3D component.
 * Requirement 5.16
 */
export function buildThreeDMcpPayload(record: ThreeDComponentRecord): Record<string, unknown> {
  const projected = projectThreeDComponent(record);

  return {
    kind: "three-d-component",
    stableId: projected.ref.stableId,
    version: projected.ref.version,
    status: projected.status,
    schemaVersion: projected.schemaVersion,
    capability: {
      required: projected.requiredCapability,
      fallbackDescription: projected.fallback.description,
      fallbackSourcePath: projected.fallback.fallbackSourcePath,
    },
    errorBoundary: projected.errorBoundary,
    parameters: projected.parameters,
    resumeState: projected.resumeStateDescription,
    source: projected.sourceFiles,
    dependencies: projected.dependencies,
    assets: projected.assets,
    provenance: projected.provenance.map((p) => ({
      name: p.name,
      version: p.version,
      license: p.spdxIdentifier,
      source: p.source,
    })),
    examples: projected.examples,
    performance: projected.performanceRecords,
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
 * Builds a summary entry for 3D components in list/search MCP responses.
 */
export function buildThreeDMcpSummary(record: ThreeDComponentRecord): Record<string, unknown> {
  return {
    kind: "three-d-component",
    stableId: record.ref.stableId,
    version: record.ref.version,
    status: record.status,
    requiredCapability: record.requiredCapability,
    hasFallback: true,
    parameterCount: record.parameters.length,
    exampleCount: record.examples.length,
    performanceStatus: record.performanceRecords.every((r) => r.status === "passed")
      ? "passing"
      : "failing",
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function projectFallback(fallback: ThreeDFallbackContract): ProjectedFallback {
  const base = {
    description: fallback.description,
    preservesContent: true as const,
    preservesStatus: true as const,
    preservesPrimaryActions: true as const,
    fallbackSourcePath: fallback.fallbackSourcePath,
  };

  if (fallback.fallbackArtifactRef) {
    return { ...base, fallbackArtifactRef: deepClone(fallback.fallbackArtifactRef) };
  }

  return base;
}

function projectParameter(param: ThreeDParameter): ProjectedParameter {
  const projected: ProjectedParameter = {
    name: param.name,
    type: param.type,
    description: param.description,
    default: param.default,
    required: param.required,
    group: param.group,
    ...(param.allowedValues ? { allowedValues: [...param.allowedValues] } : {}),
    ...(param.range ? { range: { min: param.range.min, max: param.range.max } } : {}),
  };
  return projected;
}

function projectSourceFile(file: FileRecord): ProjectedSourceFile {
  return {
    path: file.path,
    mediaType: file.mediaType,
    size: file.size,
    checksum: file.checksum.digest,
  };
}

function projectAsset(asset: ThreeDAssetRef): ProjectedAsset {
  return {
    path: asset.path,
    mediaType: asset.mediaType,
    size: asset.size,
    license: asset.provenance.spdxIdentifier,
    source: asset.provenance.source,
  };
}

function projectExample(example: ThreeDExample): ProjectedExample {
  return {
    id: example.id,
    title: example.title,
    description: example.description,
    parameters: deepClone(example.parameters) as Record<string, unknown>,
    sourcePath: example.sourcePath,
    interactive: example.interactive,
  };
}

function projectPerformanceRecord(record: PerformanceRecord): ProjectedPerformanceRecord {
  return {
    metric: record.metric,
    scenario: record.scenario,
    result: record.result,
    threshold: record.threshold,
    unit: record.unit,
    status: record.status,
  };
}

function generateExperimentalWarnings(record: ThreeDComponentRecord): string[] {
  if (record.status !== "experimental") return [];

  const warnings: string[] = [];

  if (record.blockers && record.blockers.length > 0) {
    warnings.push(
      `This 3D component has ${record.blockers.length} blocking condition(s) preventing stable classification.`,
    );
  }

  const failingPerf = record.performanceRecords.filter((r) => r.status === "failed");
  if (failingPerf.length > 0) {
    warnings.push(
      `${failingPerf.length} performance check(s) are failing. Review thresholds before production use.`,
    );
  }

  if (record.examples.length === 0) {
    warnings.push("No usage examples are published.");
  }

  if (record.performanceRecords.length === 0) {
    warnings.push("No performance records are published. Runtime impact is undocumented.");
  }

  if (record.assets.length > 0) {
    const unreviewed = record.assets.filter((a) => a.provenance.reviewStatus !== "approved");
    if (unreviewed.length > 0) {
      warnings.push(`${unreviewed.length} asset(s) have unapproved provenance.`);
    }
  }

  return warnings;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
