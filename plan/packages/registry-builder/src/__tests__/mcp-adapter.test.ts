/**
 * Registry-builder tests: MCP catalog provider adapter.
 */

import { describe, it, expect } from "vitest";
import { buildReleaseBundle } from "../builder.js";
import { createMcpCatalogProvider } from "../mcp-adapter.js";
import { buildFixtureInput } from "./fixtures.js";

describe("createMcpCatalogProvider", () => {
  it("creates a verified provider from a valid bundle", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;
    expect(providerResult.value.verifiedSnapshot).toBe(true);
  });

  it("list_components returns all components", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const listResult = await providerResult.value.listComponents("1.0.0");
    expect(listResult.ok).toBe(true);
    if (!listResult.ok) return;
    expect(listResult.value.length).toBe(20);
  });

  it("list_components filters by category", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const listResult = await providerResult.value.listComponents("1.0.0", "feedback");
    expect(listResult.ok).toBe(true);
    if (!listResult.ok) return;
    expect(listResult.value.length).toBe(4);
    expect(listResult.value.every((c) => c.category === "feedback")).toBe(true);
  });

  it("get_component returns component with source files", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const getResult = await providerResult.value.getComponent("1.0.0", "navbar", "1.0.0");
    expect(getResult.ok).toBe(true);
    if (!getResult.ok) return;
    expect(getResult.value.stableId).toBe("navbar");
    expect(getResult.value.sourceFiles.length).toBeGreaterThan(0);
    const firstFile = getResult.value.sourceFiles[0];
    expect(firstFile).toBeDefined();
    if (firstFile) {
      expect(firstFile.content.length).toBeGreaterThan(0);
    }
  });

  it("get_component returns error for unknown component", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const getResult = await providerResult.value.getComponent("1.0.0", "nonexistent", "1.0.0");
    expect(getResult.ok).toBe(false);
    if (getResult.ok) return;
    expect(getResult.error.code).toBe("not_found");
  });

  it("search_components returns all components for ranking", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const searchResult = await providerResult.value.getComponentsForSearch("1.0.0");
    expect(searchResult.ok).toBe(true);
    if (!searchResult.ok) return;
    expect(searchResult.value.length).toBe(20);
  });

  it("get_design_tokens returns token artifact", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const tokenResult = await providerResult.value.getDesignTokens("1.0.0", "1.0.0");
    expect(tokenResult.ok).toBe(true);
    if (!tokenResult.ok) return;
    expect(tokenResult.value.tokenDocument.tokens).toBeDefined();
    expect(tokenResult.value.checksum.algorithm).toBe("sha256");
  });

  it("get_design_tokens returns error for unknown version", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const tokenResult = await providerResult.value.getDesignTokens("1.0.0", "99.0.0");
    expect(tokenResult.ok).toBe(false);
  });

  it("getPublishedTokenVersions returns available versions", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const versionsResult = await providerResult.value.getPublishedTokenVersions("1.0.0");
    expect(versionsResult.ok).toBe(true);
    if (!versionsResult.ok) return;
    expect(versionsResult.value).toContain("1.0.0");
  });

  it("getPublishedComponentRefs returns refs for known component", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const providerResult = await createMcpCatalogProvider(result.bundle);
    expect(providerResult.ok).toBe(true);
    if (!providerResult.ok) return;

    const refsResult = await providerResult.value.getPublishedComponentRefs("1.0.0", "navbar");
    expect(refsResult.ok).toBe(true);
    if (!refsResult.ok) return;
    expect(refsResult.value.length).toBeGreaterThan(0);
    const firstRef = refsResult.value[0];
    expect(firstRef).toBeDefined();
    if (firstRef) {
      expect(firstRef.stableId).toBe("navbar");
    }
  });

  it("rejects a tampered bundle", async () => {
    const input = await buildFixtureInput();
    const result = await buildReleaseBundle(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const tampered = JSON.parse(JSON.stringify(result.bundle)) as typeof result.bundle;
    const firstComp = tampered.snapshot.components[0];
    if (firstComp) {
      const firstFile = firstComp.sourceFiles[0];
      if (firstFile) {
        (firstFile as { content: string }).content = "TAMPERED";
      }
    }

    const providerResult = await createMcpCatalogProvider(tampered);
    expect(providerResult.ok).toBe(false);
  });
});
