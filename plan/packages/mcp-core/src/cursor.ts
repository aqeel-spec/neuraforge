/**
 * Deterministic cursor encoding for list and search pagination.
 *
 * Cursor structure:
 * - Binds registryVersion, normalized filters, prior boundary, and pageSize
 * - Encodes canonical JSON + SHA-256 integrity checksum
 * - Uses Node built-in base64url encoding (Buffer)
 *
 * Cursor validation rejects:
 * - Malformed/tampered cursors (checksum mismatch)
 * - Filter/pageSize mismatch between cursor and current request
 * - Registry version mismatch
 */

import { canonicalizeJson, computeSha256Digest } from "@neuraforge-ui/catalog-core";
import type { JsonValue } from "@neuraforge-ui/schemas";
import type { ComponentCategory } from "./types.js";

// ---------------------------------------------------------------------------
// List cursor
// ---------------------------------------------------------------------------

export interface ListCursorPayload {
  readonly type: "list";
  readonly registryVersion: string;
  readonly category: string | null;
  readonly exactVersion: string | null;
  readonly pageSize: number;
  readonly afterStableId: string;
  readonly afterVersion: string;
}

// ---------------------------------------------------------------------------
// Search cursor
// ---------------------------------------------------------------------------

export interface SearchCursorPayload {
  readonly type: "search";
  readonly registryVersion: string;
  readonly normalizedQuery: string;
  readonly category: string | null;
  readonly exactVersion: string | null;
  readonly pageSize: number;
  readonly afterScore: number;
  readonly afterStableId: string;
  readonly afterVersion: string;
}

export type CursorPayload = ListCursorPayload | SearchCursorPayload;

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function payloadToJsonValue(payload: CursorPayload): JsonValue {
  if (payload.type === "list") {
    return {
      type: "list",
      registryVersion: payload.registryVersion,
      category: payload.category,
      exactVersion: payload.exactVersion,
      pageSize: payload.pageSize,
      afterStableId: payload.afterStableId,
      afterVersion: payload.afterVersion,
    };
  }
  return {
    type: "search",
    registryVersion: payload.registryVersion,
    normalizedQuery: payload.normalizedQuery,
    category: payload.category,
    exactVersion: payload.exactVersion,
    pageSize: payload.pageSize,
    afterScore: payload.afterScore,
    afterStableId: payload.afterStableId,
    afterVersion: payload.afterVersion,
  };
}

export async function encodeCursor(payload: CursorPayload): Promise<string> {
  const canonical = canonicalizeJson(payloadToJsonValue(payload));
  const digest = await computeSha256Digest(new TextEncoder().encode(canonical));
  const envelope: JsonValue = { data: canonical, checksum: digest };
  const envelopeJson = JSON.stringify(envelope);
  return Buffer.from(envelopeJson, "utf-8").toString("base64url");
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface DecodedCursorEnvelope {
  data: string;
  checksum: string;
}

function parseEnvelope(raw: string): DecodedCursorEnvelope | null {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64url").toString("utf-8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (typeof parsed.data !== "string" || typeof parsed.checksum !== "string") return null;
  return { data: parsed.data, checksum: parsed.checksum };
}

export async function decodeCursor(raw: string): Promise<CursorPayload | null> {
  const envelope = parseEnvelope(raw);
  if (!envelope) return null;

  // Verify integrity
  const expectedDigest = await computeSha256Digest(new TextEncoder().encode(envelope.data));
  if (expectedDigest !== envelope.checksum) return null;

  // Parse the data
  let parsed: unknown;
  try {
    parsed = JSON.parse(envelope.data) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  if (parsed.type === "list") {
    if (
      typeof parsed.registryVersion !== "string" ||
      typeof parsed.pageSize !== "number" ||
      typeof parsed.afterStableId !== "string" ||
      typeof parsed.afterVersion !== "string"
    ) {
      return null;
    }
    if (
      (parsed.category !== null && typeof parsed.category !== "string") ||
      (parsed.exactVersion !== null && typeof parsed.exactVersion !== "string")
    ) {
      return null;
    }
    return {
      type: "list",
      registryVersion: parsed.registryVersion,
      category: typeof parsed.category === "string" ? parsed.category : null,
      exactVersion: typeof parsed.exactVersion === "string" ? parsed.exactVersion : null,
      pageSize: parsed.pageSize,
      afterStableId: parsed.afterStableId,
      afterVersion: parsed.afterVersion,
    };
  }

  if (parsed.type === "search") {
    if (
      typeof parsed.registryVersion !== "string" ||
      typeof parsed.normalizedQuery !== "string" ||
      typeof parsed.pageSize !== "number" ||
      typeof parsed.afterScore !== "number" ||
      typeof parsed.afterStableId !== "string" ||
      typeof parsed.afterVersion !== "string"
    ) {
      return null;
    }
    if (
      (parsed.category !== null && typeof parsed.category !== "string") ||
      (parsed.exactVersion !== null && typeof parsed.exactVersion !== "string")
    ) {
      return null;
    }
    return {
      type: "search",
      registryVersion: parsed.registryVersion,
      normalizedQuery: parsed.normalizedQuery,
      category: typeof parsed.category === "string" ? parsed.category : null,
      exactVersion: typeof parsed.exactVersion === "string" ? parsed.exactVersion : null,
      pageSize: parsed.pageSize,
      afterScore: parsed.afterScore,
      afterStableId: parsed.afterStableId,
      afterVersion: parsed.afterVersion,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cursor validation against current request parameters
// ---------------------------------------------------------------------------

export interface CursorValidationError {
  readonly field: string;
  readonly message: string;
}

export function validateListCursor(
  payload: ListCursorPayload,
  registryVersion: string,
  category: ComponentCategory | undefined,
  exactVersion: string | undefined,
  pageSize: number,
): CursorValidationError[] {
  const errors: CursorValidationError[] = [];
  if (payload.registryVersion !== registryVersion) {
    errors.push({
      field: "cursor/registryVersion",
      message: "Cursor was created for a different registry version",
    });
  }
  if ((payload.category ?? undefined) !== (category ?? undefined)) {
    errors.push({
      field: "cursor/category",
      message: "Cursor category filter does not match current request",
    });
  }
  if ((payload.exactVersion ?? undefined) !== (exactVersion ?? undefined)) {
    errors.push({
      field: "cursor/exactVersion",
      message: "Cursor exactVersion filter does not match current request",
    });
  }
  if (payload.pageSize !== pageSize) {
    errors.push({
      field: "cursor/pageSize",
      message: "Cursor pageSize does not match current request",
    });
  }
  return errors;
}

export function validateSearchCursor(
  payload: SearchCursorPayload,
  registryVersion: string,
  normalizedQuery: string,
  category: ComponentCategory | undefined,
  exactVersion: string | undefined,
  pageSize: number,
): CursorValidationError[] {
  const errors: CursorValidationError[] = [];
  if (payload.registryVersion !== registryVersion) {
    errors.push({
      field: "cursor/registryVersion",
      message: "Cursor was created for a different registry version",
    });
  }
  if (payload.normalizedQuery !== normalizedQuery) {
    errors.push({
      field: "cursor/normalizedQuery",
      message: "Cursor query does not match current request",
    });
  }
  if ((payload.category ?? undefined) !== (category ?? undefined)) {
    errors.push({
      field: "cursor/category",
      message: "Cursor category filter does not match current request",
    });
  }
  if ((payload.exactVersion ?? undefined) !== (exactVersion ?? undefined)) {
    errors.push({
      field: "cursor/exactVersion",
      message: "Cursor exactVersion filter does not match current request",
    });
  }
  if (payload.pageSize !== pageSize) {
    errors.push({
      field: "cursor/pageSize",
      message: "Cursor pageSize does not match current request",
    });
  }
  return errors;
}
