/**
 * Backup and restore — deterministic, JSON-safe, versioned.
 *
 * BackupArchive contains sanitized config (credential refs okay, never secret bytes),
 * exact bundle, archive checksum over canonical payload, explicit createdAt.
 */

import type { Result } from "@neuraforge-ui/schemas";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import { toJsonValue, verifyReleaseBundle } from "@neuraforge-ui/registry-builder";
import { canonicalizeJson, computeSha256Digest } from "@neuraforge-ui/catalog-core";
import type { SelfHostConfig } from "./config-types.js";
import type { PreparedRuntime, PrepareError } from "./prepare.js";
import { prepareSelfHostedRuntime } from "./prepare.js";

export interface BackupArchive {
  readonly schemaVersion: "1.0.0";
  readonly createdAt: string;
  readonly config: SelfHostConfig;
  readonly bundle: ReleaseBundle;
  readonly archiveChecksum: string;
}

export interface RestoreResult {
  readonly prepared: PreparedRuntime;
  readonly mismatches: readonly string[];
}

/**
 * Creates a deterministic backup archive.
 * createdAt is explicitly supplied by the caller — no Date.now.
 */
export async function createBackup(
  config: SelfHostConfig,
  bundle: ReleaseBundle,
  createdAt: string,
): Promise<BackupArchive> {
  // Compute checksum over canonical payload (config + bundle sans checksum field)
  const payload = toJsonValue({
    schemaVersion: "1.0.0",
    createdAt,
    config,
    bundle,
  });
  const canonical = canonicalizeJson(payload);
  const bytes = new TextEncoder().encode(canonical);
  const checksum = await computeSha256Digest(bytes);

  return {
    schemaVersion: "1.0.0",
    createdAt,
    config,
    bundle,
    archiveChecksum: checksum,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Restores from a backup archive. Validates shape, checksum, and bundle.
 * Never exposes runtime on failure.
 */
export async function restoreBackup(
  archiveUnknown: unknown,
): Promise<Result<RestoreResult, PrepareError>> {
  const mismatches: string[] = [];

  if (!isRecord(archiveUnknown)) {
    return {
      ok: false,
      error: {
        code: "invalid_archive",
        message: "Archive must be an object",
        errors: [
          {
            code: "invalid_type",
            path: "/",
            constraint: "object",
            guidance: "Provide a valid backup archive",
          },
        ],
      },
    };
  }

  // Validate closed shape
  const knownFields = new Set([
    "schemaVersion",
    "createdAt",
    "config",
    "bundle",
    "archiveChecksum",
  ]);
  for (const key of Object.keys(archiveUnknown)) {
    if (!knownFields.has(key)) {
      mismatches.push(`Unknown field: ${key}`);
    }
  }

  if (archiveUnknown.schemaVersion !== "1.0.0") {
    return {
      ok: false,
      error: {
        code: "invalid_schema_version",
        message: "Archive schema version must be 1.0.0",
        errors: [
          {
            code: "invalid_version",
            path: "/schemaVersion",
            constraint: "1.0.0",
            guidance: "Use archive schema version 1.0.0",
          },
        ],
      },
    };
  }

  const declaredChecksum = archiveUnknown.archiveChecksum;
  if (typeof declaredChecksum !== "string") {
    return {
      ok: false,
      error: {
        code: "missing_checksum",
        message: "Archive checksum is required",
        errors: [
          {
            code: "missing",
            path: "/archiveChecksum",
            constraint: "string",
            guidance: "Archive must include a checksum",
          },
        ],
      },
    };
  }

  // Recompute archive checksum
  const payload = toJsonValue({
    schemaVersion: "1.0.0",
    createdAt: archiveUnknown.createdAt,
    config: archiveUnknown.config,
    bundle: archiveUnknown.bundle,
  });
  const canonical = canonicalizeJson(payload);
  const bytes = new TextEncoder().encode(canonical);
  const recomputed = await computeSha256Digest(bytes);

  if (recomputed !== declaredChecksum) {
    return {
      ok: false,
      error: {
        code: "checksum_mismatch",
        message: `Archive checksum mismatch: expected ${declaredChecksum}, got ${recomputed}`,
        errors: [
          {
            code: "checksum_mismatch",
            path: "/archiveChecksum",
            constraint: declaredChecksum,
            guidance: "Archive has been tampered with or corrupted",
          },
        ],
      },
    };
  }

  // Verify bundle
  const bundle = archiveUnknown.bundle as ReleaseBundle;
  const bundleVerification = await verifyReleaseBundle(bundle);
  if (!bundleVerification.valid) {
    return {
      ok: false,
      error: {
        code: "bundle_verification_failed",
        message: `Bundle verification failed: ${bundleVerification.mismatches.map((m) => m.path).join(", ")}`,
        errors: bundleVerification.mismatches.map((m) => ({
          code: "bundle_mismatch",
          path: m.path,
          constraint: m.expected,
          guidance: `Got: ${m.actual}`,
        })),
      },
    };
  }

  // Prepare runtime from restored config and bundle
  const config = archiveUnknown.config;
  const prepareResult = await prepareSelfHostedRuntime(config, bundle);
  if (!prepareResult.ok) {
    return prepareResult;
  }

  return {
    ok: true,
    value: {
      prepared: prepareResult.value,
      mismatches,
    },
  };
}
