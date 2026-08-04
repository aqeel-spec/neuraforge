/**
 * Registry-builder tests: MVP inventory validation and reader.
 */

import { describe, it, expect } from "vitest";
import { validateMvpInventory } from "../inventory.js";
import { createRegistryBundleReader } from "../reader.js";
import { buildReleaseBundle } from "../builder.js";
import { buildFixtureInput, FIXTURE_SURFACES } from "./fixtures.js";
import type { RegistryArtifactEntry, RequiredMvpSurface } from "../types.js";

describe("validateMvpInventory", () => {
  it("validates a valid 20-component inventory", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const inventoryResult = validateMvpInventory(
      result.bundle.snapshot.components,
      result.bundle.snapshot.requiredSurfaces,
    );
    expect(inventoryResult.valid).toBe(true);
    expect(inventoryResult.errors).toHaveLength(0);
  });

  it("rejects 14 components (below minimum)", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const inventoryResult = validateMvpInventory(
      result.bundle.snapshot.components.slice(0, 14),
      result.bundle.snapshot.requiredSurfaces,
    );
    expect(inventoryResult.valid).toBe(false);
    expect(inventoryResult.errors.some((e) => e.code === "too_few_components")).toBe(true);
  });

  it("accepts 15 components (minimum boundary)", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const inventoryResult = validateMvpInventory(
      result.bundle.snapshot.components.slice(0, 15),
      result.bundle.snapshot.requiredSurfaces,
    );
    const countError = inventoryResult.errors.find((e) => e.code === "too_few_components");
    expect(countError).toBeUndefined();
  });

  it("accepts 20 components (maximum boundary)", async () => {
    const input = await buildFixtureInput({ componentCount: 20 });
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const inventoryResult = validateMvpInventory(
      result.bundle.snapshot.components,
      result.bundle.snapshot.requiredSurfaces,
    );
    const countError = inventoryResult.errors.find(
      (e) => e.code === "too_few_components" || e.code === "too_many_components",
    );
    expect(countError).toBeUndefined();
  });

  it("rejects 21 components before a bundle can be emitted", async () => {
    const input = await buildFixtureInput({ componentCount: 21 });
    const result = await buildReleaseBundle(input);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((error) => error.code === "too_many_components")).toBe(true);
  });

  it("rejects missing category", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const filtered = result.bundle.snapshot.components.filter((c) => c.category !== "marketing");

    const inventoryResult = validateMvpInventory(filtered, result.bundle.snapshot.requiredSurfaces);
    expect(inventoryResult.valid).toBe(false);
    expect(inventoryResult.errors.some((e) => e.code === "missing_category")).toBe(true);
  });

  it("rejects missing required surface", () => {
    const components: RegistryArtifactEntry[] = [];
    const surfaces = FIXTURE_SURFACES.filter((s) => s.surfaceId !== "mcp-server");
    const inventoryResult = validateMvpInventory(components, surfaces);
    expect(inventoryResult.valid).toBe(false);
    expect(inventoryResult.errors.some((e) => e.code === "missing_surface")).toBe(true);
  });

  it("rejects duplicate surface", () => {
    const components: RegistryArtifactEntry[] = [];
    const surfaces: RequiredMvpSurface[] = [
      ...FIXTURE_SURFACES,
      { surfaceId: "registry", publicSourceLocation: "https://x", buildCommand: "npm build" },
    ];
    const inventoryResult = validateMvpInventory(components, surfaces);
    expect(inventoryResult.valid).toBe(false);
    expect(inventoryResult.errors.some((e) => e.code === "duplicate_surface")).toBe(true);
  });
});

describe("RegistryBundleReader", () => {
  it("creates a verified reader from a valid bundle", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    expect(readerResult.value.verifiedSnapshot).toBe(true);
  });

  it("getSnapshot returns the full snapshot", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const snapshot = readerResult.value.getSnapshot();
    expect(snapshot.releaseVersion).toBe("1.0.0");
    expect(snapshot.components.length).toBe(20);
  });

  it("listComponents returns all summaries", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const summaries = readerResult.value.listComponents();
    expect(summaries.length).toBe(20);
    const first = summaries[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.stableId).toBeDefined();
      expect(first.checksum).toBeDefined();
    }
  });

  it("listComponents filters by category", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const navComponents = readerResult.value.listComponents("navigation");
    expect(navComponents.length).toBe(4);
    expect(navComponents.every((c) => c.category === "navigation")).toBe(true);
  });

  it("getComponent returns component with source content", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const componentResult = readerResult.value.getComponent("navbar", "1.0.0");
    expect(componentResult.ok).toBe(true);
    if (!componentResult.ok) return;

    expect(componentResult.value.ref.stableId).toBe("navbar");
    const firstFile = componentResult.value.sourceFiles[0];
    expect(firstFile).toBeDefined();
    if (firstFile) {
      expect(firstFile.content.length).toBeGreaterThan(0);
    }
  });

  it("getComponent returns not-found with alternatives for unknown version", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const componentResult = readerResult.value.getComponent("navbar", "99.0.0");
    expect(componentResult.ok).toBe(false);
    if (componentResult.ok) return;

    expect(componentResult.error.code).toBe("not_found");
    expect(componentResult.error.alternatives.length).toBeGreaterThan(0);
    const firstAlt = componentResult.error.alternatives[0];
    expect(firstAlt).toBeDefined();
    if (firstAlt) {
      expect(firstAlt.stableId).toBe("navbar");
    }
  });

  it("getTokenArtifact returns token for matching version", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const tokenResult = readerResult.value.getTokenArtifact("1.0.0");
    expect(tokenResult.ok).toBe(true);
    if (!tokenResult.ok) return;
    expect(tokenResult.value.tokenDocument.tokens).toBeDefined();
  });

  it("getTokenArtifact returns not-found for unknown version", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const readerResult = await createRegistryBundleReader(result.bundle);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const tokenResult = readerResult.value.getTokenArtifact("99.0.0");
    expect(tokenResult.ok).toBe(false);
    if (tokenResult.ok) return;
    expect(tokenResult.error.code).toBe("not_found");
    expect(tokenResult.error.alternatives.length).toBeGreaterThan(0);
  });

  it("rejects a tampered bundle during reader creation", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    const firstComp = tampered.snapshot.components[0];
    if (firstComp) {
      const firstFile = firstComp.sourceFiles[0];
      if (firstFile) {
        (firstFile as { content: string }).content = "// hacked";
      }
    }

    const readerResult = await createRegistryBundleReader(tampered);
    expect(readerResult.ok).toBe(false);
    if (readerResult.ok) return;
    expect(readerResult.error.code).toBe("integrity_verification_failed");
  });
});
