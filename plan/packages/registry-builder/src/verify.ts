/**
 * Bundle verification — recomputes every checksum and accumulates mismatches.
 *
 * Never throws on malformed unknown input. Detects mutation/substitution.
 */

import {
  canonicalizeJsonBytes,
  canonicalizeTextBytes,
  computeFileSetChecksum,
  computeSha256Digest,
} from "@neuraforge-ui/catalog-core";
import { toJsonValue } from "./json.js";
import type { ReleaseBundle, VerificationMismatch, VerificationResult } from "./types.js";
import {
  computeBundleAddress,
  computeBundleChecksum,
  computeSnapshotChecksum,
} from "./content-address.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasReleaseBundleShape(value: unknown): value is ReleaseBundle {
  if (!isRecord(value)) return false;
  const snapshot = value.snapshot;
  if (!isRecord(value.manifest) || !isRecord(snapshot) || !isRecord(value.bundleChecksum)) {
    return false;
  }
  return (
    typeof value.bundleAddress === "string" &&
    Array.isArray(snapshot.components) &&
    isRecord(snapshot.tokenArtifact) &&
    isRecord(snapshot.snapshotChecksum)
  );
}

/**
 * Verifies a release bundle by recomputing every checksum and address.
 * Accumulates all mismatches. Never throws on malformed input.
 */
export async function verifyReleaseBundle(bundle: unknown): Promise<VerificationResult> {
  const mismatches: VerificationMismatch[] = [];

  try {
    if (!isRecord(bundle)) {
      mismatches.push({
        path: "/",
        expected: "object",
        actual: typeof bundle,
      });
      return { valid: false, mismatches };
    }

    if (!hasReleaseBundleShape(bundle)) {
      mismatches.push({
        path: "/structure",
        expected: "manifest, snapshot, bundleChecksum, bundleAddress",
        actual: isRecord(bundle) ? Object.keys(bundle).join(", ") : typeof bundle,
      });
      return { valid: false, mismatches };
    }

    const typedBundle = bundle;

    // Verify each source file checksum and each component's canonical file-set checksum.
    for (const component of typedBundle.snapshot.components) {
      const artifactFiles: { path: string; content: string }[] = [];
      for (const file of component.sourceFiles) {
        if (typeof file.content !== "string") {
          mismatches.push({
            path: `components/${component.ref.stableId}/sourceFiles/${file.path}/content`,
            expected: "string",
            actual: typeof file.content,
          });
          continue;
        }
        artifactFiles.push({ path: file.path, content: file.content });
        const bytes = canonicalizeTextBytes(file.content);
        const digest = await computeSha256Digest(bytes);
        if (digest !== file.checksum.digest) {
          mismatches.push({
            path: `components/${component.ref.stableId}/sourceFiles/${file.path}/checksum`,
            expected: file.checksum.digest,
            actual: digest,
          });
        }
      }

      if (artifactFiles.length === component.sourceFiles.length) {
        const artifactChecksum = await computeFileSetChecksum(artifactFiles);
        if (artifactChecksum.digest !== component.checksum.digest) {
          mismatches.push({
            path: `components/${component.ref.stableId}/checksum`,
            expected: component.checksum.digest,
            actual: artifactChecksum.digest,
          });
        }
      }
    }

    // Verify token checksum
    const tokenBytes = canonicalizeJsonBytes(
      toJsonValue(typedBundle.snapshot.tokenArtifact.tokenDocument),
    );
    const tokenDigest = await computeSha256Digest(tokenBytes);
    if (tokenDigest !== typedBundle.snapshot.tokenArtifact.checksum.digest) {
      mismatches.push({
        path: "snapshot/tokenArtifact/checksum",
        expected: typedBundle.snapshot.tokenArtifact.checksum.digest,
        actual: tokenDigest,
      });
    }

    // Verify snapshot checksum
    const snapshotChecksum = await computeSnapshotChecksum(typedBundle.snapshot);
    if (snapshotChecksum.digest !== typedBundle.snapshot.snapshotChecksum.digest) {
      mismatches.push({
        path: "snapshot/snapshotChecksum",
        expected: typedBundle.snapshot.snapshotChecksum.digest,
        actual: snapshotChecksum.digest,
      });
    }

    // Verify bundle checksum
    const bundleChecksum = await computeBundleChecksum(typedBundle.manifest, typedBundle.snapshot);
    if (bundleChecksum.digest !== typedBundle.bundleChecksum.digest) {
      mismatches.push({
        path: "bundleChecksum",
        expected: typedBundle.bundleChecksum.digest,
        actual: bundleChecksum.digest,
      });
    }

    // Verify bundle address
    const expectedAddress = computeBundleAddress(typedBundle.bundleChecksum);
    if (expectedAddress !== typedBundle.bundleAddress) {
      mismatches.push({
        path: "bundleAddress",
        expected: expectedAddress,
        actual: typedBundle.bundleAddress,
      });
    }
  } catch {
    mismatches.push({
      path: "/",
      expected: "valid bundle structure",
      actual: "threw during verification",
    });
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}
