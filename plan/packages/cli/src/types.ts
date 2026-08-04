/**
 * Strict JSON-safe types for the transactional CLI installer.
 *
 * All types are plain data — no class instances, functions, or non-JSON values.
 * Exact versions only; no "latest", ranges, or wildcards.
 */

import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  LicenseProvenance,
  SemanticVersion,
} from "@neuraforge-ui/schemas";

// ---------------------------------------------------------------------------
// Install Request
// ---------------------------------------------------------------------------

/** A request to install a specific component at an exact version. */
export interface InstallRequest {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly destination: string;
  readonly approvedOverwritePaths?: readonly string[] | undefined;
}

// ---------------------------------------------------------------------------
// Target Precondition
// ---------------------------------------------------------------------------

/** A precondition on an existing file in the target. */
export interface TargetPrecondition {
  readonly path: string;
  readonly exists: boolean;
  readonly checksum?: Checksum | undefined;
}

// ---------------------------------------------------------------------------
// File Change
// ---------------------------------------------------------------------------

export type FileChangeKind = "add" | "modify" | "conflict" | "unchanged";

export interface FileChange {
  readonly path: string;
  readonly kind: FileChangeKind;
  readonly sourceChecksum: Checksum;
  readonly beforeChecksum?: Checksum | undefined;
  readonly afterChecksum: Checksum;
}

// ---------------------------------------------------------------------------
// Dependency Change
// ---------------------------------------------------------------------------

export interface DependencyChange {
  readonly name: string;
  readonly version: string;
  readonly source: string;
  readonly action: "add" | "upgrade" | "unchanged";
}

// ---------------------------------------------------------------------------
// Rollback Action
// ---------------------------------------------------------------------------

export type RollbackActionKind = "restore" | "delete";

export interface RollbackAction {
  readonly path: string;
  readonly kind: RollbackActionKind;
  readonly restoreContent?: string | undefined;
  readonly restoreChecksum?: Checksum | undefined;
}

// ---------------------------------------------------------------------------
// Install Plan
// ---------------------------------------------------------------------------

export interface ApplyOperation {
  readonly index: number;
  readonly kind: "write";
  readonly path: string;
  readonly content: string;
  readonly checksum: Checksum;
}

export interface InstallPlan {
  readonly planId: string;
  readonly planChecksum: Checksum;
  readonly request: InstallRequest;
  readonly artifactRef: ArtifactRef;
  readonly registryLocation: string;
  readonly artifactChecksum: Checksum;
  readonly sourceChecksums: readonly { readonly path: string; readonly checksum: Checksum }[];
  readonly dependencies: readonly DependencyChange[];
  readonly fileChanges: readonly FileChange[];
  readonly preconditions: readonly TargetPrecondition[];
  readonly operations: readonly ApplyOperation[];
  readonly rollbackActions: readonly RollbackAction[];
  readonly compatibility: readonly CompatibilityConstraint[];
  readonly provenance: readonly LicenseProvenance[];
  readonly installation: readonly {
    readonly step: number;
    readonly description: string;
    readonly command?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

export interface Confirmation {
  readonly confirmed: true;
  readonly planId: string;
  readonly planChecksum: Checksum;
  readonly approvedOverwritePaths?: readonly string[] | undefined;
}

// ---------------------------------------------------------------------------
// Install Journal
// ---------------------------------------------------------------------------

export interface JournalBackup {
  readonly path: string;
  readonly content: string;
  readonly checksum: Checksum;
}

export interface InstallJournal {
  readonly planId: string;
  readonly planChecksum: Checksum;
  readonly status: "prepared" | "in_progress" | "committed" | "rolled_back";
  readonly operationIndex: number;
  readonly backups: readonly JournalBackup[];
  readonly rollbackActions: readonly RollbackAction[];
  readonly plan: InstallPlan;
}

// ---------------------------------------------------------------------------
// Install Receipt
// ---------------------------------------------------------------------------

export interface InstallReceipt {
  readonly planId: string;
  readonly planChecksum: Checksum;
  readonly artifactRef: ArtifactRef;
  readonly filesWritten: readonly string[];
  readonly journalPath: string;
}

// ---------------------------------------------------------------------------
// Rollback Report
// ---------------------------------------------------------------------------

export interface RollbackCompletedAction {
  readonly path: string;
  readonly kind: RollbackActionKind;
  readonly status: "completed" | "already_restored" | "residual_mismatch";
  readonly message?: string | undefined;
}

export interface RollbackReport {
  readonly planId: string;
  readonly completedActions: readonly RollbackCompletedAction[];
  readonly residualMismatches: readonly {
    readonly path: string;
    readonly expected?: string;
    readonly actual?: string;
  }[];
  readonly success: boolean;
}

// ---------------------------------------------------------------------------
// Installer Errors
// ---------------------------------------------------------------------------

export type InstallerErrorCode =
  | "validation_error"
  | "not_found"
  | "integrity_failed"
  | "precondition_failed"
  | "confirmation_required"
  | "confirmation_mismatch"
  | "apply_failed"
  | "rollback_failed"
  | "journal_invalid"
  | "path_security_violation";

export interface InstallerError {
  readonly code: InstallerErrorCode;
  readonly message: string;
  readonly fields?:
    | readonly { readonly path: string; readonly constraint: string; readonly guidance: string }[]
    | undefined;
  readonly alternatives?: readonly ArtifactRef[] | undefined;
  readonly rollbackReport?: RollbackReport | undefined;
}

export type InstallerResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: InstallerError };

// ---------------------------------------------------------------------------
// Search / Inspect Results
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly score: number;
  readonly ruleVersion: string;
  readonly explanations: readonly string[];
}

export interface SearchResult {
  readonly query: string;
  readonly results: readonly SearchResultItem[];
  readonly ruleVersion: string;
}

export interface InspectResult {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly registryLocation: string;
  readonly sourceFiles: readonly {
    readonly path: string;
    readonly checksum: Checksum;
    readonly size: number;
  }[];
  readonly artifactChecksum: Checksum;
  readonly dependencies: readonly {
    readonly name: string;
    readonly version: string;
    readonly source: string;
  }[];
  readonly compatibility: readonly CompatibilityConstraint[];
  readonly provenance: readonly LicenseProvenance[];
  readonly installation: readonly {
    readonly step: number;
    readonly description: string;
    readonly command?: string;
  }[];
}
