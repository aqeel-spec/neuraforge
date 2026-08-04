/**
 * Request router for the public API.
 *
 * Routes GET/HEAD requests to route handlers.
 * Rejects POST/PUT/PATCH/DELETE with 405.
 * OPTIONS returns minimal CORS response.
 * All routes are backed by the verified immutable bundle.
 */

import type { JsonValue } from "@neuraforge/schemas";
import type { RegistryBundleReader } from "@neuraforge/registry-builder";
import { toJsonValue } from "@neuraforge/registry-builder";
import { compareSemanticVersions } from "@neuraforge/catalog-core";
import { decodeCursor, encodeCursor } from "@neuraforge/mcp-core";
import type { ListCursorPayload, ComponentCategory } from "@neuraforge/mcp-core";
import type { HttpRequest, HttpResponse } from "./types.js";
import {
  validatePathSegment,
  safeDecodeSegment,
  validateExactVersion,
  validateListQuery,
  validationErrorEnvelope,
  notFoundErrorEnvelope,
  methodNotAllowedEnvelope,
  availabilityErrorEnvelope,
} from "./validation.js";
import {
  buildImmutableResponse,
  buildPageResponse,
  buildErrorResponse,
  buildHealthResponse,
} from "./responses.js";

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

interface RouteMatch {
  readonly handler: string;
  readonly params: Record<string, string>;
}

function matchRoute(path: string): RouteMatch | null {
  // Remove leading slash and split
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const segments = normalizedPath.split("/");

  // /health
  if (segments.length === 1 && segments[0] === "health") {
    return { handler: "health", params: {} };
  }

  // All other routes start with /registry/{registryVersion}
  if (segments.length < 2 || segments[0] !== "registry") {
    return null;
  }

  const registryVersion = segments[1] ?? "";

  // /registry/{registryVersion}
  if (segments.length === 2) {
    return { handler: "snapshot", params: { registryVersion } };
  }

  // /registry/{registryVersion}/manifest
  if (segments.length === 3 && segments[2] === "manifest") {
    return { handler: "manifest", params: { registryVersion } };
  }

  // /registry/{registryVersion}/components
  if (segments.length === 3 && segments[2] === "components") {
    return { handler: "components", params: { registryVersion } };
  }

  // /registry/{registryVersion}/artifacts/component/{stableId}/{artifactVersion}
  if (segments.length === 6 && segments[2] === "artifacts" && segments[3] === "component") {
    const stableId = segments[4] ?? "";
    const artifactVersion = segments[5] ?? "";
    return {
      handler: "component-artifact",
      params: { registryVersion, stableId, artifactVersion },
    };
  }

  // /registry/{registryVersion}/artifacts/token-set/design-tokens/{artifactVersion}
  if (
    segments.length === 6 &&
    segments[2] === "artifacts" &&
    segments[3] === "token-set" &&
    segments[4] === "design-tokens"
  ) {
    const artifactVersion = segments[5] ?? "";
    return {
      handler: "token-artifact",
      params: { registryVersion, artifactVersion },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cursor validation (inline, since mcp-core doesn't export validateListCursor)
// ---------------------------------------------------------------------------

interface CursorValidationIssue {
  readonly field: string;
  readonly message: string;
}

function validateListCursorParams(
  payload: ListCursorPayload,
  registryVersion: string,
  category: ComponentCategory | undefined,
  exactVersion: string | undefined,
  pageSize: number,
): CursorValidationIssue[] {
  const issues: CursorValidationIssue[] = [];
  if (payload.registryVersion !== registryVersion) {
    issues.push({
      field: "cursor/registryVersion",
      message: "Cursor was created for a different registry version",
    });
  }
  if ((payload.category ?? undefined) !== (category ?? undefined)) {
    issues.push({
      field: "cursor/category",
      message: "Cursor category filter does not match current request",
    });
  }
  if ((payload.exactVersion ?? undefined) !== (exactVersion ?? undefined)) {
    issues.push({
      field: "cursor/exactVersion",
      message: "Cursor exactVersion filter does not match current request",
    });
  }
  if (payload.pageSize !== pageSize) {
    issues.push({
      field: "cursor/pageSize",
      message: "Cursor pageSize does not match current request",
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createRouter(
  reader: RegistryBundleReader,
  bundleRegistryVersion: string,
): (request: HttpRequest) => Promise<HttpResponse> {
  return async (request: HttpRequest): Promise<HttpResponse> => {
    const method = request.method.toUpperCase();

    // OPTIONS: minimal CORS preflight
    if (method === "OPTIONS") {
      return {
        status: 204,
        headers: {
          Allow: "GET, HEAD",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Length": "0",
        },
        body: "",
      };
    }

    // Only GET and HEAD
    if (method !== "GET" && method !== "HEAD") {
      return buildErrorResponse(405, methodNotAllowedEnvelope(), { Allow: "GET, HEAD" });
    }

    const isHead = method === "HEAD";

    // Parse path — reject backslash
    const rawPath = request.path;
    if (rawPath.includes("\\")) {
      return buildErrorResponse(
        400,
        validationErrorEnvelope("Path contains backslash", [
          {
            code: "path_backslash",
            path: "/path",
            constraint: "must not contain backslash characters",
            guidance: "Use forward slashes only in paths",
          },
        ]),
      );
    }

    // Try to decode the whole path
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      return buildErrorResponse(
        400,
        validationErrorEnvelope("Path contains invalid URL encoding", [
          {
            code: "path_decode_failure",
            path: "/path",
            constraint: "must be valid URL-encoded",
            guidance: "Ensure path segments are properly URL-encoded",
          },
        ]),
      );
    }

    // Check for traversal after decode
    if (decodedPath.includes("..") || decodedPath.includes("\0")) {
      return buildErrorResponse(
        400,
        validationErrorEnvelope("Path contains traversal or unsafe characters", [
          {
            code: "path_traversal",
            path: "/path",
            constraint: "must not contain path traversal segments",
            guidance: "Use direct path segments without . or ..",
          },
        ]),
      );
    }

    // Match route
    const route = matchRoute(decodedPath);
    if (route === null) {
      return buildErrorResponse(404, notFoundErrorEnvelope("Route not found", { kind: "route" }));
    }

    // Decode and validate path parameters
    for (const [key, value] of Object.entries(route.params)) {
      const decoded = safeDecodeSegment(value);
      if (decoded === null) {
        return buildErrorResponse(
          400,
          validationErrorEnvelope(`Invalid URL encoding in path parameter '${key}'`, [
            {
              code: "path_decode_failure",
              path: `/path/${key}`,
              constraint: "must be valid URL-encoded",
              guidance: "Ensure path segments are properly URL-encoded",
            },
          ]),
        );
      }
      const segError = validatePathSegment(decoded, `/path/${key}`);
      if (segError !== null) {
        return buildErrorResponse(
          400,
          validationErrorEnvelope("Invalid path parameter", [segError]),
        );
      }
    }

    try {
      // Dispatch to handler
      switch (route.handler) {
        case "health":
          return buildHealthResponse(bundleRegistryVersion);

        case "snapshot":
          return await handleSnapshot(reader, route.params, bundleRegistryVersion, isHead);

        case "components":
          return await handleComponents(
            reader,
            route.params,
            request.query,
            bundleRegistryVersion,
            isHead,
          );

        case "component-artifact":
          return await handleComponentArtifact(reader, route.params, bundleRegistryVersion, isHead);

        case "token-artifact":
          return await handleTokenArtifact(reader, route.params, bundleRegistryVersion, isHead);

        default:
          return buildErrorResponse(
            404,
            notFoundErrorEnvelope("Route not found", { kind: "route" }),
          );
      }
    } catch {
      return buildErrorResponse(503, availabilityErrorEnvelope("Service temporarily unavailable"));
    }
  };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

function handleSnapshot(
  reader: RegistryBundleReader,
  params: Record<string, string>,
  bundleRegistryVersion: string,
  isHead: boolean,
): Promise<HttpResponse> {
  const reqVersion = params.registryVersion ?? "";
  const versionError = validateExactVersion(reqVersion, "/path/registryVersion");
  if (versionError !== null) {
    return Promise.resolve(
      buildErrorResponse(400, validationErrorEnvelope("Invalid registry version", [versionError])),
    );
  }

  if (reqVersion !== bundleRegistryVersion) {
    return Promise.resolve(
      buildErrorResponse(
        404,
        notFoundErrorEnvelope(
          `Registry version '${reqVersion}' not found`,
          { kind: "registry-snapshot", version: reqVersion },
          [{ kind: "registry-snapshot", stableId: "registry", version: bundleRegistryVersion }],
        ),
      ),
    );
  }

  const snapshot = reader.getSnapshot();
  return buildImmutableResponse(
    toJsonValue(snapshot),
    { registryVersion: bundleRegistryVersion, checksum: snapshot.snapshotChecksum },
    isHead,
  );
}

async function handleComponents(
  reader: RegistryBundleReader,
  params: Record<string, string>,
  query: Readonly<Record<string, string | undefined>>,
  bundleRegistryVersion: string,
  isHead: boolean,
): Promise<HttpResponse> {
  const reqVersion = params.registryVersion ?? "";
  const versionError = validateExactVersion(reqVersion, "/path/registryVersion");
  if (versionError !== null) {
    return buildErrorResponse(
      400,
      validationErrorEnvelope("Invalid registry version", [versionError]),
    );
  }

  if (reqVersion !== bundleRegistryVersion) {
    return buildErrorResponse(
      404,
      notFoundErrorEnvelope(
        `Registry version '${reqVersion}' not found`,
        { kind: "registry-snapshot", version: reqVersion },
        [{ kind: "registry-snapshot", stableId: "registry", version: bundleRegistryVersion }],
      ),
    );
  }

  // Validate query parameters
  const queryResult = validateListQuery(query);
  if (!queryResult.ok) {
    return buildErrorResponse(400, queryResult.error);
  }

  const { category, exactVersion, pageSize, cursor } = queryResult.value;

  // Get all components from reader
  let allComponents = reader.listComponents(category);

  // Filter by exactVersion if provided
  if (exactVersion !== undefined) {
    allComponents = allComponents.filter((c) => c.version === exactVersion);
  }

  // Deterministic ordering: stableId ascending, then version ascending
  const sorted = [...allComponents].sort((a, b) => {
    if (a.stableId !== b.stableId) return a.stableId < b.stableId ? -1 : 1;
    return compareSemanticVersions(a.version, b.version);
  });

  // Decode cursor and validate
  let startIndex = 0;
  if (cursor !== undefined) {
    const decoded = await decodeCursor(cursor);
    if (decoded === null || decoded.type !== "list") {
      return buildErrorResponse(
        400,
        validationErrorEnvelope("Cursor is malformed or tampered", [
          {
            code: "cursor_malformed",
            path: "/query/cursor",
            constraint: "must be a valid, untampered cursor from a prior response",
            guidance: "Obtain a fresh cursor by requesting without a cursor parameter",
          },
        ]),
      );
    }

    const cursorIssues = validateListCursorParams(
      decoded,
      bundleRegistryVersion,
      category,
      exactVersion,
      pageSize,
    );
    if (cursorIssues.length > 0) {
      return buildErrorResponse(
        400,
        validationErrorEnvelope(
          "Cursor does not match the current request parameters",
          cursorIssues.map((issue) => ({
            code: "cursor_mismatch",
            path: `/${issue.field}`,
            constraint: issue.message,
            guidance: "Obtain a fresh cursor by requesting without a cursor parameter",
          })),
        ),
      );
    }

    // Find start position after cursor boundary
    const afterStableId = decoded.afterStableId;
    const afterVersion = decoded.afterVersion;
    startIndex = sorted.findIndex((entry) => {
      if (entry.stableId > afterStableId) return true;
      if (entry.stableId === afterStableId) {
        return compareSemanticVersions(entry.version, afterVersion) > 0;
      }
      return false;
    });
    if (startIndex === -1) startIndex = sorted.length;
  }

  // Paginate
  const page = sorted.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < sorted.length;

  // Generate nextCursor if there are more results
  let nextCursor: string | undefined;
  if (hasMore && page.length > 0) {
    const lastEntry = page[page.length - 1];
    if (lastEntry !== undefined) {
      const cursorPayload: ListCursorPayload = {
        type: "list",
        registryVersion: bundleRegistryVersion,
        category: category ?? null,
        exactVersion: exactVersion ?? null,
        pageSize,
        afterStableId: lastEntry.stableId,
        afterVersion: lastEntry.version,
      };
      nextCursor = await encodeCursor(cursorPayload);
    }
  }

  // Build response
  const responseData: JsonValue = {
    components: page.map((c) => ({
      stableId: c.stableId,
      version: c.version,
      name: c.name,
      description: c.description,
      category: c.category,
      tags: [...c.tags],
      checksum: toJsonValue(c.checksum),
    })),
    totalMatching: sorted.length,
    registryVersion: bundleRegistryVersion,
    ...(nextCursor !== undefined ? { nextCursor } : {}),
  };

  return buildPageResponse(responseData, bundleRegistryVersion, isHead);
}

function handleComponentArtifact(
  reader: RegistryBundleReader,
  params: Record<string, string>,
  bundleRegistryVersion: string,
  isHead: boolean,
): Promise<HttpResponse> {
  const reqVersion = params.registryVersion ?? "";
  const stableId = params.stableId ?? "";
  const artifactVersion = params.artifactVersion ?? "";

  // Validate registryVersion
  const regVersionError = validateExactVersion(reqVersion, "/path/registryVersion");
  if (regVersionError !== null) {
    return Promise.resolve(
      buildErrorResponse(
        400,
        validationErrorEnvelope("Invalid registry version", [regVersionError]),
      ),
    );
  }

  if (reqVersion !== bundleRegistryVersion) {
    return Promise.resolve(
      buildErrorResponse(
        404,
        notFoundErrorEnvelope(
          `Registry version '${reqVersion}' not found`,
          { kind: "registry-snapshot", version: reqVersion },
          [{ kind: "registry-snapshot", stableId: "registry", version: bundleRegistryVersion }],
        ),
      ),
    );
  }

  // Validate artifactVersion
  const artVersionError = validateExactVersion(artifactVersion, "/path/artifactVersion");
  if (artVersionError !== null) {
    return Promise.resolve(
      buildErrorResponse(
        400,
        validationErrorEnvelope("Invalid artifact version", [artVersionError]),
      ),
    );
  }

  // Look up the component
  const result = reader.getComponent(stableId, artifactVersion);
  if (!result.ok) {
    return Promise.resolve(
      buildErrorResponse(
        404,
        notFoundErrorEnvelope(
          `Component '${stableId}@${artifactVersion}' not found`,
          { kind: "component", id: stableId, version: artifactVersion },
          result.error.alternatives.map((alt) => ({
            kind: alt.kind,
            stableId: alt.stableId,
            version: alt.version,
          })),
        ),
      ),
    );
  }

  const entry = result.value;
  return buildImmutableResponse(
    toJsonValue(entry),
    { registryVersion: bundleRegistryVersion, checksum: entry.checksum },
    isHead,
  );
}

function handleTokenArtifact(
  reader: RegistryBundleReader,
  params: Record<string, string>,
  bundleRegistryVersion: string,
  isHead: boolean,
): Promise<HttpResponse> {
  const reqVersion = params.registryVersion ?? "";
  const artifactVersion = params.artifactVersion ?? "";

  // Validate registryVersion
  const regVersionError = validateExactVersion(reqVersion, "/path/registryVersion");
  if (regVersionError !== null) {
    return Promise.resolve(
      buildErrorResponse(
        400,
        validationErrorEnvelope("Invalid registry version", [regVersionError]),
      ),
    );
  }

  if (reqVersion !== bundleRegistryVersion) {
    return Promise.resolve(
      buildErrorResponse(
        404,
        notFoundErrorEnvelope(
          `Registry version '${reqVersion}' not found`,
          { kind: "registry-snapshot", version: reqVersion },
          [{ kind: "registry-snapshot", stableId: "registry", version: bundleRegistryVersion }],
        ),
      ),
    );
  }

  // Validate artifactVersion
  const artVersionError = validateExactVersion(artifactVersion, "/path/artifactVersion");
  if (artVersionError !== null) {
    return Promise.resolve(
      buildErrorResponse(
        400,
        validationErrorEnvelope("Invalid artifact version", [artVersionError]),
      ),
    );
  }

  // Look up the token artifact
  const result = reader.getTokenArtifact(artifactVersion);
  if (!result.ok) {
    return Promise.resolve(
      buildErrorResponse(
        404,
        notFoundErrorEnvelope(
          `Token version '${artifactVersion}' not found`,
          { kind: "token-set", id: "design-tokens", version: artifactVersion },
          result.error.alternatives.map((alt) => ({
            kind: alt.kind,
            stableId: alt.stableId,
            version: alt.version,
          })),
        ),
      ),
    );
  }

  const token = result.value;
  return buildImmutableResponse(
    toJsonValue(token),
    { registryVersion: bundleRegistryVersion, checksum: token.checksum },
    isHead,
  );
}
