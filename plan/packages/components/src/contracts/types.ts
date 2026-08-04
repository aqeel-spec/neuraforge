import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  FileRecord,
  JsonValue,
  LicenseProvenance,
  PerformanceRecord,
} from "@neuraforge/schemas";

/**
 * Component authoring framework and accessibility contracts.
 *
 * This module defines the shared, closed contract every editable React/Tailwind
 * Component in this package is authored against. It does not validate or retrofit any
 * existing component; Registry-facing validation and projection belong to the metadata
 * validation task. This module only declares the shapes that make a Component metadata
 * record a *total* contract (Property 6): every required field is present, and every
 * behavior is explicitly `supported` or `not_applicable` with a reason. No optional or
 * partial variant of these types exists.
 *
 * Authoring conventions for Original Source under this contract:
 * - One exported component per file, colocated with its category directory
 *   (`navigation-layout`, `forms`, `feedback`, `data-display`, `marketing`).
 * - Styling uses Tailwind utility classes only; no CSS-in-JS or proprietary runtime.
 * - Interactive elements use the shared `focus-visible` ring pattern and expose every
 *   pointer-accessible primary action through keyboard input alone (Requirement 10.2).
 * - A Component's public props are declared as an exported `*Props` interface next to
 *   the component, and mirrored as a `PropDefinition[]` in its `ComponentRecord` so the
 *   Registry and generated docs never drift from the actual typed props.
 *
 * Validates: Requirements 3.1-3.6, 10.1-10.4, 10.7, 10.8.
 */

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** The six closed Component Categories defined by the requirements glossary. */
export type ComponentCategory =
  | "navigation"
  | "layout"
  | "forms"
  | "feedback"
  | "data-display"
  | "marketing";

// ---------------------------------------------------------------------------
// Typed props (Requirement 3.3)
// ---------------------------------------------------------------------------

/** The closed set of prop value shapes a Component prop definition may declare. */
export type PropType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "node"
  | "function"
  | "array"
  | "object";

/**
 * One entry in a Component's public prop table: name, type, required status, default,
 * and allowed values. `allowedValues` is required (non-empty) when `type` is `"enum"`
 * and otherwise must be omitted, so a Registry consumer never sees an enum without its
 * closed value set.
 */
export type PropDefinition =
  | {
      name: string;
      type: Exclude<PropType, "enum">;
      required: boolean;
      description: string;
      defaultValue?: JsonValue;
    }
  | {
      name: string;
      type: "enum";
      required: boolean;
      description: string;
      allowedValues: readonly JsonValue[];
      defaultValue?: JsonValue;
    };

// ---------------------------------------------------------------------------
// Supported states (Requirement 3.4)
// ---------------------------------------------------------------------------

/** A named, documented UI state a Component can render (e.g. "open", "invalid"). */
export interface ComponentState {
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Closed behavior map (Requirement 3.4)
// ---------------------------------------------------------------------------

/** The closed set of behavior dimensions every Component must classify. */
export type BehaviorKey =
  | "keyboard"
  | "pointer"
  | "focus"
  | "disabled"
  | "loading"
  | "validation"
  | "error";

export const BEHAVIOR_KEYS: readonly BehaviorKey[] = [
  "keyboard",
  "pointer",
  "focus",
  "disabled",
  "loading",
  "validation",
  "error",
];

/** A behavior the Component implements, with a human-readable contract description. */
export interface SupportedBehavior {
  status: "supported";
  contract: string;
}

/** A behavior that intentionally does not apply to this Component, with a reason. */
export interface NotApplicableBehavior {
  status: "not_applicable";
  reason: string;
}

export type BehaviorEntry = SupportedBehavior | NotApplicableBehavior;

/**
 * A total map over every `BehaviorKey`. Because every key is required, a Component
 * cannot omit a behavior dimension; it must either document a `supported` contract or an
 * explicit `not_applicable` reason. This is the type-level enforcement of Property 6's
 * "each behavior explicitly supported or not applicable" requirement.
 */
export type BehaviorMap = Readonly<Record<BehaviorKey, BehaviorEntry>>;

// ---------------------------------------------------------------------------
// Accessibility primitive provenance (Requirement 3.5)
// ---------------------------------------------------------------------------

/**
 * Either the Component depends on an external accessibility primitive (an exact-version
 * compatible-license dependency such as a headless UI library) with recorded provenance,
 * or it explicitly uses no external primitive. There is no third, implicit option.
 */
export type AccessibilityPrimitiveDeclaration =
  | {
      usesExternalPrimitive: true;
      primitiveName: string;
      primitiveVersion: string;
      provenance: LicenseProvenance;
    }
  | {
      usesExternalPrimitive: false;
    };

// ---------------------------------------------------------------------------
// Browser capability and functional fallback (Requirement 3.6, 3.8)
// ---------------------------------------------------------------------------

/** A closed set of optional visual/runtime browser capabilities a Component may rely on. */
export type BrowserCapabilityId =
  | "container-queries"
  | "backdrop-filter"
  | "view-transitions"
  | "popover"
  | "dialog-element"
  | "prefers-reduced-motion"
  | "intersection-observer"
  | "resize-observer"
  | "webgl"
  | "webgpu";

/**
 * Detects whether a `BrowserCapabilityId` is available in the current runtime. Must be
 * synchronous, side-effect-free, and safe to call outside a browser environment (an
 * SSR/Node caller must receive `false` rather than throwing).
 */
export type CapabilityDetector = () => boolean;

/** The functional fallback a Component renders when its optional capability is absent. */
export interface FunctionalFallback {
  description: string;
  preservesContent: true;
  preservesPrimaryActions: true;
}

/**
 * Either the Component requires an optional browser capability and declares the exact
 * capability, its detector, and its functional fallback contract, or it explicitly
 * requires no optional browser capability. Requirement 3.6 forbids a third state (an
 * undeclared or partially declared capability dependency).
 */
export type CapabilityFallbackContract =
  | {
      requiresOptionalCapability: true;
      capability: BrowserCapabilityId;
      detection: CapabilityDetector;
      fallback: FunctionalFallback;
    }
  | {
      requiresOptionalCapability: false;
    };

// ---------------------------------------------------------------------------
// Reduced motion equivalence (Requirement 10.7)
// ---------------------------------------------------------------------------

/**
 * Either the Component includes animation/motion and declares the reduced-motion
 * behavior that preserves content, status, and primary actions, or it declares that it
 * includes no animation or motion content.
 */
export type ReducedMotionContract =
  | {
      includesAnimationOrMotion: true;
      reducedMotionBehavior: string;
    }
  | {
      includesAnimationOrMotion: false;
    };

// ---------------------------------------------------------------------------
// Examples (Requirement 3.1, 10.6)
// ---------------------------------------------------------------------------

/** A representative, renderable usage example for documentation and Registry consumers. */
export interface ComponentExample {
  id: string;
  title: string;
  description: string;
  props: Readonly<Record<string, JsonValue>>;
  sourcePath: string;
}

// ---------------------------------------------------------------------------
// Performance budget (design: "performance budget/records")
// ---------------------------------------------------------------------------

/** A published runtime-performance or bundle-size threshold a Component must satisfy. */
export interface PerformanceBudget {
  metric: string;
  threshold: number;
  unit: string;
}

// ---------------------------------------------------------------------------
// Release-record building blocks (design: ArtifactRecord)
// ---------------------------------------------------------------------------

/** An exact-version dependency or peer dependency reference. */
export interface DependencyRef {
  name: string;
  version: string;
  source: string;
}

/** One ordered step of the Component's install instructions. */
export interface InstallInstruction {
  step: number;
  description: string;
  command?: string;
}

/** A documented condition blocking a candidate Component from stable classification. */
export interface BlockingCondition {
  code: string;
  description: string;
  checkId?: string;
}

/**
 * The common Artifact Record fields shared by every Registry-published artifact kind, as
 * defined by the design's data model. `ComponentRecord` extends this with
 * Component-specific fields below.
 */
export interface ArtifactRecordBase {
  ref: ArtifactRef;
  status: "experimental" | "stable";
  sourceFiles: FileRecord[];
  generatedFiles: FileRecord[];
  dependencies: DependencyRef[];
  peerDependencies: DependencyRef[];
  compatibility: CompatibilityConstraint[];
  installation: InstallInstruction[];
  checksum: Checksum;
  provenance: LicenseProvenance[];
  documentationPath: string;
  blockers?: BlockingCondition[];
}

// ---------------------------------------------------------------------------
// Component Record (Requirements 3.2-3.6)
// ---------------------------------------------------------------------------

/**
 * The complete, total Component metadata contract. `ComponentRecord` is what the
 * Registry builder and Quality Gate validate against (task 3.5); this module only
 * declares its shape so authoring and validation never drift from each other.
 */
export interface ComponentRecord extends ArtifactRecordBase {
  category: ComponentCategory;
  props: PropDefinition[];
  supportedStates: ComponentState[];
  behavior: BehaviorMap;
  accessibilityPrimitive: AccessibilityPrimitiveDeclaration;
  capability: CapabilityFallbackContract;
  reducedMotion: ReducedMotionContract;
  examples: ComponentExample[];
  performanceBudgets: PerformanceBudget[];
  performanceRecords: PerformanceRecord[];
}
