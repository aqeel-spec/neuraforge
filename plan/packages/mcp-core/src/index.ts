/**
 * @neuraforge-ui/mcp-core — Public, side-effect-free MCP operation registry and dispatcher.
 *
 * Exposes:
 * - Typed operation maps (OperationId, InputOf, OutputOf, PublicContext, OperationResult)
 * - Versioned operation registry (schema version 1.0.0)
 * - Read-only McpCatalogProvider interface
 * - createMcpDispatcher factory
 * - Deterministic search scoring (SEARCH_RULE_VERSION)
 *
 * Does NOT import hosted-gateway, auth, billing, quota, or filesystem write APIs.
 */

export const mcpCoreBoundary = {
  id: "mcp-core",
  responsibility: "public side-effect-free MCP operation dispatch",
  publicSource: true,
} as const;

// Types
export type {
  ComponentCategory,
  ComponentLineage,
  ComponentSummary,
  GetComponentInput,
  GetComponentOutput,
  GetDesignTokensInput,
  GetDesignTokensOutput,
  InputOf,
  InstallInstruction,
  ListComponentsInput,
  ListComponentsOutput,
  OperationId,
  OperationOutputMap,
  OperationResult,
  OutputOf,
  PublicContext,
  SearchComponentsInput,
  SearchComponentsOutput,
  SearchResultEntry,
  TokenLineage,
} from "./types.js";

export { COMPONENT_CATEGORIES, OPERATION_IDS } from "./types.js";

// Provider interface
export type {
  ComponentArtifact,
  ComponentSourceFile,
  McpCatalogProvider,
  ProviderError,
  SnapshotIntegrityContract,
  TokenArtifact,
} from "./provider.js";

// Operation registry
export type { OperationContract, OperationRegistry } from "./registry.js";
export { MCP_SCHEMA_VERSION, OPERATION_REGISTRY } from "./registry.js";

// Dispatcher
export type { McpDispatcher } from "./dispatcher.js";
export { createMcpDispatcher } from "./dispatcher.js";

// Search
export { SEARCH_RULE_VERSION, normalizeText } from "./search.js";

// Validation (exported for testing/conformance)
export {
  validateContext,
  validateGetComponentInput,
  validateGetDesignTokensInput,
  validateListComponentsInput,
  validateSearchComponentsInput,
  isValidOperationId,
} from "./validation.js";

// Cursor (exported for testing/conformance)
export { encodeCursor, decodeCursor } from "./cursor.js";
export type { ListCursorPayload, SearchCursorPayload, CursorPayload } from "./cursor.js";

// Integrity (exported for testing)
export {
  verifyComponentIntegrity,
  verifyFileChecksum,
  verifyArtifactChecksum,
  buildIntegrityError,
} from "./integrity.js";
