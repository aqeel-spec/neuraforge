import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  FileRecord,
  JsonValue,
  LicenseProvenance,
  SemanticVersion,
} from "@neuraforge-ui/schemas";

// ---------------------------------------------------------------------------
// Composition Manifest (Requirement 6.1, 6.8–6.10)
// ---------------------------------------------------------------------------

/**
 * A curated composition assembles known project artifacts into a coherent section
 * or page. The manifest declares exact artifact versions, source files, dependencies,
 * compatibility constraints, customization inputs, and typed branding invariants.
 *
 * Requirements: 6.1, 6.8, 6.10
 */
export interface CompositionManifest {
  /** Unique composition identity and version. */
  readonly ref: ArtifactRef;
  /** Human-readable name for the composition. */
  readonly name: string;
  /** Description of what the composition renders. */
  readonly description: string;
  /** Composition category (e.g., "hero", "pricing", "features", "faq", "footer"). */
  readonly category: CompositionCategory;
  /** Tags for search relevance. */
  readonly tags: readonly string[];
  /** Exact artifact references this composition depends on. */
  readonly artifactRefs: readonly ArtifactRef[];
  /** Source files that make up the composition template. */
  readonly sourceFiles: readonly FileRecord[];
  /** Exact dependency versions. */
  readonly dependencies: readonly CompositionDependency[];
  /** Compatibility constraints. */
  readonly compatibility: readonly CompatibilityConstraint[];
  /** Schema version for this manifest. */
  readonly schemaVersion: SemanticVersion;
  /** Declared customization inputs consumers may edit. */
  readonly customizationInputs: readonly CustomizationInput[];
  /** Typed branding invariants that must be preserved under customization. */
  readonly invariants: readonly BrandingInvariant[];
  /** Integrity checksum over the canonical composition source. */
  readonly checksum: Checksum;
  /** License provenance for the composition. */
  readonly provenance: readonly LicenseProvenance[];
  /** Installation instructions for the composition. */
  readonly installInstructions: readonly CompositionInstallStep[];
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Closed set of composition categories. */
export type CompositionCategory =
  | "hero"
  | "pricing"
  | "features"
  | "testimonials"
  | "faq"
  | "cta"
  | "footer"
  | "header"
  | "stats"
  | "contact"
  | "blog"
  | "team"
  | "page";

/** Runtime-accessible array. */
export const COMPOSITION_CATEGORIES: readonly CompositionCategory[] = [
  "hero",
  "pricing",
  "features",
  "testimonials",
  "faq",
  "cta",
  "footer",
  "header",
  "stats",
  "contact",
  "blog",
  "team",
  "page",
] as const;

// ---------------------------------------------------------------------------
// Dependencies & Install
// ---------------------------------------------------------------------------

/** An exact-version dependency for a composition. */
export interface CompositionDependency {
  readonly name: string;
  readonly version: string;
  readonly source: string;
}

/** One step of composition installation. */
export interface CompositionInstallStep {
  readonly step: number;
  readonly description: string;
  readonly command?: string;
}

// ---------------------------------------------------------------------------
// Customization Inputs (Requirement 6.7)
// ---------------------------------------------------------------------------

/**
 * A declared customization input that a Brand Config may edit.
 * Only these declared inputs are allowed — undeclared fields are rejected.
 */
export interface CustomizationInput {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly type: "string" | "number" | "boolean" | "color" | "enum" | "image-url" | "rich-text";
  readonly default: JsonValue;
  readonly required: boolean;
  readonly allowedValues?: readonly JsonValue[];
  readonly group: string;
}

// ---------------------------------------------------------------------------
// Branding Invariants (Requirement 6.7)
// ---------------------------------------------------------------------------

/**
 * The closed set of invariant types that a composition may declare.
 * Each invariant constrains how customization can modify the output.
 */
export type InvariantType =
  | "semantic-hierarchy"
  | "responsive-behavior"
  | "accessibility-behavior"
  | "required-relationship";

/** Runtime-accessible array. */
export const INVARIANT_TYPES: readonly InvariantType[] = [
  "semantic-hierarchy",
  "responsive-behavior",
  "accessibility-behavior",
  "required-relationship",
] as const;

/**
 * A typed branding invariant that must be preserved when the composition is
 * customized with a Brand Config. The invariant declares its type, the elements
 * it constrains, and a machine-readable rule.
 */
export interface BrandingInvariant {
  readonly id: string;
  readonly type: InvariantType;
  readonly description: string;
  /** The element IDs within the composition that this invariant constrains. */
  readonly constrainedElements: readonly string[];
  /** Machine-readable rule expression. */
  readonly rule: JsonValue;
}

// ---------------------------------------------------------------------------
// Selection Rules (Requirement 6.2, 6.3, 6.8)
// ---------------------------------------------------------------------------

/**
 * A versioned set of deterministic rules for filtering, scoring, and selecting
 * compositions based on intent and constraints. Published publicly so agents can
 * understand why a particular composition was (or wasn't) selected.
 */
export interface SelectionRuleSet {
  readonly version: SemanticVersion;
  /** Normalization steps applied to intent/constraints before matching. */
  readonly normalization: readonly NormalizationStep[];
  /** Eligibility filters that compositions must pass to be candidates. */
  readonly eligibilityFilters: readonly EligibilityFilter[];
  /** Score dimensions with directions and weights. */
  readonly scoreDimensions: readonly ScoreDimension[];
  /** How missing evidence is treated. */
  readonly missingEvidenceValue: number;
  /** Tie-breaking rule: always use stable ID for determinism. */
  readonly tieBreakBy: "stable-id";
  /** How explanations are constructed. */
  readonly explanationTemplate: string;
}

/** A normalization step applied to search intent/constraints. */
export interface NormalizationStep {
  readonly id: string;
  readonly description: string;
  readonly operation: "lowercase" | "trim" | "stem" | "remove-stop-words" | "synonym-expand";
}

/** An eligibility filter that compositions must satisfy. */
export interface EligibilityFilter {
  readonly id: string;
  readonly field: string;
  readonly operator: "equals" | "contains" | "in" | "gte" | "lte" | "exists";
  readonly value: JsonValue;
}

/** A scored dimension with direction and weight. */
export interface ScoreDimension {
  readonly id: string;
  readonly description: string;
  /** Higher or lower is better. */
  readonly direction: "maximize" | "minimize";
  /** Weight multiplier for this dimension's contribution to total score. */
  readonly weight: number;
  /** How to compute the raw score for this dimension. */
  readonly computation:
    | "tag-overlap"
    | "category-match"
    | "recency"
    | "quality-score"
    | "usage-evidence";
}

// ---------------------------------------------------------------------------
// Selection Result (Requirement 6.2, 6.3)
// ---------------------------------------------------------------------------

/**
 * The result of a deterministic composition selection. Contains the registry/rule
 * versions, ordered results with scores and explanations, and any failed constraints.
 */
export interface CompositionSelectionResult {
  /** The exact registry version used for this selection. */
  readonly registryVersion: SemanticVersion;
  /** The exact rule set version used. */
  readonly ruleSetVersion: SemanticVersion;
  /** Ordered composition results (highest score first, tie-broken by stable ID). */
  readonly results: readonly ScoredComposition[];
  /** Constraints that could not be satisfied (for no-match reporting). */
  readonly failedConstraints: readonly FailedConstraint[];
  /** Ranked alternatives when no exact match found. */
  readonly alternatives: readonly ArtifactRef[];
}

/** A scored composition in a selection result. */
export interface ScoredComposition {
  readonly ref: ArtifactRef;
  readonly score: number;
  readonly dimensionScores: Readonly<Record<string, number>>;
  readonly explanation: string;
}

/** A constraint that could not be satisfied during selection. */
export interface FailedConstraint {
  readonly constraintId: string;
  readonly description: string;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Composition Request (for MCP operations)
// ---------------------------------------------------------------------------

/** A composition search/selection request from an AI agent. */
export interface CompositionRequest {
  /** Natural language intent description. */
  readonly intent: string;
  /** Explicit constraints the result must satisfy. */
  readonly constraints: readonly RequestConstraint[];
  /** Preferred category (optional). */
  readonly category?: CompositionCategory;
  /** Maximum results to return. */
  readonly limit: number;
}

/** An explicit constraint on composition selection. */
export interface RequestConstraint {
  readonly field: string;
  readonly operator: "equals" | "contains" | "in" | "gte" | "lte";
  readonly value: JsonValue;
}

// ---------------------------------------------------------------------------
// Brand Config for Customization
// ---------------------------------------------------------------------------

/** A Brand Config applied to a composition for customization. */
export interface BrandConfig {
  /** Values for the declared customization inputs. */
  readonly values: Readonly<Record<string, JsonValue>>;
}

/** Result of applying a Brand Config to a composition. */
export interface CustomizationResult {
  readonly valid: boolean;
  readonly compositionRef: ArtifactRef;
  readonly appliedValues: Readonly<Record<string, JsonValue>>;
  readonly invariantViolations: readonly InvariantViolation[];
  readonly undeclaredFields: readonly string[];
}

/** A violation of a declared branding invariant. */
export interface InvariantViolation {
  readonly invariantId: string;
  readonly invariantType: InvariantType;
  readonly description: string;
  readonly violatedBy: string;
}

// ---------------------------------------------------------------------------
// Partial Result & No-Match (Requirements 6.4, 6.5, 6.6)
// ---------------------------------------------------------------------------

/** Result when some composition elements are available but others are not. */
export interface PartialResult {
  readonly compositionRef: ArtifactRef;
  readonly availableElements: readonly AvailableElement[];
  readonly unavailableElements: readonly UnavailableElement[];
}

/** An element that is available in the composition. */
export interface AvailableElement {
  readonly artifactRef: ArtifactRef;
  readonly sourceFiles: readonly FileRecord[];
  readonly checksum: Checksum;
}

/** An element that is not available, with reason and alternatives. */
export interface UnavailableElement {
  readonly artifactRef: ArtifactRef;
  readonly reason: string;
  readonly alternatives: readonly ArtifactRef[];
}

/** Result when no composition satisfies all constraints. */
export interface NoMatchResult {
  readonly failedConstraints: readonly FailedConstraint[];
  readonly alternatives: readonly ScoredComposition[];
}
