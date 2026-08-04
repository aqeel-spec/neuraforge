/**
 * verifyRuntimeIntegrity — reports every mismatch from registry-builder verifier.
 */

import type { ReleaseBundle, VerificationResult } from "@neuraforge/registry-builder";
import { verifyReleaseBundle } from "@neuraforge/registry-builder";
import type { PreparedRuntime } from "./prepare.js";

function isPreparedRuntime(value: PreparedRuntime | ReleaseBundle): value is PreparedRuntime {
  return "bundle" in value && "config" in value;
}

/**
 * Verifies the integrity of a runtime or bundle.
 * Reports every mismatch detected by the registry-builder verifier.
 */
export async function verifyRuntimeIntegrity(
  runtimeOrBundle: PreparedRuntime | ReleaseBundle,
): Promise<VerificationResult> {
  const bundle = isPreparedRuntime(runtimeOrBundle) ? runtimeOrBundle.bundle : runtimeOrBundle;
  return verifyReleaseBundle(bundle);
}
