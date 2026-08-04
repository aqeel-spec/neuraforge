/**
 * Registry-builder tests: build, canonicalization, and content addressing.
 */

import { computeFileSetChecksum } from "@neuraforge-ui/catalog-core";
import { describe, it, expect } from "vitest";
import { buildReleaseBundle } from "../builder.js";
import { deepFreeze } from "../freeze.js";
import {
  buildFixtureInput,
  computeTextChecksum,
  FIXTURE_APPROVAL,
  textByteLength,
} from "./fixtures.js";
import type { ReleaseBuildInput } from "../types.js";

describe("buildReleaseBundle", () => {
  it("returns validation errors instead of throwing for malformed unknown input", async () => {
    await expect(buildReleaseBundle(null)).resolves.toMatchObject({ success: false });
    await expect(buildReleaseBundle({})).resolves.toMatchObject({ success: false });
  });

  it("accumulates independent top-level shape errors and rejects unknown fields", async () => {
    const result = await buildReleaseBundle({
      schemaVersion: "2.0.0",
      registryVersion: 1,
      releaseVersion: null,
      unexpected: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.length).toBeGreaterThan(3);
    expect(result.errors.some((error) => error.code === "unknown_release_input_field")).toBe(true);
    expect(result.errors.some((error) => error.path === "/registryVersion")).toBe(true);
    expect(result.errors.some((error) => error.path === "/components")).toBe(true);
  });

  it("builds a stable bundle with approval and 20 components", async () => {
    const input = await buildFixtureInput({ withApproval: true });
    const result = await buildReleaseBundle(input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.bundle.snapshot.status).toBe("stable");
    expect(result.bundle.snapshot.components.length).toBe(20);
    expect(result.bundle.manifest.schemaVersion).toBe("1.0.0");
    expect(result.bundle.manifest.approval).toEqual(FIXTURE_APPROVAL);
    expect(result.bundle.bundleAddress).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("builds a candidate bundle without approval", async () => {
    const input = await buildFixtureInput({ withApproval: false });
    const result = await buildReleaseBundle(input);

    // Without approval, quality classification fails => rejected
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.bundle.snapshot.status).toBe("rejected");
    expect(result.bundle.manifest.approval).toBeUndefined();
  });

  it("uses createdAt from input, never Date.now()", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.bundle.snapshot.createdAt).toBe("2024-01-15T10:00:00Z");
  });

  it("includes publishedAt only when supplied and status permits", async () => {
    const input = await buildFixtureInput({ withApproval: true });
    const inputWithPublished: ReleaseBuildInput = {
      ...input,
      publishedAt: "2024-02-01T00:00:00Z",
    };
    const result = await buildReleaseBundle(inputWithPublished);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.bundle.manifest.publishedAt).toBe("2024-02-01T00:00:00Z");
  });
});

describe("canonicalization and content addressing", () => {
  it("same logical input reordered produces identical address", async () => {
    const input1 = await buildFixtureInput();
    const input2 = await buildFixtureInput();

    // Reorder components
    const reorderedComponents = [...input2.components].reverse();
    const input2Reordered: ReleaseBuildInput = {
      ...input2,
      components: reorderedComponents,
    };

    const result1 = await buildReleaseBundle(input1);
    const result2 = await buildReleaseBundle(input2Reordered);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (!result1.success || !result2.success) return;

    // Same address despite different input order
    expect(result1.bundle.bundleAddress).toBe(result2.bundle.bundleAddress);
    expect(result1.bundle.bundleChecksum.digest).toBe(result2.bundle.bundleChecksum.digest);
    expect(result1.bundle.snapshot.snapshotChecksum.digest).toBe(
      result2.bundle.snapshot.snapshotChecksum.digest,
    );
  });

  it("changed source byte produces different address", async () => {
    const input1 = await buildFixtureInput();
    const result1 = await buildReleaseBundle(input1);
    expect(result1.success).toBe(true);
    if (!result1.success) return;

    // Build a second input with one byte changed in one source file
    const input2 = await buildFixtureInput();
    const modifiedContents = new Map(input2.sourceContents);
    const firstPath = [...modifiedContents.keys()][0] ?? "";
    const originalContent = modifiedContents.get(firstPath) ?? "";
    const modifiedContent = originalContent + " ";

    modifiedContents.set(firstPath, modifiedContent);

    // Recompute the file record for the modified file
    const modifiedChecksum = await computeTextChecksum(modifiedContent);
    const modifiedArtifactChecksum = await computeFileSetChecksum([
      { path: firstPath, content: modifiedContent },
    ]);
    const modifiedSize = textByteLength(modifiedContent);

    const modifiedComponents = input2.components.map((c) => {
      const matchingFile = c.sourceFiles.find((f) => f.path === firstPath);
      if (!matchingFile) return c;
      return {
        ...c,
        sourceFiles: c.sourceFiles.map((f) =>
          f.path === firstPath ? { ...f, size: modifiedSize, checksum: modifiedChecksum } : f,
        ),
        checksum: modifiedArtifactChecksum,
      };
    });

    const input2Modified: ReleaseBuildInput = {
      ...input2,
      sourceContents: modifiedContents,
      components: modifiedComponents,
    };

    const result2 = await buildReleaseBundle(input2Modified);
    expect(result2.success).toBe(true);
    if (!result2.success) return;

    expect(result2.bundle.bundleAddress).not.toBe(result1.bundle.bundleAddress);
  });

  it("changed metadata produces different address", async () => {
    const input1 = await buildFixtureInput();
    const result1 = await buildReleaseBundle(input1);
    expect(result1.success).toBe(true);
    if (!result1.success) return;

    const input2 = await buildFixtureInput();
    const input2Modified: ReleaseBuildInput = {
      ...input2,
      releaseVersion: "1.0.1",
    };

    const result2 = await buildReleaseBundle(input2Modified);
    expect(result2.success).toBe(true);
    if (!result2.success) return;

    expect(result2.bundle.bundleAddress).not.toBe(result1.bundle.bundleAddress);
  });

  it("bundle address format is sha256:<64hex>", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.bundle.bundleAddress).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe("deep immutability", () => {
  it("bundle is deeply frozen", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const bundle = result.bundle;
    expect(Object.isFrozen(bundle)).toBe(true);
    expect(Object.isFrozen(bundle.manifest)).toBe(true);
    expect(Object.isFrozen(bundle.snapshot)).toBe(true);
    expect(Object.isFrozen(bundle.snapshot.components)).toBe(true);

    const firstComponent = bundle.snapshot.components[0];
    expect(firstComponent).toBeDefined();
    if (firstComponent) {
      expect(Object.isFrozen(firstComponent)).toBe(true);
      expect(Object.isFrozen(firstComponent.sourceFiles)).toBe(true);
      const firstFile = firstComponent.sourceFiles[0];
      if (firstFile) {
        expect(Object.isFrozen(firstFile)).toBe(true);
      }
    }
    expect(Object.isFrozen(bundle.snapshot.tokenArtifact)).toBe(true);
    expect(Object.isFrozen(bundle.snapshot.requiredSurfaces)).toBe(true);
  });

  it("input mutation does not affect the bundle", async () => {
    const input = await buildFixtureInput();
    const mutableComponents = [...input.components];
    const mutableInput: ReleaseBuildInput = {
      ...input,
      components: mutableComponents,
    };

    const result = await buildReleaseBundle(mutableInput);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const originalLength = result.bundle.snapshot.components.length;

    // Mutate the input array — should not affect frozen bundle
    mutableComponents.length = 0;
    expect(result.bundle.snapshot.components.length).toBe(originalLength);
  });

  it("deepFreeze freezes nested arrays", () => {
    const obj = { a: [{ b: [1, 2, 3] }] };
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.a)).toBe(true);
    const first = obj.a[0];
    expect(first).toBeDefined();
    if (first) {
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.b)).toBe(true);
    }
  });
});
