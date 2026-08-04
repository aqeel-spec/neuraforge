import type { Checksum, JsonValue } from "@neuraforge-ui/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";

/**
 * Canonical byte generation and SHA-256 checksums.
 *
 * Implements the canonical-byte rule from the design's "Release topology and lifecycle"
 * section (Requirements 7.9, 7.10, 8.7, 11.11, 13.9-13.12): canonical bytes are UTF-8,
 * paths use "/", line endings are LF, JSON object keys are recursively lexicographically
 * sorted with insignificant whitespace removed, file entries are sorted by normalized
 * path, and file bytes are length-delimited before hashing. Every Registry, Public API,
 * npm, CLI, and MCP adapter that needs to verify or recompute a Project Artifact's
 * checksum uses this module so cross-channel results match exactly (Property 21).
 */

const textEncoder = new TextEncoder();

/** Converts any path separators to "/", collapses repeats, and strips a leading "./" segment. */
export function normalizePath(path: string): string {
  const withForwardSlashes = path.replace(/\\/g, "/");
  const collapsed = withForwardSlashes.replace(/\/+/g, "/");
  return collapsed.startsWith("./") ? collapsed.slice(2) : collapsed;
}

/** Normalizes CRLF and lone-CR line endings to LF. */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n|\r/g, "\n");
}

function isPlainObject(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Serializes a JSON value with recursively lexicographically sorted object keys and no
 * insignificant whitespace. This is the single canonical-JSON serializer used for
 * checksums, cursor encoding, and cross-channel comparison; two JSON values that are
 * equivalent except for key order or formatting always canonicalize identically.
 */
export function canonicalizeJson(value: JsonValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalizeJson(entry)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort();
    const entries = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key] as JsonValue)}`,
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Encodes a JSON value as canonical UTF-8 bytes (sorted keys, no insignificant whitespace). */
export function canonicalizeJsonBytes(value: JsonValue): Uint8Array {
  return textEncoder.encode(canonicalizeJson(value));
}

/** Encodes text content as canonical UTF-8 bytes with LF line endings. */
export function canonicalizeTextBytes(text: string): Uint8Array {
  return textEncoder.encode(normalizeLineEndings(text));
}

export interface CanonicalFileInput {
  path: string;
  /** Text content is line-ending normalized before UTF-8 encoding; byte content is used as-is. */
  content: string | Uint8Array;
}

interface CanonicalFileEntry {
  path: string;
  bytes: Uint8Array;
}

function toCanonicalFileEntry(file: CanonicalFileInput): CanonicalFileEntry {
  return {
    path: normalizePath(file.path),
    bytes: typeof file.content === "string" ? canonicalizeTextBytes(file.content) : file.content,
  };
}

function compareNormalizedPaths(a: CanonicalFileEntry, b: CanonicalFileEntry): number {
  if (a.path < b.path) return -1;
  if (a.path > b.path) return 1;
  return 0;
}

/** Prefixes `bytes` with its length as a 4-byte big-endian unsigned integer. */
export function lengthDelimit(bytes: Uint8Array): Uint8Array {
  const prefixed = new Uint8Array(4 + bytes.length);
  new DataView(prefixed.buffer).setUint32(0, bytes.length, false);
  prefixed.set(bytes, 4);
  return prefixed;
}

function concatenate(chunks: readonly Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Builds the canonical byte sequence for a set of files: each file's path is normalized,
 * text content is line-ending normalized and UTF-8 encoded, entries are sorted by
 * normalized path, and every (path, content) pair is length-delimited before
 * concatenation. The result is therefore independent of input file order and unambiguous
 * regardless of file count or content shape (Requirement 7.9's cross-channel parity and
 * Requirement 7.10's deterministic canonical byte-generation rule).
 */
export function canonicalizeFileSet(files: readonly CanonicalFileInput[]): Uint8Array {
  const entries = files.map(toCanonicalFileEntry).sort(compareNormalizedPaths);
  const chunks: Uint8Array[] = [];
  for (const entry of entries) {
    chunks.push(lengthDelimit(textEncoder.encode(entry.path)));
    chunks.push(lengthDelimit(entry.bytes));
  }
  return concatenate(chunks);
}

function toHex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Computes the hex-encoded SHA-256 digest over already-canonicalized bytes. */
export async function computeSha256Digest(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(digest);
}

/** Computes the declared `Checksum` record (algorithm, canonicalization version, digest) over canonical bytes. */
export async function computeChecksum(bytes: Uint8Array): Promise<Checksum> {
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest: await computeSha256Digest(bytes),
  };
}

/** Computes the canonical checksum for a JSON value (e.g. a Registry snapshot or metadata document). */
export async function computeJsonChecksum(value: JsonValue): Promise<Checksum> {
  return computeChecksum(canonicalizeJsonBytes(value));
}

/** Computes the canonical checksum for a set of files, per the multi-file canonical-byte rule. */
export async function computeFileSetChecksum(
  files: readonly CanonicalFileInput[],
): Promise<Checksum> {
  return computeChecksum(canonicalizeFileSet(files));
}
