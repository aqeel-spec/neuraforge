/**
 * Registry-builder data types.
 *
 * All types are JSON-safe immutable data only — no functions, no class instances.
 * Implements Requirements 7.1-7.3, 7.9-7.10, 11.7-11.11, 12.1-12.14.
 */

import type {
  ArtifactRef,
  BuildInstruction,
  Checksum,
  CompatibilityConstraint,
  CompatibilityMatrixEntry,
  DependencyInventoryItem,
  FieldError,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  QualityGateResult,
  ReleaseApproval,
  ReleaseManifest,
  SemanticVersion,
} from "@neuraforge-ui/schemas";
import type { ProjectedComponentRecord } from "@neuraforge-ui/components";
import type { TokenDocument, TokenPublicationIndex } from "@neuraforge-ui/tokens";

// ---------------------------------------------------------------------------
// Source files with content
// ---------------------------------------------------------------------------

/** A source file with its actual text content included in the bundle. */
export interface SourceFileWithContent {
  readonly path: string;
  readonly origin: "original" | "generated";
  readonly mediaType: string;
  readonly size: number;
  readonly checksum: Checksum;
  readonly content: string;
}

// ---------------------------------------------------------------------------
// Registry Artifact Entry
// ---------------------------------------------------------------------------

/** A single component artifact in the registry snapshot. */
export interface RegistryArtifactEntry {
  readonly ref: ArtifactRef;
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly status: "experimental" | "stable";
  readonly sourceFiles: readonly SourceFileWithContent[];
  readonly generatedFiles: readonly FileRecord[];
  readonly dependencies: readonly {
    readonly name: string;
    readonly version: string;
    readonly source: string;
  }[];
  readonly peerDependencies: readonly {
    readonly name: string;
    readonly version: string;
    readonly source: string;
  }[];
  readonly compatibility: readonly CompatibilityConstraint[];
  readonly installation: readonly {
    readonly step: number;
    readonly description: string;
    readonly command?: string;
  }[];
  readonly checksum: Checksum;
  readonly provenance: readonly LicenseProvenance[];
  readonly documentationPath: string;
  readonly registryLocation: string;
}

// ---------------------------------------------------------------------------
// Token Artifact
// ---------------------------------------------------------------------------

/** The token artifact in the registry snapshot. */
export interface RegistryTokenArtifact {
  readonly schemaVersion: string;
  readonly releaseVersion: string;
  readonly tokenDocument: TokenDocument;
  readonly checksum: Checksum;
  readonly publications: TokenPublicationIndex;
  readonly registryLocation: string;
}

// ---------------------------------------------------------------------------
// Required MVP Surfaces
// ---------------------------------------------------------------------------

/** A required surface that must be present in the MVP release. */
export interface RequiredMvpSurface {
  readonly surfaceId: string;
  readonly publicSourceLocation: string;
  readonly buildCommand: string;
}

// ---------------------------------------------------------------------------
// Registry Snapshot
// ---------------------------------------------------------------------------

/** The immutable, content-addressed registry snapshot. */
export interface RegistrySnapshot {
  readonly schemaVersion: "1.0.0";
  readonly registryVersion: SemanticVersion;
  readonly releaseVersion: SemanticVersion;
  readonly status: "candidate" | "rejected" | "experimental" | "approved" | "stable" | "published";
  readonly createdAt: string;
  readonly selectionRuleVersions: readonly string[];
  readonly supportedTailwindVersions: readonly string[];
  readonly components: readonly RegistryArtifactEntry[];
  readonly tokenArtifact: RegistryTokenArtifact;
  readonly requiredSurfaces: readonly RequiredMvpSurface[];
  readonly snapshotChecksum: Checksum;
}

// ---------------------------------------------------------------------------
// Release Bundle
// ---------------------------------------------------------------------------

/** The complete immutable release bundle. */
export interface ReleaseBundle {
  readonly manifest: ReleaseManifest;
  readonly snapshot: RegistrySnapshot;
  readonly bundleChecksum: Checksum;
  readonly bundleAddress: string;
}

// ---------------------------------------------------------------------------
// Quality Exception
// ---------------------------------------------------------------------------

/** A documented exception to a quality gate requirement. */
export interface QualityException {
  readonly checkId: string;
  readonly checkType: QualityGateResult["checkType"];
  readonly reason: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly expiresAt: string;
  readonly category: "security" | "non-security";
}

// ---------------------------------------------------------------------------
// Build Validation Result
// ---------------------------------------------------------------------------

/** Discriminated success/failure result of buildReleaseBundle. */
export type BuildValidationResult =
  | { readonly success: true; readonly bundle: ReleaseBundle }
  | { readonly success: false; readonly errors: readonly FieldError[] };

// ---------------------------------------------------------------------------
// Quality Classification
// ---------------------------------------------------------------------------

export type QualityClassification = "stable" | "experimental" | "rejected";

export interface QualityClassificationResult {
  readonly classification: QualityClassification;
  readonly reasons: readonly string[];
}

// ---------------------------------------------------------------------------
// MVP Inventory Validation
// ---------------------------------------------------------------------------

export interface MvpInventoryResult {
  readonly valid: boolean;
  readonly errors: readonly FieldError[];
}

// ---------------------------------------------------------------------------
// Release Build Input
// ---------------------------------------------------------------------------

/** Source content loader — abstracts filesystem I/O for deterministic core. */
export interface SourceContentLoader {
  readonly loadContent: (path: string) => Promise<string>;
}

/** Input to buildReleaseBundle. Treated as untrusted at the validation boundary. */
export interface ReleaseBuildInput {
  readonly schemaVersion: "1.0.0";
  readonly registryVersion: string;
  readonly releaseVersion: string;
  readonly createdAt: string;
  readonly selectionRuleVersions: readonly string[];
  readonly supportedTailwindVersions: readonly string[];
  readonly components: readonly ProjectedComponentRecord[];
  readonly sourceContents: ReadonlyMap<string, string>;
  readonly tokenDocument: TokenDocument;
  readonly tokenChecksum: Checksum;
  readonly buildInstructions: readonly BuildInstruction[];
  readonly productionInventory: readonly DependencyInventoryItem[];
  readonly compatibilityMatrix: readonly CompatibilityMatrixEntry[];
  readonly requiredSurfaces: readonly RequiredMvpSurface[];
  readonly qualityResults: readonly QualityGateResult[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly exceptions: readonly QualityException[];
  readonly approval?: ReleaseApproval | undefined;
  readonly publishedAt?: string | undefined;
  readonly licenseTextPath: string;
  readonly copyrightNotices: readonly string[];
  readonly thirdPartyNoticesPath: string;
}

// ---------------------------------------------------------------------------
// Bundle Verification
// ---------------------------------------------------------------------------

export interface VerificationMismatch {
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
}

export interface VerificationResult {
  readonly valid: boolean;
  readonly mismatches: readonly VerificationMismatch[];
}
