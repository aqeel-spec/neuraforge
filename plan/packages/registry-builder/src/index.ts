/**
 * @neuraforge-ui/registry-builder — Deterministic immutable content-addressed release bundle builder.
 *
 * Exposes:
 * - Strict data types for RegistrySnapshot, ReleaseBundle, etc.
 * - buildReleaseBundle(input) — deterministic build with full validation
 * - verifyReleaseBundle(bundle) — recomputes all checksums
 * - classifyReleaseQuality(...) — fail-closed quality classification
 * - validateMvpInventory(...) — MVP component/surface inventory validation
 * - createRegistryBundleReader(bundle) — read-only access to verified bundle
 * - createMcpCatalogProvider(bundle) — adapter for mcp-core's McpCatalogProvider
 */

export const registryBuilderBoundary = {
  id: "registry-builder",
  responsibility: "immutable Registry and release-bundle construction",
  publicSource: true,
} as const;

// Types
export type {
  BuildValidationResult,
  MvpInventoryResult,
  QualityClassification,
  QualityClassificationResult,
  QualityException,
  RegistryArtifactEntry,
  RegistrySnapshot,
  RegistryTokenArtifact,
  ReleaseBuildInput,
  ReleaseBundle,
  RequiredMvpSurface,
  SourceContentLoader,
  SourceFileWithContent,
  VerificationMismatch,
  VerificationResult,
} from "./types.js";

// Builder
export { buildReleaseBundle } from "./builder.js";

// Verification
export { verifyReleaseBundle } from "./verify.js";

// Quality classification
export { classifyReleaseQuality, REQUIRED_CHECK_TYPES } from "./quality.js";
export type { QualityClassificationInput, RequiredCheckType } from "./quality.js";

// MVP inventory validation
export { validateMvpInventory } from "./inventory.js";

// Reader
export { createRegistryBundleReader } from "./reader.js";
export type { ComponentSummaryFromBundle, NotFoundError, RegistryBundleReader } from "./reader.js";

// MCP adapter
export { createMcpCatalogProvider } from "./mcp-adapter.js";

// Content addressing (exported for testing/conformance)
export {
  computeBundleAddress,
  computeBundleChecksum,
  computeSnapshotChecksum,
} from "./content-address.js";

// Closed JSON projection for public adapters
export { toJsonValue } from "./json.js";

// Deep freeze (exported for testing)
export { deepFreeze } from "./freeze.js";

// Advanced artifacts (post-MVP: motion, 3D, compositions)
export {
  countAdvancedArtifacts,
  createEmptyAdvancedSnapshot,
  enforceExperimentalGating,
  validateAdvancedSnapshot,
} from "./advanced-artifacts.js";
export type {
  AdvancedArtifactSnapshot,
  AdvancedValidationResult,
  RegistryCompositionEntry,
  RegistryMotionPresetEntry,
  RegistryThreeDEntry,
} from "./advanced-artifacts.js";
