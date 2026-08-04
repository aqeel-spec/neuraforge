/**
 * Content addressing and canonicalization for release bundles.
 *
 * - Snapshot checksum: from canonical JSON of snapshot excluding snapshotChecksum field.
 * - Bundle checksum/address: from canonical JSON of manifest + snapshot + all source contents.
 * - Same inputs in different array/object order produce byte-identical output.
 * - Address format: sha256:<64hex>
 */

import type { Checksum, ReleaseManifest } from "@neuraforge-ui/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import {
  canonicalizeJson,
  canonicalizeJsonBytes,
  computeChecksum,
  computeSha256Digest,
} from "@neuraforge-ui/catalog-core";
import type { RegistrySnapshot, ReleaseBundle, SourceFileWithContent } from "./types.js";
import { toJsonValue } from "./json.js";

/**
 * Computes the snapshot checksum from the canonical JSON of the snapshot
 * excluding the snapshotChecksum field itself.
 */
export async function computeSnapshotChecksum(
  snapshot: Omit<RegistrySnapshot, "snapshotChecksum">,
): Promise<Checksum> {
  // Build a copy without snapshotChecksum for hashing
  const forHashing: Record<string, unknown> = { ...snapshot };
  delete forHashing.snapshotChecksum;
  const canonical = canonicalizeJson(toJsonValue(forHashing));
  const bytes = new TextEncoder().encode(canonical);
  const digest = await computeSha256Digest(bytes);
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };
}

/**
 * Collects all source file contents from the snapshot's component artifacts,
 * sorted by path for deterministic ordering.
 */
function collectAllSourceContents(snapshot: RegistrySnapshot): readonly SourceFileWithContent[] {
  const allFiles: SourceFileWithContent[] = [];
  for (const component of snapshot.components) {
    for (const file of component.sourceFiles) {
      allFiles.push(file);
    }
  }
  // Sort by path for deterministic ordering
  allFiles.sort((a, b) => a.path.localeCompare(b.path));
  return allFiles;
}

/**
 * Computes the bundle checksum from canonical JSON of:
 * - manifest
 * - snapshot (with its checksum)
 * - all source file contents (deterministic path order)
 */
export async function computeBundleChecksum(
  manifest: ReleaseManifest,
  snapshot: RegistrySnapshot,
): Promise<Checksum> {
  const sourceContents = collectAllSourceContents(snapshot);

  // Build the canonical payload: manifest + snapshot + ordered source contents
  const payload = toJsonValue({
    manifest,
    snapshot,
    sourceContents: sourceContents.map((file) => ({
      path: file.path,
      content: file.content,
    })),
  });

  const canonical = canonicalizeJson(payload);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await computeSha256Digest(bytes);
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };
}

/**
 * Computes the content address from a bundle checksum.
 * Format: sha256:<64hex>
 */
export function computeBundleAddress(checksum: Checksum): string {
  return `${checksum.algorithm}:${checksum.digest}`;
}

/**
 * Verifies the snapshot checksum by recomputing it.
 */
export async function verifySnapshotChecksum(snapshot: RegistrySnapshot): Promise<boolean> {
  const recomputed = await computeSnapshotChecksum(snapshot);
  return recomputed.digest === snapshot.snapshotChecksum.digest;
}

/**
 * Verifies the bundle checksum by recomputing it.
 */
export async function verifyBundleChecksum(bundle: ReleaseBundle): Promise<boolean> {
  const recomputed = await computeBundleChecksum(bundle.manifest, bundle.snapshot);
  return recomputed.digest === bundle.bundleChecksum.digest;
}

/**
 * Recomputes a source file's checksum from its content.
 */
export async function recomputeFileChecksum(file: SourceFileWithContent): Promise<Checksum> {
  const bytes = new TextEncoder().encode(file.content.replace(/\r\n|\r/g, "\n"));
  const digest = await computeSha256Digest(bytes);
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };
}

/**
 * Recomputes a token document checksum.
 */
export async function recomputeTokenChecksum(tokenDocument: unknown): Promise<Checksum> {
  return computeChecksum(canonicalizeJsonBytes(toJsonValue(tokenDocument)));
}
