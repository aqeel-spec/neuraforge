/**
 * upgradeRuntime / rollbackUpgrade — semver progression, no mutation/global singleton.
 *
 * Verifies new bundle, ensures explicit semver progression (no same/downgrade unless rollback).
 * Returns state retaining previous verified bundle for rollback.
 */

import type { Result } from "@neuraforge/schemas";
import type { ReleaseBundle } from "@neuraforge/registry-builder";
import { verifyReleaseBundle } from "@neuraforge/registry-builder";
import { compareSemanticVersions } from "@neuraforge/catalog-core";
import type { PreparedRuntime, PrepareError } from "./prepare.js";
import { prepareSelfHostedRuntime } from "./prepare.js";

export interface UpgradeState {
  readonly current: PreparedRuntime;
  readonly previous: PreparedRuntime;
  readonly previousBundle: ReleaseBundle;
}

/**
 * Upgrades a runtime to a new bundle. Verifies new bundle first.
 * Ensures explicit semver progression (no same/downgrade).
 * Returns state retaining previous for rollback. No mutation.
 */
export async function upgradeRuntime(
  current: PreparedRuntime,
  newBundle: ReleaseBundle,
): Promise<Result<UpgradeState, PrepareError>> {
  // 1. Verify new bundle
  const verification = await verifyReleaseBundle(newBundle);
  if (!verification.valid) {
    return {
      ok: false,
      error: {
        code: "bundle_verification_failed",
        message: `New bundle verification failed: ${verification.mismatches.map((m) => m.path).join(", ")}`,
        errors: verification.mismatches.map((m) => ({
          code: "bundle_mismatch",
          path: m.path,
          constraint: m.expected,
          guidance: `Got: ${m.actual}`,
        })),
      },
    };
  }

  // 2. Ensure semver progression
  const currentVersion = current.bundle.snapshot.releaseVersion;
  const newVersion = newBundle.snapshot.releaseVersion;
  const comparison = compareSemanticVersions(newVersion, currentVersion);

  if (comparison <= 0) {
    return {
      ok: false,
      error: {
        code: "version_not_progressing",
        message: `New version ${newVersion} must be greater than current ${currentVersion}`,
        errors: [
          {
            code: "semver_regression",
            path: "/releaseVersion",
            constraint: `must be > ${currentVersion}`,
            guidance: `Got ${newVersion} which is not a forward progression`,
          },
        ],
      },
    };
  }

  // 3. Prepare new runtime with same config
  const prepareResult = await prepareSelfHostedRuntime(current.config, newBundle);
  if (!prepareResult.ok) {
    return prepareResult;
  }

  return {
    ok: true,
    value: {
      current: prepareResult.value,
      previous: current,
      previousBundle: current.bundle,
    },
  };
}

/**
 * Rolls back to the previous runtime state. Verifies previous bundle checksums.
 * No mutation/global singleton.
 */
export async function rollbackUpgrade(
  state: UpgradeState,
): Promise<Result<PreparedRuntime, PrepareError>> {
  // Verify previous bundle is still intact
  const verification = await verifyReleaseBundle(state.previousBundle);
  if (!verification.valid) {
    return {
      ok: false,
      error: {
        code: "rollback_verification_failed",
        message: `Previous bundle verification failed during rollback: ${verification.mismatches.map((m) => m.path).join(", ")}`,
        errors: verification.mismatches.map((m) => ({
          code: "bundle_mismatch",
          path: m.path,
          constraint: m.expected,
          guidance: `Got: ${m.actual}`,
        })),
      },
    };
  }

  return { ok: true, value: state.previous };
}
