import type {
  ArtifactRef,
  FileRecord,
  JsonValue,
  LicenseProvenance,
  PerformanceRecord,
  SemanticVersion,
} from "@neuraforge/schemas";

// ---------------------------------------------------------------------------
// 3D Component Lifecycle States (Design: ThreeDComponentRecord)
// ---------------------------------------------------------------------------

/**
 * The closed set of lifecycle states a 3D component may occupy. Transitions:
 *
 *   fallback ─► initializing ─► active ─► suspended ─► active (resume)
 *       │              │                       │
 *       │              ▼                       ▼
 *       │           failed ◄───────────────────┘
 *       ▼
 *    (render fallback content)
 *
 * - `fallback` — capability unavailable or not yet checked; renders non-3D fallback.
 * - `initializing` — capability detected, loading runtime/assets.
 * - `active` — fully rendered 3D scene, continuous render loop running.
 * - `suspended` — offscreen; render loop paused, state preserved.
 * - `failed` — initialization or runtime error; renders non-3D fallback.
 *
 * Requirements: 5.17, 5.18, 5.19
 */
export type ThreeDLifecycleState = "fallback" | "initializing" | "active" | "suspended" | "failed";

/** Runtime-accessible array of all lifecycle states. */
export const THREE_D_LIFECYCLE_STATES: readonly ThreeDLifecycleState[] = [
  "fallback",
  "initializing",
  "active",
  "suspended",
  "failed",
] as const;

// ---------------------------------------------------------------------------
// Capability Detection (Requirement 5.17)
// ---------------------------------------------------------------------------

/**
 * The closed set of 3D rendering capabilities a component may require.
 * Detection must be synchronous, side-effect-free, and safe in SSR/Node.
 */
export type ThreeDCapability = "webgl" | "webgl2" | "webgpu";

/** Runtime-accessible array of all capabilities. */
export const THREE_D_CAPABILITIES: readonly ThreeDCapability[] = [
  "webgl",
  "webgl2",
  "webgpu",
] as const;

/**
 * A synchronous, side-effect-free predicate that detects whether a given 3D
 * rendering capability is available. Must return `false` (not throw) in SSR/Node.
 */
export type CapabilityPredicate = (capability: ThreeDCapability) => boolean;

/**
 * Result of a capability check: which capabilities were checked, which passed,
 * and whether the minimum required capability is available.
 */
export interface CapabilityCheckResult {
  readonly requiredCapability: ThreeDCapability;
  readonly available: boolean;
  readonly checked: readonly ThreeDCapability[];
  readonly supported: readonly ThreeDCapability[];
}

// ---------------------------------------------------------------------------
// Non-3D Fallback Contract (Requirement 5.17)
// ---------------------------------------------------------------------------

/**
 * The non-3D fallback is first-class source, not an error message. It preserves
 * content, status, and primary actions when the 3D capability is unavailable or
 * initialization fails.
 */
export interface ThreeDFallbackContract {
  /** Human-readable description of what the fallback renders. */
  readonly description: string;
  /** The fallback preserves the same textual content visible in the 3D version. */
  readonly preservesContent: true;
  /** The fallback preserves the logical status of the component. */
  readonly preservesStatus: true;
  /** The fallback preserves all primary interactive actions. */
  readonly preservesPrimaryActions: true;
  /** Path to the fallback source file (first-class source, not generated). */
  readonly fallbackSourcePath: string;
  /** The artifact reference for the fallback (can be a standard component). */
  readonly fallbackArtifactRef?: ArtifactRef;
}

// ---------------------------------------------------------------------------
// Error Boundary Contract
// ---------------------------------------------------------------------------

/**
 * What happens when a 3D component fails at runtime (WebGL context lost, shader
 * compilation failure, asset loading timeout, etc.). The error boundary transitions
 * the component to the `failed` state and renders the non-3D fallback.
 */
export interface ThreeDErrorBoundary {
  /** Maximum time to wait for initialization before transitioning to failed. */
  readonly initTimeoutMs: number;
  /** Whether to attempt re-initialization on context restored events. */
  readonly retryOnContextRestored: boolean;
  /** Maximum retry attempts before permanently entering failed state. */
  readonly maxRetries: number;
}

// ---------------------------------------------------------------------------
// Parameter Schema (Requirement 5.16)
// ---------------------------------------------------------------------------

/**
 * A typed parameter that a 3D component exposes for customization.
 * Parameters cover camera, lighting, materials, geometry, interactions, etc.
 */
export interface ThreeDParameter {
  readonly name: string;
  readonly type:
    | "number"
    | "boolean"
    | "string"
    | "color"
    | "vector3"
    | "euler"
    | "enum"
    | "object";
  readonly description: string;
  readonly default: JsonValue;
  readonly required: boolean;
  readonly allowedValues?: readonly JsonValue[];
  readonly range?: { readonly min: number; readonly max: number };
  readonly group: string;
}

// ---------------------------------------------------------------------------
// Action Journal (Requirement 5.19 - prevent replay on resume)
// ---------------------------------------------------------------------------

/**
 * A committed user-visible action that occurred while the 3D component was active.
 * Actions are journaled so that on suspend/resume, already-committed actions are
 * not replayed.
 */
export interface CommittedAction {
  readonly actionId: string;
  readonly timestamp: number;
  readonly description: string;
}

/**
 * The action journal tracks all committed user-visible actions across the component's
 * lifecycle. On resume from suspension, previously committed action IDs are checked
 * to prevent duplicate execution.
 */
export interface ActionJournal {
  readonly entries: readonly CommittedAction[];
  readonly lastCommittedId: string | undefined;
}

// ---------------------------------------------------------------------------
// Resume State Contract (Requirement 5.19)
// ---------------------------------------------------------------------------

/**
 * The serializable state that must be preserved across suspend/resume cycles.
 * When a 3D component is suspended (offscreen), this state is saved. On resume,
 * the component restores from this state rather than re-initializing from scratch.
 */
export interface ResumeStateContract {
  /** Description of what state is preserved. */
  readonly description: string;
  /** The serializable state snapshot. */
  readonly state: JsonValue;
  /** Action journal at time of suspension — used to prevent replay. */
  readonly actionJournal: ActionJournal;
  /** Timestamp of when the state was captured. */
  readonly suspendedAt: number;
}

// ---------------------------------------------------------------------------
// 3D Dependency and Asset References
// ---------------------------------------------------------------------------

/** An exact-version runtime dependency for a 3D component. */
export interface ThreeDDependencyRef {
  readonly name: string;
  readonly version: string;
  readonly source: string;
}

/** A 3D asset (model, texture, shader, etc.) with provenance. */
export interface ThreeDAssetRef {
  readonly path: string;
  readonly mediaType: string;
  readonly size: number;
  readonly provenance: LicenseProvenance;
}

// ---------------------------------------------------------------------------
// 3D Example
// ---------------------------------------------------------------------------

/** A documented usage example for a 3D component with interactivity flag. */
export interface ThreeDExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly parameters: Readonly<Record<string, JsonValue>>;
  readonly sourcePath: string;
  readonly interactive: boolean;
}

// ---------------------------------------------------------------------------
// Blocking Condition
// ---------------------------------------------------------------------------

/** A condition blocking a 3D component from stable classification. */
export interface ThreeDBlockingCondition {
  readonly code: string;
  readonly description: string;
  readonly checkId?: string;
}

// ---------------------------------------------------------------------------
// ThreeDComponentRecord — the Registry artifact entry
// ---------------------------------------------------------------------------

/**
 * The complete Registry record for a 3D component artifact. Contains identity,
 * capability requirements, fallback, parameters, lifecycle, dependencies, assets,
 * examples, performance records, and blocking conditions.
 *
 * Requirements: 5.16, 5.17, 5.18, 5.19, 5.20, 5.21, 5.22
 */
export interface ThreeDComponentRecord {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly requiredCapability: ThreeDCapability;
  readonly fallback: ThreeDFallbackContract;
  readonly errorBoundary: ThreeDErrorBoundary;
  readonly parameters: readonly ThreeDParameter[];
  readonly resumeStateDescription: string;
  readonly sourceFiles: readonly FileRecord[];
  readonly dependencies: readonly ThreeDDependencyRef[];
  readonly assets: readonly ThreeDAssetRef[];
  readonly provenance: readonly LicenseProvenance[];
  readonly examples: readonly ThreeDExample[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly blockers?: readonly ThreeDBlockingCondition[];
}
