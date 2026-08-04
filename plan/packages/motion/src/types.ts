import type {
  ArtifactRef,
  SemanticVersion,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  JsonValue,
} from "@neuraforge/schemas";

// ---------------------------------------------------------------------------
// Motion Control Name — closed string literal union (Requirement 5.6)
// ---------------------------------------------------------------------------

/**
 * The closed set of motion control dimensions every motion preset or animated component
 * must classify. Each control is either `applicable` (with typed domain, default,
 * constraints, and breakpoint support) or `not_applicable` (with a reason). No control
 * may be omitted; this is the type-level enforcement of "classify every control exactly
 * once".
 */
export type MotionControlName =
  | "variants"
  | "initial"
  | "animate"
  | "exit"
  | "duration"
  | "delay"
  | "repeat"
  | "easing"
  | "springStiffness"
  | "springDamping"
  | "springMass"
  | "springBounce"
  | "orchestration"
  | "stagger"
  | "gestureDrag"
  | "gestureHover"
  | "gestureTap"
  | "viewportTrigger"
  | "scrollTrigger"
  | "layoutAnimation"
  | "motionDisablement"
  | "breakpointBehavior";

/**
 * Runtime-accessible array of every `MotionControlName` value. Used for iteration,
 * validation, and completeness checks.
 */
export const MOTION_CONTROL_NAMES = [
  "variants",
  "initial",
  "animate",
  "exit",
  "duration",
  "delay",
  "repeat",
  "easing",
  "springStiffness",
  "springDamping",
  "springMass",
  "springBounce",
  "orchestration",
  "stagger",
  "gestureDrag",
  "gestureHover",
  "gestureTap",
  "viewportTrigger",
  "scrollTrigger",
  "layoutAnimation",
  "motionDisablement",
  "breakpointBehavior",
] as const satisfies readonly MotionControlName[];

// ---------------------------------------------------------------------------
// Motion Control Type — the value domain discriminator
// ---------------------------------------------------------------------------

/**
 * The closed set of value-domain shapes a motion control may declare. Each type implies
 * a distinct JSON representation and validation strategy.
 */
export type MotionControlType =
  | "number"
  | "boolean"
  | "enum"
  | "spring"
  | "easing-function"
  | "variant-map"
  | "keyframe-array"
  | "stagger-config"
  | "gesture-config"
  | "trigger-config"
  | "layout-config"
  | "breakpoint-map";

// ---------------------------------------------------------------------------
// Breakpoints
// ---------------------------------------------------------------------------

/** The closed set of responsive breakpoint identifiers aligned with the design token system. */
export type BreakpointId = "sm" | "md" | "lg" | "xl" | "2xl";

/** Runtime-accessible array of every `BreakpointId` value. */
export const BREAKPOINT_IDS = ["sm", "md", "lg", "xl", "2xl"] as const satisfies readonly BreakpointId[];

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

/**
 * A named constraint governing valid values or valid combinations of motion controls.
 * Constraints are referenced by ID in validation faults so agents can explain why a
 * configuration was rejected.
 */
export interface MotionConstraint {
  readonly constraintId: string;
  readonly description: string;
  readonly relatedControls?: readonly MotionControlName[];
}

// ---------------------------------------------------------------------------
// Applicable / Non-Applicable discriminated union
// ---------------------------------------------------------------------------

/**
 * A motion control that is relevant to the artifact and accepts a typed value with
 * defaults, optional allowed-value set, optional numeric range, constraints, and
 * breakpoint support classification.
 */
export interface ApplicableControl {
  readonly applicability: "applicable";
  readonly type: MotionControlType;
  readonly default: JsonValue;
  readonly allowedValues?: readonly JsonValue[];
  readonly range?: { readonly min: number; readonly max: number };
  readonly constraints: readonly MotionConstraint[];
  readonly breakpoints: readonly BreakpointId[] | "all" | "none";
}

/**
 * A motion control that intentionally does not apply to the artifact, with a
 * human-readable reason explaining why.
 */
export interface NonApplicableControl {
  readonly applicability: "not_applicable";
  readonly reason: string;
}

/** The discriminated union of applicable and non-applicable motion controls. */
export type MotionControl = ApplicableControl | NonApplicableControl;

// ---------------------------------------------------------------------------
// Reduced-motion accessibility contract
// ---------------------------------------------------------------------------

/** An animation that cannot be fully disabled because it conveys essential meaning. */
export interface EssentialTransition {
  readonly id: string;
  readonly description: string;
  /** Maximum duration in milliseconds for the essential transition under reduced-motion. */
  readonly reducedDuration: number;
}

/**
 * The accessibility contract for `prefers-reduced-motion`. Declares what decorative
 * motion is disabled and which transitions remain (at reduced duration) because they
 * convey essential state changes.
 */
export interface ReducedMotionBehavior {
  readonly disabledDecorativeMotion: string;
  readonly essentialTransitions: readonly EssentialTransition[];
}

// ---------------------------------------------------------------------------
// Customization Schema
// ---------------------------------------------------------------------------

/**
 * The complete motion customization schema for a single artifact. Contains a total
 * `controls` record (every `MotionControlName` classified exactly once) and the
 * reduced-motion accessibility contract.
 */
export interface MotionCustomizationSchema {
  readonly artifactRef: ArtifactRef;
  readonly schemaVersion: SemanticVersion;
  readonly controls: Readonly<Record<MotionControlName, MotionControl>>;
  readonly reducedMotion: ReducedMotionBehavior;
}

// ---------------------------------------------------------------------------
// Override and Resolution
// ---------------------------------------------------------------------------

/**
 * User-supplied or agent-supplied overrides to a motion preset's defaults. Supports
 * both global overrides and per-breakpoint overrides.
 */
export interface MotionOverrideConfig {
  readonly overrides?: Partial<Record<MotionControlName, JsonValue>>;
  readonly breakpointOverrides?: Partial<Record<BreakpointId, Partial<Record<MotionControlName, JsonValue>>>>;
}

/**
 * The fully resolved motion configuration after applying overrides on top of defaults.
 * Tracks which controls received overrides and which used defaults for traceability.
 */
export interface ResolvedMotionConfig {
  readonly values: Readonly<Record<MotionControlName, JsonValue | undefined>>;
  readonly breakpointValues: Readonly<Record<BreakpointId, Readonly<Record<MotionControlName, JsonValue | undefined>>>>;
  readonly appliedOverrides: readonly string[];
  readonly appliedDefaults: readonly string[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * A single validation fault detected when checking a motion override config against a
 * customization schema. Contains structured information for agent-friendly error
 * reporting.
 */
export interface MotionValidationFault {
  readonly code: "unknown_field" | "wrong_type" | "non_applicable" | "out_of_range" | "invalid_combination";
  readonly path: string;
  readonly constraint: string;
  readonly guidance: string;
}

// ---------------------------------------------------------------------------
// Motion Preset Record — the Registry artifact entry
// ---------------------------------------------------------------------------

/** An exact-version dependency reference for a motion preset or animated component. */
export interface MotionDependencyRef {
  readonly name: string;
  readonly version: string;
  readonly source: string;
}

/** A documented usage example for a motion preset, with optional interactivity flag. */
export interface MotionExample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly config: MotionOverrideConfig;
  readonly sourcePath: string;
  readonly interactive: boolean;
}

/** A condition blocking a motion preset from stable classification. */
export interface MotionBlockingCondition {
  readonly code: string;
  readonly description: string;
  readonly checkId?: string;
}

/**
 * The complete Registry record for a motion preset artifact. Contains the preset's
 * identity, customization schema, provenance, source files, dependencies, examples,
 * performance records, and reduced-motion contract.
 */
export interface MotionPresetRecord {
  readonly ref: ArtifactRef;
  readonly status: "experimental" | "stable";
  readonly schemaVersion: SemanticVersion;
  readonly customizationSchema: MotionCustomizationSchema;
  readonly framerMotionVersion: string;
  readonly framerMotionProvenance: LicenseProvenance;
  readonly sourceFiles: FileRecord[];
  readonly dependencies: MotionDependencyRef[];
  readonly examples: MotionExample[];
  readonly performanceRecords: PerformanceRecord[];
  readonly reducedMotionContract: ReducedMotionBehavior;
  readonly blockers?: MotionBlockingCondition[];
}
