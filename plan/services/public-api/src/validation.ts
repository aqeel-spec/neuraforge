/**
 * Request validation: semver, path safety, query parameter validation.
 *
 * Rejects latest, ranges, empty/malformed versions before reader access.
 * Rejects traversal/backslash/absolute escape in paths.
 * Rejects unknown query fields.
 */

import type { ArtifactKind, ErrorEnvelope, FieldError } from "@neuraforge-ui/schemas";
import { isExactSemanticVersion } from "@neuraforge-ui/catalog-core";
import { COMPONENT_CATEGORIES } from "@neuraforge-ui/mcp-core";
import type { ComponentCategory } from "@neuraforge-ui/mcp-core";

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function fieldError(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

export function validationErrorEnvelope(
  message: string,
  fields: readonly FieldError[],
  resource?: { kind: string; id?: string; version?: string },
): ErrorEnvelope {
  return {
    error: {
      code: "input_validation_failed",
      category: "validation",
      message,
      retryable: false,
      fields: [...fields],
      ...(resource !== undefined ? { resource } : {}),
      requestId: "public-api",
    },
  };
}

export function notFoundErrorEnvelope(
  message: string,
  resource: { kind: string; id?: string; version?: string },
  alternatives?: readonly { kind: string; stableId: string; version: string }[],
): ErrorEnvelope {
  // Only include alternatives if they are valid ArtifactRef kinds
  const validArtifactKinds = new Set([
    "component",
    "token-set",
    "motion-preset",
    "animated-component",
    "three-d-component",
    "composition",
  ]);

  const validAlternatives = alternatives?.filter((alt) => validArtifactKinds.has(alt.kind));
  const nonArtifactAlternatives = alternatives?.filter((alt) => !validArtifactKinds.has(alt.kind));

  return {
    error: {
      code: "not_found",
      category: "not_found",
      message,
      retryable: false,
      resource,
      ...(validAlternatives !== undefined && validAlternatives.length > 0
        ? {
            alternatives: validAlternatives.map((alt) => ({
              kind: alt.kind as ArtifactKind,
              stableId: alt.stableId,
              version: alt.version,
            })),
          }
        : {}),
      ...(nonArtifactAlternatives !== undefined && nonArtifactAlternatives.length > 0
        ? {
            details: {
              availableVersions: nonArtifactAlternatives.map((alt) => alt.version),
            },
          }
        : {}),
      requestId: "public-api",
    },
  };
}

export function methodNotAllowedEnvelope(): ErrorEnvelope {
  return {
    error: {
      code: "method_not_allowed",
      category: "validation",
      message: "Only GET and HEAD methods are supported",
      retryable: false,
      requestId: "public-api",
    },
  };
}

export function availabilityErrorEnvelope(message: string): ErrorEnvelope {
  return {
    error: {
      code: "service_unavailable",
      category: "availability",
      message,
      retryable: true,
      requestId: "public-api",
    },
  };
}

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

/**
 * Validates that a decoded path segment is safe (no traversal, no backslash,
 * no absolute escape, no null bytes).
 */
export function validatePathSegment(segment: string, fieldPath: string): FieldError | null {
  if (segment === "" || segment === "." || segment === "..") {
    return fieldError(
      "path_traversal",
      fieldPath,
      "must not contain path traversal segments",
      "Use a direct path segment without . or ..",
    );
  }
  if (segment.includes("\\")) {
    return fieldError(
      "path_backslash",
      fieldPath,
      "must not contain backslash characters",
      "Use forward slashes only in paths",
    );
  }
  if (segment.includes("\0")) {
    return fieldError(
      "path_null_byte",
      fieldPath,
      "must not contain null bytes",
      "Remove null bytes from path",
    );
  }
  return null;
}

/**
 * URL-decodes a path segment safely. Returns null if decoding fails.
 */
export function safeDecodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Version validation
// ---------------------------------------------------------------------------

export function validateExactVersion(version: string, fieldPath: string): FieldError | null {
  if (version === "") {
    return fieldError(
      "version_empty",
      fieldPath,
      "must be an exact semantic version",
      "Provide a specific version like 1.0.0",
    );
  }
  if (version === "latest") {
    return fieldError(
      "version_latest_not_allowed",
      fieldPath,
      "must be an exact semantic version, not 'latest'",
      "Request one exact version rather than 'latest'",
    );
  }
  // Reject common ranges
  if (
    version.startsWith("^") ||
    version.startsWith("~") ||
    version.startsWith(">") ||
    version.startsWith("<") ||
    version.includes(" - ") ||
    version.includes("||") ||
    version.includes("*") ||
    version.includes("x")
  ) {
    return fieldError(
      "version_range_not_allowed",
      fieldPath,
      "must be an exact semantic version, not a range",
      "Request one exact version like 1.0.0",
    );
  }
  if (!isExactSemanticVersion(version)) {
    return fieldError(
      "version_malformed",
      fieldPath,
      "must be a valid semantic version (major.minor.patch)",
      "Provide a valid semantic version like 1.0.0",
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Query parameter validation for /components list
// ---------------------------------------------------------------------------

const ALLOWED_LIST_QUERY_FIELDS = new Set(["category", "exactVersion", "pageSize", "cursor"]);

export interface ValidatedListQuery {
  readonly category: ComponentCategory | undefined;
  readonly exactVersion: string | undefined;
  readonly pageSize: number;
  readonly cursor: string | undefined;
}

export function validateListQuery(
  query: Readonly<Record<string, string | undefined>>,
): { ok: true; value: ValidatedListQuery } | { ok: false; error: ErrorEnvelope } {
  const errors: FieldError[] = [];

  // Reject unknown query fields
  for (const key of Object.keys(query)) {
    if (!ALLOWED_LIST_QUERY_FIELDS.has(key)) {
      errors.push(
        fieldError(
          "unknown_query_field",
          `/query/${key}`,
          "must be a declared query parameter",
          `Remove unknown query parameter '${key}'`,
        ),
      );
    }
  }

  // Validate category
  let category: ComponentCategory | undefined;
  const categoryParam = query.category;
  if (categoryParam !== undefined) {
    const validCategories = COMPONENT_CATEGORIES as readonly string[];
    if (!validCategories.includes(categoryParam)) {
      errors.push(
        fieldError(
          "invalid_category",
          "/query/category",
          `must be one of: ${COMPONENT_CATEGORIES.join(", ")}`,
          `Use one of: ${COMPONENT_CATEGORIES.join(", ")}`,
        ),
      );
    } else {
      category = categoryParam as ComponentCategory;
    }
  }

  // Validate exactVersion
  let exactVersion: string | undefined;
  const exactVersionParam = query.exactVersion;
  if (exactVersionParam !== undefined) {
    const versionError = validateExactVersion(exactVersionParam, "/query/exactVersion");
    if (versionError !== null) {
      errors.push(versionError);
    } else {
      exactVersion = exactVersionParam;
    }
  }

  // Validate pageSize
  let pageSize = 20;
  const pageSizeParam = query.pageSize;
  if (pageSizeParam !== undefined) {
    const parsed = Number(pageSizeParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      errors.push(
        fieldError(
          "invalid_page_size",
          "/query/pageSize",
          "must be an integer between 1 and 100",
          "Provide a page size between 1 and 100",
        ),
      );
    } else {
      pageSize = parsed;
    }
  }

  // Cursor: just pass through, validation is done during pagination
  const cursor = query.cursor;

  if (errors.length > 0) {
    return { ok: false, error: validationErrorEnvelope("Invalid query parameters", errors) };
  }

  return {
    ok: true,
    value: { category, exactVersion, pageSize, cursor },
  };
}
