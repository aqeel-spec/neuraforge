/**
 * Versioned, immutable operation registry for the MCP core.
 *
 * Schema version 1.0.0. Contains complete contracts for all four MVP operations:
 * - list_components
 * - get_component
 * - search_components
 * - get_design_tokens
 *
 * Each contract includes: operation id, version, description, closed JSON input schema,
 * closed JSON output schema, validation rules text, documented error codes,
 * pagination fields, and valid input/output examples.
 *
 * The registry is immutable and deterministic; no duplicate IDs.
 */

import type { JsonValue } from "@neuraforge/schemas";
import { SEARCH_RULE_VERSION } from "./search.js";

export const MCP_SCHEMA_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Contract type
// ---------------------------------------------------------------------------

export interface OperationContract {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly inputSchema: JsonValue;
  readonly outputSchema: JsonValue;
  readonly validationRules: readonly string[];
  readonly errorCodes: readonly string[];
  readonly pagination: {
    readonly supported: boolean;
    readonly cursorField?: string;
    readonly pageSizeField?: string;
    readonly defaultPageSize?: number;
    readonly maxPageSize?: number;
  };
  readonly examples: {
    readonly validInput: JsonValue;
    readonly validOutput: JsonValue;
  };
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

const listComponentsContract: OperationContract = {
  id: "list_components",
  version: MCP_SCHEMA_VERSION,
  description:
    "Enumerate published components, filterable by category and exact version, with deterministic pagination.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      category: {
        type: "string",
        enum: ["navigation", "layout", "forms", "feedback", "data-display", "marketing"],
      },
      exactVersion: { type: "string", pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$" },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      cursor: { type: "string", minLength: 1 },
    },
  },
  outputSchema: {
    type: "object",
    required: ["components", "registryVersion"],
    properties: {
      components: {
        type: "array",
        items: {
          type: "object",
          required: ["stableId", "version", "name", "description", "category", "tags", "checksum"],
        },
      },
      nextCursor: { type: "string" },
      registryVersion: { type: "string" },
      totalMatching: { type: "integer" },
    },
  },
  validationRules: [
    "Unknown fields are rejected (closed schema).",
    "category must be one of six closed values.",
    "exactVersion must be an exact Semantic Version; no ranges or latest.",
    "pageSize must be an integer between 1 and 100 (default 20).",
    "cursor must be a non-empty string from a previous response.",
    "Cursor must match the current registryVersion, filters, and pageSize.",
    "Tampered or malformed cursor is rejected without provider reads.",
  ],
  errorCodes: [
    "input_validation_failed",
    "cursor_tampered",
    "cursor_filter_mismatch",
    "cursor_registry_version_mismatch",
    "registry_unavailable",
  ],
  pagination: {
    supported: true,
    cursorField: "cursor",
    pageSizeField: "pageSize",
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  examples: {
    validInput: { category: "forms", pageSize: 10 },
    validOutput: {
      components: [
        {
          stableId: "input-field",
          version: "1.0.0",
          name: "Input Field",
          description: "A styled text input component",
          category: "forms",
          tags: ["input", "form"],
          checksum: {
            algorithm: "sha256",
            canonicalization: "neuraforge-canonical-v1",
            digest: "abc123def456",
          },
        },
      ],
      registryVersion: "1.0.0",
    },
  },
};

const getComponentContract: OperationContract = {
  id: "get_component",
  version: MCP_SCHEMA_VERSION,
  description:
    "Retrieve a released component by stable identifier and exact version, including original source, metadata, dependencies, and integrity lineage.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["stableId", "version"],
    properties: {
      stableId: { type: "string", minLength: 1 },
      version: { type: "string", pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$" },
    },
  },
  outputSchema: {
    type: "object",
    required: [
      "stableId",
      "version",
      "name",
      "description",
      "category",
      "tags",
      "sourceFiles",
      "dependencies",
      "compatibility",
      "installation",
      "checksum",
      "registryVersion",
      "registryLocation",
      "provenance",
      "lineage",
      "generated",
      "customized",
    ],
  },
  validationRules: [
    "Unknown fields are rejected (closed schema).",
    "stableId is required and must be a non-empty string.",
    "version is required and must be an exact Semantic Version; no ranges or latest.",
  ],
  errorCodes: ["input_validation_failed", "not_found", "integrity_failed", "registry_unavailable"],
  pagination: { supported: false },
  examples: {
    validInput: { stableId: "button", version: "1.0.0" },
    validOutput: {
      stableId: "button",
      version: "1.0.0",
      name: "Button",
      description: "A primary action button",
      category: "forms",
      tags: ["button", "action"],
      sourceFiles: [],
      dependencies: [],
      compatibility: [],
      installation: [{ step: "Install dependency", command: "npm install" }],
      checksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "abc123",
      },
      registryVersion: "1.0.0",
      registryLocation: "/registry/1.0.0/artifacts/component/button/1.0.0",
      provenance: [],
      lineage: {
        stableId: "button",
        version: "1.0.0",
        checksum: {
          algorithm: "sha256",
          canonicalization: "neuraforge-canonical-v1",
          digest: "abc123",
        },
        registryLocation: "/registry/1.0.0/artifacts/component/button/1.0.0",
      },
      generated: false,
      customized: false,
    },
  },
};

const searchComponentsContract: OperationContract = {
  id: "search_components",
  version: MCP_SCHEMA_VERSION,
  description:
    "Rank components by intent using published deterministic Selection Rules, with scores, explanations, and pagination.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string", minLength: 1, maxLength: 500 },
      category: {
        type: "string",
        enum: ["navigation", "layout", "forms", "feedback", "data-display", "marketing"],
      },
      exactVersion: { type: "string", pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$" },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
      cursor: { type: "string", minLength: 1 },
    },
  },
  outputSchema: {
    type: "object",
    required: ["results", "registryVersion", "ruleVersion"],
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          required: [
            "stableId",
            "version",
            "score",
            "ruleVersion",
            "explanations",
            "contributions",
          ],
        },
      },
      nextCursor: { type: "string" },
      registryVersion: { type: "string" },
      ruleVersion: { type: "string" },
    },
  },
  validationRules: [
    "Unknown fields are rejected (closed schema).",
    "query is required, must be non-blank, max 500 characters.",
    "category must be one of six closed values when present.",
    "exactVersion must be an exact Semantic Version when present.",
    "pageSize must be an integer between 1 and 100 (default 20).",
    "cursor must bind normalized query, filters, registryVersion, and pageSize.",
    "Tampered or mismatched cursor is rejected without provider reads.",
  ],
  errorCodes: [
    "input_validation_failed",
    "cursor_tampered",
    "cursor_filter_mismatch",
    "cursor_registry_version_mismatch",
    "registry_unavailable",
  ],
  pagination: {
    supported: true,
    cursorField: "cursor",
    pageSizeField: "pageSize",
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  examples: {
    validInput: { query: "pricing tiers", category: "marketing" },
    validOutput: {
      results: [
        {
          stableId: "pricing-table",
          version: "1.0.0",
          score: 125,
          ruleVersion: SEARCH_RULE_VERSION,
          explanations: ["Exact name match: 'Pricing Table'", "Tag match: 'pricing'"],
          contributions: [
            { field: "name", points: 80 },
            { field: "tags", points: 25 },
            { field: "category", points: 20 },
          ],
        },
      ],
      registryVersion: "1.0.0",
      ruleVersion: SEARCH_RULE_VERSION,
    },
  },
};

const getDesignTokensContract: OperationContract = {
  id: "get_design_tokens",
  version: MCP_SCHEMA_VERSION,
  description:
    "Retrieve a published Design Token document by exact release version, with schema version, supported Tailwind versions, and integrity lineage.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["exactVersion"],
    properties: {
      exactVersion: { type: "string", pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$" },
      category: {
        type: "string",
        enum: [
          "color",
          "typography",
          "spacing",
          "sizing",
          "elevation",
          "border",
          "breakpoint",
          "motion",
        ],
      },
    },
  },
  outputSchema: {
    type: "object",
    required: [
      "tokenDocument",
      "schemaVersion",
      "supportedTailwindVersions",
      "publications",
      "registryVersion",
      "registryLocation",
      "lineage",
    ],
  },
  validationRules: [
    "Unknown fields are rejected (closed schema).",
    "exactVersion is required and must be an exact Semantic Version token release.",
    "category is optional; must be a valid token category when present.",
  ],
  errorCodes: [
    "input_validation_failed",
    "not_found",
    "integrity_failed",
    "token_validation_failed",
    "registry_unavailable",
  ],
  pagination: { supported: false },
  examples: {
    validInput: { exactVersion: "1.0.0" },
    validOutput: {
      tokenDocument: {
        schemaVersion: "1.0.0",
        releaseVersion: "1.0.0",
        ordering: "declaration",
        tokens: {
          "color.brand.primary": {
            category: "color",
            type: "color",
            value: "#6366f1",
          },
        },
      },
      schemaVersion: "1.0.0",
      supportedTailwindVersions: ["3.4.17"],
      publications: {
        schemaVersions: ["1.0.0"],
        tokenReleaseVersions: ["1.0.0"],
        tailwindVersions: ["3.4.17"],
      },
      registryVersion: "1.0.0",
      registryLocation: "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
      lineage: {
        exactVersion: "1.0.0",
        checksum: {
          algorithm: "sha256",
          canonicalization: "neuraforge-canonical-v1",
          digest: "def456",
        },
        registryLocation: "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// The immutable, deterministic registry
// ---------------------------------------------------------------------------

const contracts: readonly OperationContract[] = Object.freeze([
  listComponentsContract,
  getComponentContract,
  searchComponentsContract,
  getDesignTokensContract,
]);

export interface OperationRegistry {
  readonly schemaVersion: string;
  readonly operations: readonly OperationContract[];
  getContract(operationId: string): OperationContract | undefined;
}

/** Creates the immutable operation registry. No duplicate IDs. Deterministic order. */
function createRegistry(): OperationRegistry {
  const map = new Map<string, OperationContract>();
  for (const contract of contracts) {
    if (map.has(contract.id)) {
      throw new Error(`Duplicate operation ID in registry: ${contract.id}`);
    }
    map.set(contract.id, contract);
  }
  return Object.freeze({
    schemaVersion: MCP_SCHEMA_VERSION,
    operations: contracts,
    getContract(operationId: string): OperationContract | undefined {
      return map.get(operationId);
    },
  });
}

export const OPERATION_REGISTRY: OperationRegistry = createRegistry();
