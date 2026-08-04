/**
 * Read-only provider interface for the MCP operation core.
 *
 * Registry-builder and self-hosting implement McpCatalogProvider; tests use an
 * in-memory fixture provider. All methods are async and read-only — no mutating
 * operations. The provider returns fixed, immutable Registry snapshot data.
 */

import type {
  ArtifactRef,
  Checksum,
  CompatibilityConstraint,
  FileRecord,
  LicenseProvenance,
  Result,
  SemanticVersion,
} from "@neuraforge-ui/schemas";
import type { TokenDocument } from "@neuraforge-ui/tokens";
import type { ComponentCategory, ComponentSummary, InstallInstruction } from "./types.js";

// ---------------------------------------------------------------------------
// Component artifact data (what the provider returns for get_component)
// ---------------------------------------------------------------------------

export interface ComponentSourceFile extends FileRecord {
  /** The actual source file text content. */
  readonly content: string;
}

export interface ComponentArtifact {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: ComponentCategory;
  readonly tags: readonly string[];
  readonly sourceFiles: readonly ComponentSourceFile[];
  readonly dependencies: readonly ArtifactRef[];
  readonly compatibility: readonly CompatibilityConstraint[];
  readonly installation: readonly InstallInstruction[];
  readonly checksum: Checksum;
  readonly provenance: readonly LicenseProvenance[];
  readonly registryLocation: string;
}

// ---------------------------------------------------------------------------
// Token artifact data (what the provider returns for get_design_tokens)
// ---------------------------------------------------------------------------

export interface TokenArtifact {
  readonly exactVersion: string;
  readonly tokenDocument: TokenDocument;
  readonly checksum: Checksum;
  readonly registryLocation: string;
}

// ---------------------------------------------------------------------------
// Provider errors
// ---------------------------------------------------------------------------

export interface ProviderError {
  readonly code: string;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Verified snapshot contract
// ---------------------------------------------------------------------------

/**
 * Indicates the provider guarantees snapshot-level integrity verification.
 * When verifiedSnapshot is true, list/search may trust summaries without
 * re-verifying individual file checksums (the provider already did so).
 * When false or absent, mcp-core must verify integrity before returning data.
 */
export interface SnapshotIntegrityContract {
  readonly verifiedSnapshot: boolean;
}

// ---------------------------------------------------------------------------
// McpCatalogProvider — the dependency-injection seam
// ---------------------------------------------------------------------------

export interface McpCatalogProvider extends SnapshotIntegrityContract {
  /**
   * Returns component summaries matching optional filters.
   * Provider must return ALL matching summaries in a stable deterministic order.
   * Pagination is handled by the dispatcher, not the provider.
   */
  listComponents(
    registryVersion: string,
    category?: ComponentCategory,
    exactVersion?: string,
  ): Promise<Result<readonly ComponentSummary[], ProviderError>>;

  /**
   * Retrieves the full component artifact for an exact stableId + version.
   * Returns the artifact with source file contents if found, or a provider error.
   */
  getComponent(
    registryVersion: string,
    stableId: string,
    version: string,
  ): Promise<Result<ComponentArtifact, ProviderError>>;

  /**
   * Returns all component summaries for search ranking.
   * The dispatcher handles scoring, ordering, and pagination.
   */
  getComponentsForSearch(
    registryVersion: string,
    category?: ComponentCategory,
    exactVersion?: string,
  ): Promise<Result<readonly ComponentSummary[], ProviderError>>;

  /**
   * Retrieves the token artifact for an exact release version.
   * Returns the full token document if found, or a provider error.
   */
  getDesignTokens(
    registryVersion: string,
    exactVersion: string,
  ): Promise<Result<TokenArtifact, ProviderError>>;

  /**
   * Returns the list of published token release versions (for not_found alternatives).
   */
  getPublishedTokenVersions(
    registryVersion: string,
  ): Promise<Result<readonly string[], ProviderError>>;

  /**
   * Returns the list of all published component refs (for not_found alternatives).
   */
  getPublishedComponentRefs(
    registryVersion: string,
    stableId: string,
  ): Promise<Result<readonly ArtifactRef[], ProviderError>>;
}
