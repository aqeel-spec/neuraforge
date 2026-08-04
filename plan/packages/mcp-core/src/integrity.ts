/**
 * Shared integrity guards for mcp-core.
 *
 * BEFORE any list/search/get payload presents artifact data, verifies:
 * 1. Every source file content against its declared FileRecord SHA-256
 * 2. Artifact checksum via catalog-core canonical file-set framing
 *
 * If bytes missing, checksum malformed/mismatch, or verification cannot complete,
 * returns structured integrity error and no artifact/source payload.
 */

import {
  computeFileSetChecksum,
  computeSha256Digest,
  canonicalizeTextBytes,
} from "@neuraforge/catalog-core";
import type { Checksum, ErrorEnvelope } from "@neuraforge/schemas";
import type { ComponentArtifact, ComponentSourceFile } from "./provider.js";

// ---------------------------------------------------------------------------
// File-level SHA-256 verification
// ---------------------------------------------------------------------------

export interface FileIntegrityFailure {
  readonly path: string;
  readonly expected: string;
  readonly observed: string;
}

export async function verifyFileChecksum(
  file: ComponentSourceFile,
): Promise<FileIntegrityFailure | null> {
  const bytes = canonicalizeTextBytes(file.content);
  const observed = await computeSha256Digest(bytes);
  if (observed !== file.checksum.digest) {
    return { path: file.path, expected: file.checksum.digest, observed };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Artifact-level checksum verification (file-set framing)
// ---------------------------------------------------------------------------

export async function verifyArtifactChecksum(
  artifact: ComponentArtifact,
): Promise<{ valid: boolean; expected: string; observed: string }> {
  const files = artifact.sourceFiles.map((f) => ({
    path: f.path,
    content: f.content,
  }));
  const computed = await computeFileSetChecksum(files);
  const valid = computed.digest === artifact.checksum.digest;
  return { valid, expected: artifact.checksum.digest, observed: computed.digest };
}

// ---------------------------------------------------------------------------
// Full integrity verification for get_component
// ---------------------------------------------------------------------------

export interface IntegrityVerificationResult {
  readonly passed: boolean;
  readonly fileFailures: readonly FileIntegrityFailure[];
  readonly artifactChecksumValid: boolean;
  readonly expectedArtifactChecksum: string;
  readonly observedArtifactChecksum: string;
}

export async function verifyComponentIntegrity(
  artifact: ComponentArtifact,
): Promise<IntegrityVerificationResult> {
  // Verify individual file checksums
  const fileResults = await Promise.all(artifact.sourceFiles.map((f) => verifyFileChecksum(f)));
  const fileFailures = fileResults.filter((r): r is FileIntegrityFailure => r !== null);

  // Verify artifact-level checksum
  const artifactResult = await verifyArtifactChecksum(artifact);

  return {
    passed: fileFailures.length === 0 && artifactResult.valid,
    fileFailures,
    artifactChecksumValid: artifactResult.valid,
    expectedArtifactChecksum: artifactResult.expected,
    observedArtifactChecksum: artifactResult.observed,
  };
}

// ---------------------------------------------------------------------------
// Integrity error envelope construction
// ---------------------------------------------------------------------------

export function buildIntegrityError(
  operation: string,
  requestId: string,
  details: {
    fileFailures?: readonly FileIntegrityFailure[];
    expectedChecksum?: string;
    observedChecksum?: string;
    message?: string;
  },
): ErrorEnvelope {
  return {
    error: {
      code: "integrity_failed",
      category: "integrity",
      operation,
      message: details.message ?? "Artifact integrity verification failed",
      retryable: true,
      requestId,
      details: {
        ...(details.fileFailures && details.fileFailures.length > 0
          ? {
              fileFailures: details.fileFailures.map((f) => ({
                path: f.path,
                expected: f.expected,
                observed: f.observed,
              })),
            }
          : {}),
        ...(details.expectedChecksum ? { expectedChecksum: details.expectedChecksum } : {}),
        ...(details.observedChecksum ? { observedChecksum: details.observedChecksum } : {}),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// JSON checksum verification (for tokens)
// ---------------------------------------------------------------------------

export async function verifyJsonChecksum(
  jsonString: string,
  declared: Checksum,
): Promise<{ valid: boolean; observed: string }> {
  const bytes = new TextEncoder().encode(jsonString);
  const observed = await computeSha256Digest(bytes);
  return { valid: observed === declared.digest, observed };
}
