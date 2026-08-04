import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
} from "@neuraforge/schemas";
import type {
  AccessibilityPrimitiveDeclaration,
  BehaviorMap,
  BlockingCondition,
  ComponentCategory,
  ComponentExample,
  ComponentRecord,
  ComponentState,
  DependencyRef,
  InstallInstruction,
  PerformanceBudget,
  PropDefinition,
  ReducedMotionContract,
} from "../contracts/types.js";

/**
 * A deterministic, JSON-safe projection of a ComponentRecord suitable for the Registry.
 *
 * The projection excludes function values (e.g. capability detector) and replaces them
 * with the capability ID reference. This ensures the projection can be serialized to JSON
 * deterministically for Registry and MCP consumers.
 *
 * Validates: Requirements 3.2-3.7, Property 6, Property 21.
 */

/** The projected capability contract, without the runtime detection function. */
export type ProjectedCapabilityContract =
  | {
      requiresOptionalCapability: true;
      capability: string;
      fallback: {
        description: string;
        preservesContent: true;
        preservesPrimaryActions: true;
      };
    }
  | {
      requiresOptionalCapability: false;
    };

/** The Registry-facing projection of a ComponentRecord. No functions, JSON-safe. */
export interface ProjectedComponentRecord {
  ref: ArtifactRef;
  status: "experimental" | "stable";
  category: ComponentCategory;
  sourceFiles: FileRecord[];
  generatedFiles: FileRecord[];
  dependencies: DependencyRef[];
  peerDependencies: DependencyRef[];
  compatibility: CompatibilityConstraint[];
  installation: InstallInstruction[];
  checksum: Checksum;
  provenance: LicenseProvenance[];
  documentationPath: string;
  blockers?: BlockingCondition[] | undefined;
  props: PropDefinition[];
  supportedStates: ComponentState[];
  behavior: BehaviorMap;
  accessibilityPrimitive: AccessibilityPrimitiveDeclaration;
  capability: ProjectedCapabilityContract;
  reducedMotion: ReducedMotionContract;
  examples: ComponentExample[];
  performanceBudgets: PerformanceBudget[];
  performanceRecords: PerformanceRecord[];
}

/**
 * Deep clones a value using structured clone (JSON-safe approach).
 * For values that are already JSON-safe, this provides immutability.
 */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Projects a ComponentRecord into a deterministic, JSON-safe, immutable Registry projection.
 *
 * - Removes the `detection` function from capability contracts.
 * - Deep-copies all data to prevent caller mutation from affecting the source catalog.
 * - Freezes the result to prevent accidental mutation.
 */
export function projectComponentRecord(record: ComponentRecord): ProjectedComponentRecord {
  const projectedCapability: ProjectedCapabilityContract = record.capability
    .requiresOptionalCapability
    ? {
        requiresOptionalCapability: true,
        capability: record.capability.capability,
        fallback: {
          description: record.capability.fallback.description,
          preservesContent: true,
          preservesPrimaryActions: true,
        },
      }
    : { requiresOptionalCapability: false };

  const projection: ProjectedComponentRecord = {
    ref: deepClone(record.ref),
    status: record.status,
    category: record.category,
    sourceFiles: deepClone(record.sourceFiles),
    generatedFiles: deepClone(record.generatedFiles),
    dependencies: deepClone(record.dependencies),
    peerDependencies: deepClone(record.peerDependencies),
    compatibility: deepClone(record.compatibility),
    installation: deepClone(record.installation),
    checksum: deepClone(record.checksum),
    provenance: deepClone(record.provenance),
    documentationPath: record.documentationPath,
    blockers: record.blockers ? deepClone(record.blockers) : undefined,
    props: deepClone(record.props),
    supportedStates: deepClone(record.supportedStates),
    behavior: deepClone(record.behavior),
    accessibilityPrimitive: deepClone(record.accessibilityPrimitive),
    capability: projectedCapability,
    reducedMotion: deepClone(record.reducedMotion),
    examples: deepClone(record.examples),
    performanceBudgets: deepClone(record.performanceBudgets),
    performanceRecords: deepClone(record.performanceRecords),
  };

  return Object.freeze(projection) as ProjectedComponentRecord;
}
