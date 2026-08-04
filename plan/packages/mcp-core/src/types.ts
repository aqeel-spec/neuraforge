/**
 * Public types for the MCP operation core.
 *
 * Defines the typed operation map, input/output shapes, PublicContext, and
 * OperationResult used by createMcpDispatcher and the operation registry.
 * No auth/billing/quota/plan/account/subscription types exist here.
 */

import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  FileRecord,
  LicenseProvenance,
  Result,
  SemanticVersion,
} from "@neuraforge/schemas";
import type { TokenCategory, TokenDocument } from "@neuraforge/tokens";

// ---------------------------------------------------------------------------
// Component Category (closed six values)
// ---------------------------------------------------------------------------

export const COMPONENT_CATEGORIES = [
  "navigation",
  "layout",
  "forms",
  "feedback",
  "data-display",
  "marketing",
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Public Context (ONLY registryVersion and requestId)
// ---------------------------------------------------------------------------

export interface PublicContext {
  readonly registryVersion: string;
  readonly requestId: string;
}

// ---------------------------------------------------------------------------
// Operation IDs
// ---------------------------------------------------------------------------

export const OPERATION_IDS = [
  "list_components",
  "get_component",
  "search_components",
  "get_design_tokens",
] as const;

export type OperationId = (typeof OPERATION_IDS)[number];

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ListComponentsInput {
  readonly category?: ComponentCategory | undefined;
  readonly exactVersion?: string | undefined;
  readonly pageSize?: number | undefined;
  readonly cursor?: string | undefined;
}

export interface GetComponentInput {
  readonly stableId: string;
  readonly version: string;
}

export interface SearchComponentsInput {
  readonly query: string;
  readonly category?: ComponentCategory | undefined;
  readonly exactVersion?: string | undefined;
  readonly pageSize?: number | undefined;
  readonly cursor?: string | undefined;
}

export interface GetDesignTokensInput {
  readonly exactVersion: string;
  readonly category?: TokenCategory | undefined;
}

// ---------------------------------------------------------------------------
// Input type map
// ---------------------------------------------------------------------------

export interface OperationInputMap {
  list_components: ListComponentsInput;
  get_component: GetComponentInput;
  search_components: SearchComponentsInput;
  get_design_tokens: GetDesignTokensInput;
}

export type InputOf<O extends OperationId> = OperationInputMap[O];

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export interface ComponentSummary {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: ComponentCategory;
  readonly tags: readonly string[];
  readonly checksum: Checksum;
}

export interface ListComponentsOutput {
  readonly components: readonly ComponentSummary[];
  readonly nextCursor?: string;
  readonly registryVersion: string;
  readonly totalMatching?: number;
}

export interface InstallInstruction {
  readonly step: string;
  readonly command?: string;
}

export interface ComponentLineage {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly checksum: Checksum;
  readonly registryLocation: string;
}

export interface GetComponentOutput {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: ComponentCategory;
  readonly tags: readonly string[];
  readonly sourceFiles: readonly (FileRecord & { readonly content: string })[];
  readonly dependencies: readonly ArtifactRef[];
  readonly compatibility: readonly CompatibilityConstraint[];
  readonly installation: readonly InstallInstruction[];
  readonly checksum: Checksum;
  readonly registryVersion: string;
  readonly registryLocation: string;
  readonly provenance: readonly LicenseProvenance[];
  readonly lineage: ComponentLineage;
  readonly generated: false;
  readonly customized: false;
}

export interface SearchResultEntry {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly score: number;
  readonly ruleVersion: string;
  readonly explanations: readonly string[];
  readonly contributions: readonly { readonly field: string; readonly points: number }[];
}

export interface SearchComponentsOutput {
  readonly results: readonly SearchResultEntry[];
  readonly nextCursor?: string;
  readonly registryVersion: string;
  readonly ruleVersion: string;
}

export interface TokenLineage {
  readonly exactVersion: string;
  readonly checksum: Checksum;
  readonly registryLocation: string;
}

export interface GetDesignTokensOutput {
  readonly tokenDocument: TokenDocument;
  readonly schemaVersion: string;
  readonly supportedTailwindVersions: readonly string[];
  readonly publications: {
    readonly schemaVersions: readonly string[];
    readonly tokenReleaseVersions: readonly string[];
    readonly tailwindVersions: readonly string[];
  };
  readonly registryVersion: string;
  readonly registryLocation: string;
  readonly lineage: TokenLineage;
}

// ---------------------------------------------------------------------------
// Output type map
// ---------------------------------------------------------------------------

export interface OperationOutputMap {
  list_components: ListComponentsOutput;
  get_component: GetComponentOutput;
  search_components: SearchComponentsOutput;
  get_design_tokens: GetDesignTokensOutput;
}

export type OutputOf<O extends OperationId> = OperationOutputMap[O];

// ---------------------------------------------------------------------------
// Operation Result
// ---------------------------------------------------------------------------

export type OperationResult<T> = Result<T>;
