/**
 * MCP Dispatcher: createMcpDispatcher(provider) with typed dispatch.
 *
 * Validates input COMPLETELY before calling any provider method.
 * Verifies integrity before returning artifact data.
 * Catches provider exceptions as availability errors without leaking stack/secrets.
 * Never returns unverified content.
 */

import type { ArtifactRef, ErrorEnvelope, JsonValue } from "@neuraforge/schemas";
import { computeJsonChecksum } from "@neuraforge/catalog-core";
import {
  validateTokenDocument,
  TOKEN_SCHEMA_VERSION,
  SUPPORTED_TAILWIND_VERSIONS,
  DEFAULT_TOKEN_PUBLICATIONS,
} from "@neuraforge/tokens";
import type { TokenCategory } from "@neuraforge/tokens";
import type { McpCatalogProvider } from "./provider.js";
import type {
  GetComponentOutput,
  GetDesignTokensOutput,
  ListComponentsOutput,
  OperationId,
  OperationOutputMap,
  OperationResult,
  PublicContext,
  SearchComponentsOutput,
} from "./types.js";
import {
  validateListComponentsInput,
  validateGetComponentInput,
  validateSearchComponentsInput,
  validateGetDesignTokensInput,
  validateContext,
} from "./validation.js";
import type { ValidatedListInput, ValidatedSearchInput } from "./validation.js";
import { decodeCursor, encodeCursor, validateListCursor, validateSearchCursor } from "./cursor.js";
import type { ListCursorPayload, SearchCursorPayload } from "./cursor.js";
import { normalizeText, rankComponents, SEARCH_RULE_VERSION } from "./search.js";
import { verifyComponentIntegrity, buildIntegrityError } from "./integrity.js";
import { compareSemanticVersions } from "@neuraforge/catalog-core";

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function availabilityError(operation: string, requestId: string): ErrorEnvelope {
  return {
    error: {
      code: "registry_unavailable",
      category: "availability",
      operation,
      message: "The registry is currently unavailable",
      retryable: true,
      requestId,
    },
  };
}

function notFoundError(
  operation: string,
  requestId: string,
  resource: { kind: string; id?: string; version?: string },
  alternatives: readonly ArtifactRef[],
): ErrorEnvelope {
  return {
    error: {
      code: "not_found",
      category: "not_found",
      operation,
      message: `Requested resource not found`,
      retryable: false,
      resource,
      alternatives: [...alternatives],
      requestId,
    },
  };
}

function cursorError(
  operation: string,
  requestId: string,
  issues: readonly { field: string; message: string }[],
): ErrorEnvelope {
  return {
    error: {
      code: "cursor_tampered",
      category: "validation",
      operation,
      message: "Cursor is malformed or does not match the current request",
      retryable: false,
      fields: issues.map((issue) => ({
        code: "cursor_mismatch",
        path: `/${issue.field}`,
        constraint: issue.message,
        guidance: "Obtain a fresh cursor by requesting without a cursor parameter",
      })),
      requestId,
    },
  };
}

// ---------------------------------------------------------------------------
// list_components implementation
// ---------------------------------------------------------------------------

async function executeListComponents(
  provider: McpCatalogProvider,
  validated: ValidatedListInput,
  context: PublicContext,
): Promise<OperationResult<ListComponentsOutput>> {
  // Decode and validate cursor before reading provider
  if (validated.cursor !== undefined) {
    const decoded = await decodeCursor(validated.cursor);
    if (decoded === null || decoded.type !== "list") {
      return {
        ok: false,
        error: cursorError("list_components", context.requestId, [
          { field: "cursor", message: "Cursor is malformed or tampered" },
        ]),
      };
    }
    const cursorIssues = validateListCursor(
      decoded,
      context.registryVersion,
      validated.category,
      validated.exactVersion,
      validated.pageSize,
    );
    if (cursorIssues.length > 0) {
      return {
        ok: false,
        error: cursorError("list_components", context.requestId, cursorIssues),
      };
    }
  }

  // Summary-only operations cannot recompute artifact checksums because summaries omit source
  // bytes. Fail closed unless the provider verified the immutable snapshot before projection.
  if (!provider.verifiedSnapshot) {
    return {
      ok: false,
      error: buildIntegrityError("list_components", context.requestId, {
        message: "Registry snapshot integrity has not been verified",
      }),
    };
  }

  // Read from provider
  let allComponents;
  try {
    const result = await provider.listComponents(
      context.registryVersion,
      validated.category,
      validated.exactVersion,
    );
    if (!result.ok) {
      return { ok: false, error: availabilityError("list_components", context.requestId) };
    }
    allComponents = result.value;
  } catch {
    return { ok: false, error: availabilityError("list_components", context.requestId) };
  }

  // Deterministic ordering: stableId ascending, then version ascending
  const sorted = [...allComponents].sort((a, b) => {
    if (a.stableId !== b.stableId) return a.stableId < b.stableId ? -1 : 1;
    return compareSemanticVersions(a.version, b.version);
  });

  // Apply cursor boundary (skip entries at or before the cursor position)
  let startIndex = 0;
  if (validated.cursor !== undefined) {
    const decoded = await decodeCursor(validated.cursor);
    if (decoded !== null && decoded.type === "list") {
      const afterStableId = decoded.afterStableId;
      const afterVersion = decoded.afterVersion;
      // Find the first entry after the cursor boundary
      startIndex = sorted.findIndex((entry) => {
        if (entry.stableId > afterStableId) return true;
        if (entry.stableId === afterStableId) {
          return compareSemanticVersions(entry.version, afterVersion) > 0;
        }
        return false;
      });
      if (startIndex === -1) startIndex = sorted.length;
    }
  }

  // Paginate
  const page = sorted.slice(startIndex, startIndex + validated.pageSize);
  const hasMore = startIndex + validated.pageSize < sorted.length;

  // Generate nextCursor if there are more results
  let nextCursor: string | undefined;
  if (hasMore && page.length > 0) {
    const lastEntry = page[page.length - 1];
    if (lastEntry) {
      const cursorPayload: ListCursorPayload = {
        type: "list",
        registryVersion: context.registryVersion,
        category: validated.category ?? null,
        exactVersion: validated.exactVersion ?? null,
        pageSize: validated.pageSize,
        afterStableId: lastEntry.stableId,
        afterVersion: lastEntry.version,
      };
      nextCursor = await encodeCursor(cursorPayload);
    }
  }

  return {
    ok: true,
    value: {
      components: page,
      registryVersion: context.registryVersion,
      totalMatching: sorted.length,
      ...(nextCursor !== undefined ? { nextCursor } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// get_component implementation
// ---------------------------------------------------------------------------

async function executeGetComponent(
  provider: McpCatalogProvider,
  input: { stableId: string; version: string },
  context: PublicContext,
): Promise<OperationResult<GetComponentOutput>> {
  let artifact;
  try {
    const result = await provider.getComponent(
      context.registryVersion,
      input.stableId,
      input.version,
    );
    if (!result.ok) {
      // Try to get alternatives
      let alternatives: readonly ArtifactRef[] = [];
      try {
        const altsResult = await provider.getPublishedComponentRefs(
          context.registryVersion,
          input.stableId,
        );
        if (altsResult.ok) {
          alternatives = altsResult.value;
        }
      } catch {
        // Ignore alt lookup failures
      }
      return {
        ok: false,
        error: notFoundError(
          "get_component",
          context.requestId,
          { kind: "component", id: input.stableId, version: input.version },
          alternatives,
        ),
      };
    }
    artifact = result.value;
  } catch {
    return { ok: false, error: availabilityError("get_component", context.requestId) };
  }

  // Verify integrity BEFORE returning data
  const integrity = await verifyComponentIntegrity(artifact);
  if (!integrity.passed) {
    return {
      ok: false,
      error: buildIntegrityError("get_component", context.requestId, {
        fileFailures: integrity.fileFailures,
        expectedChecksum: integrity.expectedArtifactChecksum,
        observedChecksum: integrity.observedArtifactChecksum,
      }),
    };
  }

  const registryLocation = artifact.registryLocation;

  return {
    ok: true,
    value: {
      stableId: artifact.stableId,
      version: artifact.version,
      name: artifact.name,
      description: artifact.description,
      category: artifact.category,
      tags: artifact.tags,
      sourceFiles: artifact.sourceFiles,
      dependencies: artifact.dependencies,
      compatibility: artifact.compatibility,
      installation: artifact.installation,
      checksum: artifact.checksum,
      registryVersion: context.registryVersion,
      registryLocation,
      provenance: artifact.provenance,
      lineage: {
        stableId: artifact.stableId,
        version: artifact.version,
        checksum: artifact.checksum,
        registryLocation,
      },
      generated: false,
      customized: false,
    },
  };
}

// ---------------------------------------------------------------------------
// search_components implementation
// ---------------------------------------------------------------------------

async function executeSearchComponents(
  provider: McpCatalogProvider,
  validated: ValidatedSearchInput,
  context: PublicContext,
): Promise<OperationResult<SearchComponentsOutput>> {
  const normalizedQuery = normalizeText(validated.query);

  // Decode and validate cursor before reading provider
  if (validated.cursor !== undefined) {
    const decoded = await decodeCursor(validated.cursor);
    if (decoded === null || decoded.type !== "search") {
      return {
        ok: false,
        error: cursorError("search_components", context.requestId, [
          { field: "cursor", message: "Cursor is malformed or tampered" },
        ]),
      };
    }
    const cursorIssues = validateSearchCursor(
      decoded,
      context.registryVersion,
      normalizedQuery,
      validated.category,
      validated.exactVersion,
      validated.pageSize,
    );
    if (cursorIssues.length > 0) {
      return {
        ok: false,
        error: cursorError("search_components", context.requestId, cursorIssues),
      };
    }
  }

  // Summary-only operations cannot recompute artifact checksums because summaries omit source
  // bytes. Fail closed unless the provider verified the immutable snapshot before projection.
  if (!provider.verifiedSnapshot) {
    return {
      ok: false,
      error: buildIntegrityError("search_components", context.requestId, {
        message: "Registry snapshot integrity has not been verified",
      }),
    };
  }

  // Read from provider
  let allComponents;
  try {
    const result = await provider.getComponentsForSearch(
      context.registryVersion,
      validated.category,
      validated.exactVersion,
    );
    if (!result.ok) {
      return { ok: false, error: availabilityError("search_components", context.requestId) };
    }
    allComponents = result.value;
  } catch {
    return { ok: false, error: availabilityError("search_components", context.requestId) };
  }

  // Rank components deterministically
  const ranked = rankComponents(allComponents, normalizedQuery);

  // Apply cursor boundary
  let startIndex = 0;
  if (validated.cursor !== undefined) {
    const decoded = await decodeCursor(validated.cursor);
    if (decoded !== null && decoded.type === "search") {
      const afterScore = decoded.afterScore;
      const afterStableId = decoded.afterStableId;
      const afterVersion = decoded.afterVersion;
      // Find the first entry after the cursor boundary
      startIndex = ranked.findIndex((entry) => {
        if (entry.score < afterScore) return true;
        if (entry.score === afterScore) {
          if (entry.stableId > afterStableId) return true;
          if (entry.stableId === afterStableId) {
            return entry.version > afterVersion;
          }
        }
        return false;
      });
      if (startIndex === -1) startIndex = ranked.length;
    }
  }

  // Paginate
  const page = ranked.slice(startIndex, startIndex + validated.pageSize);
  const hasMore = startIndex + validated.pageSize < ranked.length;

  // Generate nextCursor
  let nextCursor: string | undefined;
  if (hasMore && page.length > 0) {
    const lastEntry = page[page.length - 1];
    if (lastEntry) {
      const cursorPayload: SearchCursorPayload = {
        type: "search",
        registryVersion: context.registryVersion,
        normalizedQuery,
        category: validated.category ?? null,
        exactVersion: validated.exactVersion ?? null,
        pageSize: validated.pageSize,
        afterScore: lastEntry.score,
        afterStableId: lastEntry.stableId,
        afterVersion: lastEntry.version,
      };
      nextCursor = await encodeCursor(cursorPayload);
    }
  }

  return {
    ok: true,
    value: {
      results: page.map((entry) => ({
        stableId: entry.stableId,
        version: entry.version,
        score: entry.score,
        ruleVersion: SEARCH_RULE_VERSION,
        explanations: entry.explanations,
        contributions: entry.contributions,
      })),
      registryVersion: context.registryVersion,
      ruleVersion: SEARCH_RULE_VERSION,
      ...(nextCursor !== undefined ? { nextCursor } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// get_design_tokens implementation
// ---------------------------------------------------------------------------

async function executeGetDesignTokens(
  provider: McpCatalogProvider,
  input: { readonly exactVersion: string; readonly category?: TokenCategory | undefined },
  context: PublicContext,
): Promise<OperationResult<GetDesignTokensOutput>> {
  let tokenArtifact;
  try {
    const result = await provider.getDesignTokens(context.registryVersion, input.exactVersion);
    if (!result.ok) {
      // Get alternatives
      let alternatives: ArtifactRef[] = [];
      try {
        const altsResult = await provider.getPublishedTokenVersions(context.registryVersion);
        if (altsResult.ok) {
          alternatives = altsResult.value.map((v) => ({
            kind: "token-set" as const,
            stableId: "design-tokens",
            version: v,
          }));
        }
      } catch {
        // Ignore
      }
      return {
        ok: false,
        error: notFoundError(
          "get_design_tokens",
          context.requestId,
          { kind: "token-set", id: "design-tokens", version: input.exactVersion },
          alternatives,
        ),
      };
    }
    tokenArtifact = result.value;
  } catch {
    return { ok: false, error: availabilityError("get_design_tokens", context.requestId) };
  }

  // Validate the token document using @neuraforge/tokens
  const validationResult = validateTokenDocument(tokenArtifact.tokenDocument, context.requestId);
  if (!validationResult.ok) {
    return {
      ok: false,
      error: {
        error: {
          code: "token_validation_failed",
          category: "integrity",
          operation: "get_design_tokens",
          message: "Token document failed schema validation",
          retryable: false,
          requestId: context.requestId,
        },
      },
    };
  }

  // Verify the declared canonical JSON checksum
  // Convert TokenDocument to a JsonValue-compatible structure for checksum computation
  const tokenDocAsJson: JsonValue = JSON.parse(
    JSON.stringify(tokenArtifact.tokenDocument),
  ) as JsonValue;
  const computedChecksum = await computeJsonChecksum(tokenDocAsJson);
  if (computedChecksum.digest !== tokenArtifact.checksum.digest) {
    return {
      ok: false,
      error: buildIntegrityError("get_design_tokens", context.requestId, {
        expectedChecksum: tokenArtifact.checksum.digest,
        observedChecksum: computedChecksum.digest,
        message: "Token document checksum mismatch",
      }),
    };
  }

  // Filter by category if requested
  let tokenDocument = tokenArtifact.tokenDocument;
  if (input.category !== undefined) {
    const filteredTokens: Record<string, (typeof tokenDocument.tokens)[string]> = {};
    for (const [name, def] of Object.entries(tokenDocument.tokens)) {
      if (def.category === input.category) {
        filteredTokens[name] = def;
      }
    }
    tokenDocument = { ...tokenDocument, tokens: filteredTokens };
  }

  const registryLocation = tokenArtifact.registryLocation;

  return {
    ok: true,
    value: {
      tokenDocument,
      schemaVersion: TOKEN_SCHEMA_VERSION,
      supportedTailwindVersions: [...SUPPORTED_TAILWIND_VERSIONS],
      publications: {
        schemaVersions: [...DEFAULT_TOKEN_PUBLICATIONS.schemaVersions],
        tokenReleaseVersions: [...DEFAULT_TOKEN_PUBLICATIONS.tokenReleaseVersions],
        tailwindVersions: [...DEFAULT_TOKEN_PUBLICATIONS.tailwindVersions],
      },
      registryVersion: context.registryVersion,
      registryLocation,
      lineage: {
        exactVersion: tokenArtifact.exactVersion,
        checksum: tokenArtifact.checksum,
        registryLocation,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Dispatcher interface
// ---------------------------------------------------------------------------

export interface McpDispatcher {
  dispatch<O extends OperationId>(
    operation: O,
    input: unknown,
    context: unknown,
  ): Promise<OperationResult<OperationOutputMap[O]>>;
}

// ---------------------------------------------------------------------------
// createMcpDispatcher
// ---------------------------------------------------------------------------

export function createMcpDispatcher(provider: McpCatalogProvider): McpDispatcher {
  return {
    async dispatch<O extends OperationId>(
      operation: O,
      input: unknown,
      context: unknown,
    ): Promise<OperationResult<OperationOutputMap[O]>> {
      // Validate context first
      const contextValidation = validateContext(context);
      if (!contextValidation.valid || !contextValidation.context) {
        return {
          ok: false,
          error: {
            error: {
              code: "invalid_context",
              category: "validation",
              operation,
              message: "Invalid public context",
              retryable: false,
              fields: contextValidation.errors,
              requestId: "unknown",
            },
          },
        };
      }
      const ctx = contextValidation.context;

      switch (operation) {
        case "list_components": {
          const validated = validateListComponentsInput(input, ctx.requestId);
          if (!validated.ok) return validated as OperationResult<OperationOutputMap[O]>;
          const result = await executeListComponents(provider, validated.value, ctx);
          return result as OperationResult<OperationOutputMap[O]>;
        }
        case "get_component": {
          const validated = validateGetComponentInput(input, ctx.requestId);
          if (!validated.ok) return validated as OperationResult<OperationOutputMap[O]>;
          const result = await executeGetComponent(provider, validated.value, ctx);
          return result as OperationResult<OperationOutputMap[O]>;
        }
        case "search_components": {
          const validated = validateSearchComponentsInput(input, ctx.requestId);
          if (!validated.ok) return validated as OperationResult<OperationOutputMap[O]>;
          const result = await executeSearchComponents(provider, validated.value, ctx);
          return result as OperationResult<OperationOutputMap[O]>;
        }
        case "get_design_tokens": {
          const validated = validateGetDesignTokensInput(input, ctx.requestId);
          if (!validated.ok) return validated as OperationResult<OperationOutputMap[O]>;
          const result = await executeGetDesignTokens(provider, validated.value, ctx);
          return result as OperationResult<OperationOutputMap[O]>;
        }
        default: {
          return {
            ok: false,
            error: {
              error: {
                code: "unknown_operation",
                category: "validation",
                message: `Unknown operation: ${String(operation)}`,
                retryable: false,
                requestId: ctx.requestId,
              },
            },
          };
        }
      }
    },
  };
}
