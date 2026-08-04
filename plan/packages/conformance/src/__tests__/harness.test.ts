/**
 * Conformance harness unit tests.
 *
 * Validates:
 * 1. Valid fixture bundle — all cases pass
 * 2. Tampered bundle — fails closed (all cases fail)
 * 3. Deliberately divergent adapter — identifies exact failed case
 * 4. Repeated run — byte-equivalent report
 */

import { describe, it, expect, beforeAll } from "vitest";
import { buildReleaseBundle } from "@neuraforge/registry-builder";
import type { ReleaseBundle } from "@neuraforge/registry-builder";
import { buildFixtureInput } from "@neuraforge/registry-builder/testing";
import { runMvpConformance, CONFORMANCE_CASE_NAMES } from "../index.js";
import { canonicalizeJson } from "@neuraforge/catalog-core";
import { toJsonValue } from "@neuraforge/registry-builder";
import type { ConformanceAdapters } from "../types.js";
import { createDefaultAdapters } from "../adapters.js";

async function buildValidBundle(): Promise<ReleaseBundle> {
  const input = await buildFixtureInput({ componentCount: 20, withApproval: true });
  const result = await buildReleaseBundle(input);
  if (!result.success) {
    throw new Error(`Fixture build failed: ${result.errors.map((e) => e.guidance).join(", ")}`);
  }
  return result.bundle;
}

describe("conformance harness", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildValidBundle();
  }, 30_000);

  it("all cases pass on a valid 20-component fixture bundle", async () => {
    const report = await runMvpConformance(validBundle);
    expect(report.schemaVersion).toBe("1.0.0");
    expect(report.bundleAddress).toBe(validBundle.bundleAddress);
    expect(report.totalCases).toBe(CONFORMANCE_CASE_NAMES.length);

    const failedCases = report.cases.filter((c) => !c.passed);
    if (failedCases.length > 0) {
      const details = failedCases.map(
        (c) =>
          `${c.caseName}: ${c.mismatchDetails.map((m) => `${m.path} expected=${m.expected} actual=${m.actual}`).join("; ")}`,
      );
      expect.fail(`Failed cases:\n${details.join("\n")}`);
    }

    expect(report.passed).toBe(report.totalCases);
    expect(report.failed).toBe(0);
  }, 30_000);

  it("tampered bundle fails closed — all cases fail", async () => {
    // Tamper the bundle by mutating a source file content
    const tampered = JSON.parse(JSON.stringify(validBundle)) as typeof validBundle;
    const firstComponent = tampered.snapshot.components[0];
    if (firstComponent) {
      const firstFile = firstComponent.sourceFiles[0];
      if (firstFile) {
        (firstFile as { content: string }).content = "// tampered content\n";
      }
    }

    const report = await runMvpConformance(tampered);
    expect(report.failed).toBe(report.totalCases);
    expect(report.passed).toBe(0);

    // Every case should mention bundle integrity
    for (const caseResult of report.cases) {
      expect(caseResult.passed).toBe(false);
      expect(caseResult.mismatchDetails.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("divergent adapter identifies exact failed case", async () => {
    // Create adapters but make the MCP adapter return wrong data for get_component
    const realAdapters = await createDefaultAdapters(validBundle);

    const divergentAdapters: ConformanceAdapters = {
      registry: realAdapters.registry,
      publicApi: realAdapters.publicApi,
      mcp: {
        async dispatch(operation, input, context) {
          if (operation === "get_component") {
            // Return a fake success with wrong checksum
            return toJsonValue({
              ok: true,
              value: { stableId: "wrong", checksum: { digest: "0".repeat(64) } },
            });
          }
          return realAdapters.mcp.dispatch(operation, input, context);
        },
      },
    };

    const report = await runMvpConformance(validBundle, divergentAdapters);

    // The component parity case should fail
    const parityCase = report.cases.find((c) => c.caseName === "component_parity_registry_api_mcp");
    expect(parityCase).toBeDefined();
    expect(parityCase?.passed).toBe(false);

    // The mcp_get_component case should also fail (wrong stableId)
    const mcpGetCase = report.cases.find((c) => c.caseName === "mcp_get_component");
    expect(mcpGetCase).toBeDefined();
    expect(mcpGetCase?.passed).toBe(false);

    // Other unrelated cases should still pass
    const listCase = report.cases.find((c) => c.caseName === "mcp_list_components");
    expect(listCase?.passed).toBe(true);
  }, 30_000);

  it("repeated runs produce byte-equivalent reports", async () => {
    const report1 = await runMvpConformance(validBundle);
    const report2 = await runMvpConformance(validBundle);

    const canonical1 = canonicalizeJson(toJsonValue(report1));
    const canonical2 = canonicalizeJson(toJsonValue(report2));

    expect(canonical1).toBe(canonical2);
  }, 30_000);
});
