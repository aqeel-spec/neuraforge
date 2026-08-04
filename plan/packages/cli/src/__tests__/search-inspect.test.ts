/**
 * Search and inspect tests.
 *
 * Tests deterministic search, exact behavior, not-found alternatives.
 */

import { describe, it, expect, beforeAll } from "vitest";
import type { RegistryBundleReader } from "@neuraforge/registry-builder";
import { SEARCH_RULE_VERSION } from "@neuraforge/mcp-core";
import { createInstaller } from "../installer.js";
import type { Installer } from "../installer.js";
import { createMockReader } from "./fixtures.js";

describe("search", () => {
  let reader: RegistryBundleReader;
  let installer: Installer;

  beforeAll(async () => {
    reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  it("returns results for matching query", () => {
    const result = installer.search("button");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.results.length).toBeGreaterThan(0);
    expect(result.value.results[0]?.stableId).toBe("button");
    expect(result.value.ruleVersion).toBe(SEARCH_RULE_VERSION);
  });

  it("is deterministic — same input produces same output", () => {
    const r1 = installer.search("button");
    const r2 = installer.search("button");
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it("returns empty results for no match", () => {
    const result = installer.search("zzz-nonexistent-xyz");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.results).toHaveLength(0);
  });

  it("rejects empty query", () => {
    const result = installer.search("");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("matches by tag", () => {
    const result = installer.search("interactive");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.results.length).toBeGreaterThan(0);
    expect(result.value.results[0]?.stableId).toBe("button");
  });

  it("matches by category", () => {
    const result = installer.search("forms");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.results.length).toBeGreaterThan(0);
  });

  it("includes explanations in results", () => {
    const result = installer.search("button");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.results[0]?.explanations.length).toBeGreaterThan(0);
  });
});

describe("inspect", () => {
  let installer: Installer;

  beforeAll(async () => {
    const reader = await createMockReader();
    const result = createInstaller(reader);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    installer = result.value;
  });

  it("returns full metadata for exact stableId+version", () => {
    const result = installer.inspect("button", "1.0.0");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.value.stableId).toBe("button");
    expect(result.value.version).toBe("1.0.0");
    expect(result.value.name).toBe("Button");
    expect(result.value.registryLocation).toBe("registry/components/button/1.0.0");
    expect(result.value.sourceFiles.length).toBe(2);
    expect(result.value.dependencies.length).toBe(1);
    expect(result.value.compatibility.length).toBe(1);
    expect(result.value.provenance.length).toBe(1);
    expect(result.value.installation.length).toBe(2);
  });

  it("returns not_found with alternatives for unknown version", () => {
    const result = installer.inspect("button", "99.0.0");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("not_found");
    expect(result.error.alternatives).toBeDefined();
    const alternatives = result.error.alternatives ?? [];
    expect(alternatives.length).toBeGreaterThan(0);
    expect(alternatives[0]?.version).toBe("1.0.0");
  });

  it("returns not_found for unknown stableId", () => {
    const result = installer.inspect("nonexistent", "1.0.0");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("not_found");
  });

  it("rejects empty stableId", () => {
    const result = installer.inspect("", "1.0.0");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });

  it("rejects empty version", () => {
    const result = installer.inspect("button", "");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_error");
  });
});
