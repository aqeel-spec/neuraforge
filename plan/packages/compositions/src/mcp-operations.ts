import type { JsonValue } from "@neuraforge-ui/schemas";

import type {
  BrandConfig,
  CompositionCategory,
  CompositionManifest,
  CompositionRequest,
  CustomizationResult,
  SelectionRuleSet,
} from "./types.js";
import type { ArtifactLookup, RetrievalResult } from "./retrieval.js";
import { applyBrandConfig } from "./customization.js";
import { selectCompositions } from "./selection.js";
import { handleCompositionRequest } from "./retrieval.js";

// ---------------------------------------------------------------------------
// Versioned Composition MCP Operations (Task 14.9)
// ---------------------------------------------------------------------------

/**
 * The composition MCP operation registry. All operations are:
 * - Side-effect-free (never writes to caller's filesystem)
 * - Available through public, self-hosted, and hosted surfaces identically
 * - Versioned by registry version and rule set version
 *
 * Requirements: 6.2–6.9, 8.2, 8.10–8.12, 9.2, 9.4
 */
export interface CompositionMcpOperations {
  /** List all published compositions, optionally filtered by category. */
  list_compositions: (input: ListCompositionsInput) => ListCompositionsOutput;
  /** Get a specific composition by exact ref. */
  get_composition: (input: GetCompositionInput) => GetCompositionOutput;
  /** Search and rank compositions by intent and constraints. */
  search_compositions: (input: SearchCompositionsInput) => SearchCompositionsOutput;
  /** Apply a Brand Config to a composition with invariant validation. */
  customize_composition: (input: CustomizeCompositionInput) => CustomizeCompositionOutput;
}

// ---------------------------------------------------------------------------
// Operation Input/Output Types
// ---------------------------------------------------------------------------

export interface ListCompositionsInput {
  readonly category?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListCompositionsOutput {
  readonly compositions: readonly CompositionSummary[];
  readonly total: number;
  readonly registryVersion: string;
}

export interface GetCompositionInput {
  readonly stableId: string;
  readonly version: string;
}

export interface GetCompositionOutput {
  readonly result: RetrievalResult;
  readonly registryVersion: string;
}

export interface SearchCompositionsInput {
  readonly intent: string;
  readonly category?: string;
  readonly constraints?: readonly { field: string; operator: string; value: JsonValue }[];
  readonly limit?: number;
}

export interface SearchCompositionsOutput {
  readonly results: readonly CompositionSearchResult[];
  readonly ruleSetVersion: string;
  readonly registryVersion: string;
  readonly explanation: string;
}

export interface CustomizeCompositionInput {
  readonly stableId: string;
  readonly version: string;
  readonly brandConfig: Readonly<Record<string, JsonValue>>;
}

export interface CustomizeCompositionOutput {
  readonly result: CustomizationResult;
  readonly registryVersion: string;
}

// ---------------------------------------------------------------------------
// Projected Types for MCP Responses
// ---------------------------------------------------------------------------

/** Summary for list operations. */
export interface CompositionSummary {
  readonly stableId: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly inputCount: number;
  readonly invariantCount: number;
  readonly artifactCount: number;
}

/** Search result entry. */
export interface CompositionSearchResult {
  readonly stableId: string;
  readonly version: string;
  readonly name: string;
  readonly category: string;
  readonly score: number;
  readonly explanation: string;
}

// ---------------------------------------------------------------------------
// MCP Operation Dispatcher
// ---------------------------------------------------------------------------

/**
 * Context required to dispatch composition MCP operations. Provides access to
 * the composition registry and rules without coupling to a specific storage backend.
 */
export interface CompositionMcpContext {
  readonly manifests: readonly CompositionManifest[];
  readonly rules: SelectionRuleSet;
  readonly registryVersion: string;
  readonly lookup: ArtifactLookup;
}

/**
 * Creates a composition MCP operation dispatcher from a given context.
 * All operations are pure and deterministic.
 */
export function createCompositionMcpDispatcher(
  ctx: CompositionMcpContext,
): CompositionMcpOperations {
  return {
    list_compositions: (input) => dispatchList(ctx, input),
    get_composition: (input) => dispatchGet(ctx, input),
    search_compositions: (input) => dispatchSearch(ctx, input),
    customize_composition: (input) => dispatchCustomize(ctx, input),
  };
}

// ---------------------------------------------------------------------------
// Operation Implementations
// ---------------------------------------------------------------------------

function dispatchList(
  ctx: CompositionMcpContext,
  input: ListCompositionsInput,
): ListCompositionsOutput {
  let filtered = ctx.manifests;

  if (input.category) {
    filtered = filtered.filter((m) => m.category === input.category);
  }

  const offset = input.offset ?? 0;
  const limit = input.limit ?? 20;
  const page = filtered.slice(offset, offset + limit);

  return {
    compositions: page.map(toSummary),
    total: filtered.length,
    registryVersion: ctx.registryVersion,
  };
}

function dispatchGet(ctx: CompositionMcpContext, input: GetCompositionInput): GetCompositionOutput {
  const manifest = ctx.manifests.find(
    (m) => m.ref.stableId === input.stableId && m.ref.version === input.version,
  );

  if (!manifest) {
    return {
      result: {
        type: "no-match",
        noMatch: {
          failedConstraints: [
            {
              constraintId: "not-found",
              description: `Composition ${input.stableId}@${input.version} not found`,
              reason: "No composition with this stableId and version exists",
            },
          ],
          alternatives: [],
        },
      },
      registryVersion: ctx.registryVersion,
    };
  }

  return {
    result: handleCompositionRequest(
      { intent: "", constraints: [], limit: 1 },
      [manifest],
      ctx.rules,
      ctx.registryVersion,
      ctx.lookup,
    ),
    registryVersion: ctx.registryVersion,
  };
}

function dispatchSearch(
  ctx: CompositionMcpContext,
  input: SearchCompositionsInput,
): SearchCompositionsOutput {
  const baseRequest = {
    intent: input.intent,
    constraints: (input.constraints ?? []).map((c) => ({
      field: c.field,
      operator: c.operator as "equals" | "contains" | "in" | "gte" | "lte",
      value: c.value,
    })),
    limit: input.limit ?? 10,
  };

  const cat = input.category;
  const request: CompositionRequest =
    cat !== undefined ? { ...baseRequest, category: cat as CompositionCategory } : baseRequest;

  const selection = selectCompositions(request, ctx.manifests, ctx.rules, ctx.registryVersion);

  return {
    results: selection.results.map((r) => {
      const manifest = ctx.manifests.find(
        (m) => m.ref.stableId === r.ref.stableId && m.ref.version === r.ref.version,
      );
      return {
        stableId: r.ref.stableId,
        version: r.ref.version,
        name: manifest?.name ?? r.ref.stableId,
        category: manifest?.category ?? "unknown",
        score: r.score,
        explanation: r.explanation,
      };
    }),
    ruleSetVersion: ctx.rules.version,
    registryVersion: ctx.registryVersion,
    explanation:
      selection.results.length > 0
        ? `Found ${selection.results.length} composition(s) matching intent "${input.intent}"`
        : `No compositions match intent "${input.intent}" with the given constraints`,
  };
}

function dispatchCustomize(
  ctx: CompositionMcpContext,
  input: CustomizeCompositionInput,
): CustomizeCompositionOutput {
  const manifest = ctx.manifests.find(
    (m) => m.ref.stableId === input.stableId && m.ref.version === input.version,
  );

  if (!manifest) {
    return {
      result: {
        valid: false,
        compositionRef: { kind: "composition", stableId: input.stableId, version: input.version },
        appliedValues: {},
        invariantViolations: [
          {
            invariantId: "not-found",
            invariantType: "semantic-hierarchy",
            description: `Composition ${input.stableId}@${input.version} not found`,
            violatedBy: "ref",
          },
        ],
        undeclaredFields: [],
      },
      registryVersion: ctx.registryVersion,
    };
  }

  const brandConfig: BrandConfig = { values: input.brandConfig };
  const result = applyBrandConfig(manifest, brandConfig);

  return {
    result,
    registryVersion: ctx.registryVersion,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSummary(manifest: CompositionManifest): CompositionSummary {
  return {
    stableId: manifest.ref.stableId,
    version: manifest.ref.version,
    name: manifest.name,
    description: manifest.description,
    category: manifest.category,
    tags: manifest.tags,
    inputCount: manifest.customizationInputs.length,
    invariantCount: manifest.invariants.length,
    artifactCount: manifest.artifactRefs.length,
  };
}
