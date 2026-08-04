/**
 * Input validation for all four MCP operations.
 *
 * Validates COMPLETELY before any provider method is called.
 * Unknown fields are rejected for all operations (closed schemas).
 * Uses runtime isRecord and per-operation validators — no unsafe casts.
 */

import type { ErrorEnvelope, FieldError } from "@neuraforge/schemas";
import { isExactSemanticVersion } from "@neuraforge/catalog-core";
import { COMPONENT_CATEGORIES, OPERATION_IDS } from "./types.js";
import type {
  ComponentCategory,
  GetComponentInput,
  GetDesignTokensInput,
  OperationId,
  PublicContext,
} from "./types.js";
import type { TokenCategory } from "@neuraforge/tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN_CATEGORIES: readonly string[] = [
  "color",
  "typography",
  "spacing",
  "sizing",
  "elevation",
  "border",
  "breakpoint",
  "motion",
];

const MAX_QUERY_LENGTH = 500;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldError(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

function unknownFieldErrors(
  input: Record<string, unknown>,
  allowed: readonly string[],
): FieldError[] {
  const allowedSet = new Set(allowed);
  return Object.keys(input)
    .filter((key) => !allowedSet.has(key))
    .map((key) =>
      fieldError(
        "unknown_field",
        `/${key}`,
        "must be a declared input field",
        `Remove unknown field '${key}'`,
      ),
    );
}

function validationEnvelope(
  operation: OperationId,
  fields: FieldError[],
  requestId: string,
): ErrorEnvelope {
  return {
    error: {
      code: "input_validation_failed",
      category: "validation",
      operation,
      message: `Invalid input for ${operation}`,
      retryable: false,
      fields,
      requestId,
    },
  };
}

// ---------------------------------------------------------------------------
// Context validation
// ---------------------------------------------------------------------------

export function validateContext(input: unknown): {
  valid: boolean;
  context?: PublicContext;
  errors: FieldError[];
} {
  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [
        fieldError(
          "invalid_context",
          "/context",
          "must be an object with registryVersion and requestId",
          "Provide a valid PublicContext",
        ),
      ],
    };
  }
  const errors: FieldError[] = [];
  if (typeof input.registryVersion !== "string" || input.registryVersion.length === 0) {
    errors.push(
      fieldError(
        "invalid_registry_version",
        "/context/registryVersion",
        "must be a non-empty string",
        "Provide the exact registry version",
      ),
    );
  }
  if (typeof input.requestId !== "string" || input.requestId.length === 0) {
    errors.push(
      fieldError(
        "invalid_request_id",
        "/context/requestId",
        "must be a non-empty string",
        "Provide a unique request identifier",
      ),
    );
  }
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    context: {
      registryVersion: input.registryVersion as string,
      requestId: input.requestId as string,
    },
    errors: [],
  };
}

// ---------------------------------------------------------------------------
// list_components
// ---------------------------------------------------------------------------

const LIST_ALLOWED_FIELDS = ["category", "exactVersion", "pageSize", "cursor"] as const;

export interface ValidatedListInput {
  category: ComponentCategory | undefined;
  exactVersion: string | undefined;
  pageSize: number;
  cursor: string | undefined;
}

export function validateListComponentsInput(
  input: unknown,
  requestId: string,
): { ok: true; value: ValidatedListInput } | { ok: false; error: ErrorEnvelope } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: validationEnvelope(
        "list_components",
        [fieldError("invalid_input", "/", "must be an object", "Provide a valid input object")],
        requestId,
      ),
    };
  }
  const errors: FieldError[] = [];
  errors.push(...unknownFieldErrors(input, LIST_ALLOWED_FIELDS));

  let category: ComponentCategory | undefined;
  if (input.category !== undefined) {
    if (
      typeof input.category !== "string" ||
      !COMPONENT_CATEGORIES.includes(input.category as ComponentCategory)
    ) {
      errors.push(
        fieldError(
          "invalid_category",
          "/category",
          `must be one of: ${COMPONENT_CATEGORIES.join(", ")}`,
          "Use a valid component category",
        ),
      );
    } else {
      category = input.category as ComponentCategory;
    }
  }

  let exactVersion: string | undefined;
  if (input.exactVersion !== undefined) {
    if (typeof input.exactVersion !== "string" || !isExactSemanticVersion(input.exactVersion)) {
      errors.push(
        fieldError(
          "invalid_exact_version",
          "/exactVersion",
          "must be an exact Semantic Version (e.g. 1.0.0)",
          "Provide a valid exact version",
        ),
      );
    } else {
      exactVersion = input.exactVersion;
    }
  }

  let pageSize = DEFAULT_PAGE_SIZE;
  if (input.pageSize !== undefined) {
    if (
      typeof input.pageSize !== "number" ||
      !Number.isInteger(input.pageSize) ||
      input.pageSize < MIN_PAGE_SIZE ||
      input.pageSize > MAX_PAGE_SIZE
    ) {
      errors.push(
        fieldError(
          "invalid_page_size",
          "/pageSize",
          `must be an integer between ${String(MIN_PAGE_SIZE)} and ${String(MAX_PAGE_SIZE)}`,
          `Use a page size between ${String(MIN_PAGE_SIZE)} and ${String(MAX_PAGE_SIZE)}`,
        ),
      );
    } else {
      pageSize = input.pageSize;
    }
  }

  let cursor: string | undefined;
  if (input.cursor !== undefined) {
    if (typeof input.cursor !== "string" || input.cursor.length === 0) {
      errors.push(
        fieldError(
          "invalid_cursor",
          "/cursor",
          "must be a non-empty string when provided",
          "Use the nextCursor value from the previous page",
        ),
      );
    } else {
      cursor = input.cursor;
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: validationEnvelope("list_components", errors, requestId) };
  }
  return { ok: true, value: { category, exactVersion, pageSize, cursor } };
}

// ---------------------------------------------------------------------------
// get_component
// ---------------------------------------------------------------------------

const GET_ALLOWED_FIELDS = ["stableId", "version"] as const;

export function validateGetComponentInput(
  input: unknown,
  requestId: string,
): { ok: true; value: GetComponentInput } | { ok: false; error: ErrorEnvelope } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: validationEnvelope(
        "get_component",
        [fieldError("invalid_input", "/", "must be an object", "Provide a valid input object")],
        requestId,
      ),
    };
  }
  const errors: FieldError[] = [];
  errors.push(...unknownFieldErrors(input, GET_ALLOWED_FIELDS));

  if (typeof input.stableId !== "string" || input.stableId.trim().length === 0) {
    errors.push(
      fieldError(
        "required_stable_id",
        "/stableId",
        "must be a non-empty string identifying the component",
        "Provide the component's stable identifier",
      ),
    );
  }

  if (typeof input.version !== "string" || !isExactSemanticVersion(input.version)) {
    errors.push(
      fieldError(
        "invalid_version",
        "/version",
        "must be an exact Semantic Version (e.g. 1.0.0); no ranges or latest",
        "Provide a specific published version",
      ),
    );
  }

  if (errors.length > 0) {
    return { ok: false, error: validationEnvelope("get_component", errors, requestId) };
  }
  return {
    ok: true,
    value: {
      stableId: (input.stableId as string).trim(),
      version: input.version as string,
    },
  };
}

// ---------------------------------------------------------------------------
// search_components
// ---------------------------------------------------------------------------

const SEARCH_ALLOWED_FIELDS = ["query", "category", "exactVersion", "pageSize", "cursor"] as const;

export interface ValidatedSearchInput {
  query: string;
  category: ComponentCategory | undefined;
  exactVersion: string | undefined;
  pageSize: number;
  cursor: string | undefined;
}

export function validateSearchComponentsInput(
  input: unknown,
  requestId: string,
): { ok: true; value: ValidatedSearchInput } | { ok: false; error: ErrorEnvelope } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: validationEnvelope(
        "search_components",
        [fieldError("invalid_input", "/", "must be an object", "Provide a valid input object")],
        requestId,
      ),
    };
  }
  const errors: FieldError[] = [];
  errors.push(...unknownFieldErrors(input, SEARCH_ALLOWED_FIELDS));

  let query = "";
  if (typeof input.query !== "string" || input.query.trim().length === 0) {
    errors.push(
      fieldError(
        "required_query",
        "/query",
        "must be a non-blank string",
        "Provide a search query",
      ),
    );
  } else if (input.query.length > MAX_QUERY_LENGTH) {
    errors.push(
      fieldError(
        "query_too_long",
        "/query",
        `must be at most ${String(MAX_QUERY_LENGTH)} characters`,
        "Shorten the search query",
      ),
    );
  } else {
    query = input.query;
  }

  let category: ComponentCategory | undefined;
  if (input.category !== undefined) {
    if (
      typeof input.category !== "string" ||
      !COMPONENT_CATEGORIES.includes(input.category as ComponentCategory)
    ) {
      errors.push(
        fieldError(
          "invalid_category",
          "/category",
          `must be one of: ${COMPONENT_CATEGORIES.join(", ")}`,
          "Use a valid component category",
        ),
      );
    } else {
      category = input.category as ComponentCategory;
    }
  }

  let exactVersion: string | undefined;
  if (input.exactVersion !== undefined) {
    if (typeof input.exactVersion !== "string" || !isExactSemanticVersion(input.exactVersion)) {
      errors.push(
        fieldError(
          "invalid_exact_version",
          "/exactVersion",
          "must be an exact Semantic Version (e.g. 1.0.0)",
          "Provide a valid exact version",
        ),
      );
    } else {
      exactVersion = input.exactVersion;
    }
  }

  let pageSize = DEFAULT_PAGE_SIZE;
  if (input.pageSize !== undefined) {
    if (
      typeof input.pageSize !== "number" ||
      !Number.isInteger(input.pageSize) ||
      input.pageSize < MIN_PAGE_SIZE ||
      input.pageSize > MAX_PAGE_SIZE
    ) {
      errors.push(
        fieldError(
          "invalid_page_size",
          "/pageSize",
          `must be an integer between ${String(MIN_PAGE_SIZE)} and ${String(MAX_PAGE_SIZE)}`,
          `Use a page size between ${String(MIN_PAGE_SIZE)} and ${String(MAX_PAGE_SIZE)}`,
        ),
      );
    } else {
      pageSize = input.pageSize;
    }
  }

  let cursor: string | undefined;
  if (input.cursor !== undefined) {
    if (typeof input.cursor !== "string" || input.cursor.length === 0) {
      errors.push(
        fieldError(
          "invalid_cursor",
          "/cursor",
          "must be a non-empty string when provided",
          "Use the nextCursor value from the previous page",
        ),
      );
    } else {
      cursor = input.cursor;
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: validationEnvelope("search_components", errors, requestId) };
  }
  return { ok: true, value: { query, category, exactVersion, pageSize, cursor } };
}

// ---------------------------------------------------------------------------
// get_design_tokens
// ---------------------------------------------------------------------------

const TOKENS_ALLOWED_FIELDS = ["exactVersion", "category"] as const;

export function validateGetDesignTokensInput(
  input: unknown,
  requestId: string,
): { ok: true; value: GetDesignTokensInput } | { ok: false; error: ErrorEnvelope } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: validationEnvelope(
        "get_design_tokens",
        [fieldError("invalid_input", "/", "must be an object", "Provide a valid input object")],
        requestId,
      ),
    };
  }
  const errors: FieldError[] = [];
  errors.push(...unknownFieldErrors(input, TOKENS_ALLOWED_FIELDS));

  if (typeof input.exactVersion !== "string" || !isExactSemanticVersion(input.exactVersion)) {
    errors.push(
      fieldError(
        "required_exact_version",
        "/exactVersion",
        "must be an exact Semantic Version token release (e.g. 1.0.0)",
        "Provide a published token release version",
      ),
    );
  }

  if (input.category !== undefined) {
    if (typeof input.category !== "string" || !TOKEN_CATEGORIES.includes(input.category)) {
      errors.push(
        fieldError(
          "invalid_category",
          "/category",
          `must be one of: ${TOKEN_CATEGORIES.join(", ")}`,
          "Use a valid token category",
        ),
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: validationEnvelope("get_design_tokens", errors, requestId) };
  }
  return {
    ok: true,
    value: {
      exactVersion: input.exactVersion as string,
      category: input.category as TokenCategory | undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Operation ID validation
// ---------------------------------------------------------------------------

export function isValidOperationId(value: unknown): value is OperationId {
  return typeof value === "string" && (OPERATION_IDS as readonly string[]).includes(value);
}
