/**
 * Response construction for immutable registry responses.
 *
 * Handles canonical JSON serialization, content-length calculation,
 * ETag generation, cache headers, and HEAD response parity.
 */

import type { Checksum, ErrorEnvelope, JsonValue } from "@neuraforge-ui/schemas";
import { toJsonValue } from "@neuraforge-ui/registry-builder";
import { canonicalizeJson, computeSha256Digest } from "@neuraforge-ui/catalog-core";
import type { HttpResponse } from "./types.js";

const textEncoder = new TextEncoder();

// ---------------------------------------------------------------------------
// Header construction
// ---------------------------------------------------------------------------

interface ImmutableResponseOptions {
  readonly registryVersion: string;
  readonly checksum?: Checksum;
}

function baseHeaders(
  body: string,
  etag: string,
  options: ImmutableResponseOptions,
): Record<string, string> {
  const bodyBytes = textEncoder.encode(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(bodyBytes.length),
    ETag: etag,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-NeuraForge-Registry-Version": options.registryVersion,
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
  };
  if (options.checksum !== undefined) {
    headers["X-NeuraForge-Checksum-Algorithm"] = options.checksum.algorithm;
    headers["X-NeuraForge-Checksum"] = options.checksum.digest;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Immutable resource response (strong ETag from declared checksum)
// ---------------------------------------------------------------------------

export async function buildImmutableResponse(
  data: JsonValue,
  options: ImmutableResponseOptions,
  isHead: boolean,
): Promise<HttpResponse> {
  const body = canonicalizeJson(data);
  const etag =
    options.checksum !== undefined
      ? `"${options.checksum.digest}"`
      : `"${await computeSha256Digest(textEncoder.encode(body))}"`;

  const headers = baseHeaders(body, etag, options);

  return {
    status: 200,
    headers,
    body: isHead ? "" : body,
  };
}

// ---------------------------------------------------------------------------
// List/page response (ETag from canonical body checksum)
// ---------------------------------------------------------------------------

export async function buildPageResponse(
  data: JsonValue,
  registryVersion: string,
  isHead: boolean,
): Promise<HttpResponse> {
  const body = canonicalizeJson(data);
  const digest = await computeSha256Digest(textEncoder.encode(body));
  const etag = `"${digest}"`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(textEncoder.encode(body).length),
    ETag: etag,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-NeuraForge-Registry-Version": registryVersion,
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
  };

  return {
    status: 200,
    headers,
    body: isHead ? "" : body,
  };
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

export function buildErrorResponse(
  status: number,
  envelope: ErrorEnvelope,
  additionalHeaders?: Record<string, string>,
): HttpResponse {
  const body = canonicalizeJson(toJsonValue(envelope));
  const bodyBytes = textEncoder.encode(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(bodyBytes.length),
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    ...additionalHeaders,
  };
  return { status, headers, body };
}

// ---------------------------------------------------------------------------
// Health response
// ---------------------------------------------------------------------------

export function buildHealthResponse(registryVersion: string): HttpResponse {
  const data: JsonValue = {
    status: "healthy",
    registryVersion,
  };
  const body = canonicalizeJson(data);
  const bodyBytes = textEncoder.encode(body);
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": String(bodyBytes.length),
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
    body,
  };
}
