/**
 * Public API factory: createPublicApi(bundle).
 *
 * Verifies the full immutable bundle BEFORE returning a handler.
 * Invalid/tampered bundle => construction failure; no endpoint exposed.
 * The handler is backed by the already verified immutable bundle.
 * No independent mutable catalog, filesystem write, network fetch,
 * auth store, DB, hosted state, or environment-variable dependency.
 */

import type { ReleaseBundle } from "@neuraforge/registry-builder";
import { createRegistryBundleReader, toJsonValue } from "@neuraforge/registry-builder";
import type { ReleaseManifest } from "@neuraforge/schemas";
import type { HttpRequest, HttpResponse, PublicApiHandler } from "./types.js";
import { createRouter } from "./router.js";
import { buildImmutableResponse, buildErrorResponse } from "./responses.js";
import {
  validateExactVersion,
  validationErrorEnvelope,
  notFoundErrorEnvelope,
  availabilityErrorEnvelope,
} from "./validation.js";

/**
 * Creates a public API handler over one verified release bundle.
 *
 * The bundle is verified completely before the handler is returned.
 * If verification fails, the promise rejects — no handler is exposed.
 */
export async function createPublicApi(bundle: ReleaseBundle): Promise<PublicApiHandler> {
  // Verify the bundle before exposing any handler
  const readerResult = await createRegistryBundleReader(bundle);
  if (!readerResult.ok) {
    throw new Error(`Bundle verification failed: ${readerResult.error.message}`);
  }

  const reader = readerResult.value;
  const registryVersion = bundle.snapshot.registryVersion;
  const manifest = bundle.manifest;
  const router = createRouter(reader, registryVersion);

  const handler: PublicApiHandler = {
    async handle(request: HttpRequest): Promise<HttpResponse> {
      const method = request.method.toUpperCase();
      try {
        // Special handling for manifest route (router delegates but we need direct manifest access)
        const response =
          (method === "GET" || method === "HEAD") && isManifestRoute(request.path)
            ? await handleManifestDirect(request, manifest, registryVersion)
            : await router(request);
        return method === "HEAD" ? { ...response, body: "" } : response;
      } catch {
        const response = buildErrorResponse(
          503,
          availabilityErrorEnvelope("Service temporarily unavailable"),
        );
        return method === "HEAD" ? { ...response, body: "" } : response;
      }
    },
  };

  return handler;
}

// ---------------------------------------------------------------------------
// Manifest route detection and handling
// ---------------------------------------------------------------------------

function isManifestRoute(path: string): boolean {
  // Reject backslash before decoding
  if (path.includes("\\")) return false;
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    return false;
  }
  const normalized = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  const segments = normalized.split("/");
  return segments.length === 3 && segments[0] === "registry" && segments[2] === "manifest";
}

async function handleManifestDirect(
  request: HttpRequest,
  manifest: ReleaseManifest,
  bundleRegistryVersion: string,
): Promise<HttpResponse> {
  const method = request.method.toUpperCase();
  const isHead = method === "HEAD";

  // Parse path to get version
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(request.path);
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

  // Check for backslash/traversal
  if (decodedPath.includes("\\") || decodedPath.includes("..")) {
    return buildErrorResponse(
      400,
      validationErrorEnvelope("Path contains unsafe characters", [
        {
          code: "path_unsafe",
          path: "/path",
          constraint: "must not contain backslash or traversal sequences",
          guidance: "Use forward slashes only and avoid .. segments",
        },
      ]),
    );
  }

  const normalized = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  const segments = normalized.split("/");
  const reqVersion = segments[1] ?? "";

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
        [
          {
            kind: "registry-snapshot" as const,
            stableId: "registry",
            version: bundleRegistryVersion,
          },
        ],
      ),
    );
  }

  return buildImmutableResponse(
    toJsonValue(manifest),
    { registryVersion: bundleRegistryVersion },
    isHead,
  );
}
