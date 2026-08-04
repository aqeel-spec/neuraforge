/**
 * Registry-builder tests: verification.
 */

import { describe, it, expect } from "vitest";
import { buildReleaseBundle } from "../builder.js";
import { verifyReleaseBundle } from "../verify.js";
import { buildFixtureInput } from "./fixtures.js";

describe("verifyReleaseBundle", () => {
  it("verifies a valid bundle successfully", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const verification = await verifyReleaseBundle(result.bundle);
    expect(verification.valid).toBe(true);
    expect(verification.mismatches).toHaveLength(0);
  });

  it("detects changed source content", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Create a tampered bundle by deep-copying and modifying source content
    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    const firstComponent = tampered.snapshot.components[0];
    if (firstComponent) {
      const firstFile = firstComponent.sourceFiles[0];
      if (firstFile) {
        (firstFile as { content: string }).content = "// tampered";
      }
    }

    const verification = await verifyReleaseBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.mismatches.length).toBeGreaterThan(0);
    expect(verification.mismatches.some((m) => m.path.includes("checksum"))).toBe(true);
  });

  it("detects a changed component artifact checksum independently", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    const firstComponent = tampered.snapshot.components[0];
    if (!firstComponent) throw new Error("fixture requires a component");
    (firstComponent.checksum as { digest: string }).digest = "f".repeat(64);

    const verification = await verifyReleaseBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(
      verification.mismatches.some(
        (mismatch) => mismatch.path === `components/${firstComponent.ref.stableId}/checksum`,
      ),
    ).toBe(true);
  });

  it("detects changed token document", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    (tampered.snapshot.tokenArtifact.tokenDocument as { releaseVersion: string }).releaseVersion =
      "9.9.9";

    const verification = await verifyReleaseBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.mismatches.some((m) => m.path.includes("token"))).toBe(true);
  });

  it("detects changed snapshot checksum", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    (tampered.snapshot as { registryVersion: string }).registryVersion = "9.9.9";

    const verification = await verifyReleaseBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.mismatches.some((m) => m.path.includes("snapshot"))).toBe(true);
  });

  it("detects changed bundle address", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    (tampered as { bundleAddress: string }).bundleAddress = "sha256:" + "f".repeat(64);

    const verification = await verifyReleaseBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.mismatches.some((m) => m.path.includes("bundleAddress"))).toBe(true);
  });

  it("never throws on null/undefined input", async () => {
    const result1 = await verifyReleaseBundle(null);
    expect(result1.valid).toBe(false);

    const result2 = await verifyReleaseBundle(undefined);
    expect(result2.valid).toBe(false);

    const result3 = await verifyReleaseBundle("not an object");
    expect(result3.valid).toBe(false);
  });

  it("never throws on malformed objects", async () => {
    const result = await verifyReleaseBundle({ manifest: null, snapshot: null });
    expect(result.valid).toBe(false);
  });
});
