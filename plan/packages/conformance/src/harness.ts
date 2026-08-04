/**
 * runMvpConformance — the main entrypoint for the conformance harness.
 *
 * Verifies the bundle first. If bundle is tampered/unverified, returns a failed report.
 * Runs all deterministic named cases and returns a JSON-safe ConformanceReport.
 */

import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import { verifyReleaseBundle } from "@neuraforge-ui/registry-builder";
import type { ConformanceAdapters, ConformanceReport } from "./types.js";
import { createDefaultAdapters } from "./adapters.js";
import { CASE_RUNNERS, CONFORMANCE_CASE_NAMES } from "./cases.js";

/**
 * Runs the full MVP conformance suite against one bundle.
 *
 * @param bundle - The immutable release bundle to test against.
 * @param adapters - Optional custom adapters. If not provided, default adapters are
 *                   created from the bundle using registry-builder, public-api, and mcp-core.
 * @returns A JSON-safe ConformanceReport with per-case results.
 */
export async function runMvpConformance(
  bundle: ReleaseBundle,
  adapters?: ConformanceAdapters,
): Promise<ConformanceReport> {
  // Verify bundle integrity first — tampered bundles never pass
  const verification = await verifyReleaseBundle(bundle);
  if (!verification.valid) {
    return {
      schemaVersion: "1.0.0",
      bundleAddress: bundle.bundleAddress,
      bundleChecksum: bundle.bundleChecksum.digest,
      totalCases: CONFORMANCE_CASE_NAMES.length,
      passed: 0,
      failed: CONFORMANCE_CASE_NAMES.length,
      cases: CONFORMANCE_CASE_NAMES.map((caseName) => ({
        caseName,
        passed: false,
        mismatchDetails: [
          {
            path: "/bundle/integrity",
            expected: "verified",
            actual: `${String(verification.mismatches.length)} mismatch(es): ${verification.mismatches.map((m) => m.path).join(", ")}`,
          },
        ],
      })),
    };
  }

  // Create or use provided adapters
  const resolvedAdapters = adapters ?? (await createDefaultAdapters(bundle));

  // Run all cases deterministically
  const caseResults = [];
  for (const caseName of CONFORMANCE_CASE_NAMES) {
    const runner = CASE_RUNNERS.get(caseName);
    if (!runner) {
      caseResults.push({
        caseName,
        passed: false,
        mismatchDetails: [{ path: "/runner", expected: "defined", actual: "missing" }],
      });
      continue;
    }

    try {
      const result = await runner(bundle, resolvedAdapters);
      caseResults.push(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown error";
      caseResults.push({
        caseName,
        passed: false,
        mismatchDetails: [{ path: "/execution", expected: "no throw", actual: message }],
      });
    }
  }

  const passedCount = caseResults.filter((c) => c.passed).length;
  const failedCount = caseResults.filter((c) => !c.passed).length;

  return {
    schemaVersion: "1.0.0",
    bundleAddress: bundle.bundleAddress,
    bundleChecksum: bundle.bundleChecksum.digest,
    totalCases: caseResults.length,
    passed: passedCount,
    failed: failedCount,
    cases: caseResults,
  };
}
