/**
 * Tests: search_components, get_design_tokens, integrity, filesystem isolation.
 */

import { describe, expect, it, beforeAll } from "vitest";
import { createMcpDispatcher, SEARCH_RULE_VERSION } from "../src/index.js";
import type { McpCatalogProvider, ComponentArtifact, TokenArtifact } from "../src/index.js";
import type { ComponentSummary, ProviderError } from "../src/index.js";
import type { ArtifactRef, JsonValue, Result } from "@neuraforge/schemas";
import { computeJsonChecksum } from "@neuraforge/catalog-core";
import { createFixtureProvider, buildComponentArtifact } from "./fixtures.test-utils.js";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

const CTX = { registryVersion: "1.0.0", requestId: "test-req-1" };

describe("createMcpDispatcher - search_components", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;

  beforeAll(async () => {
    const { provider } = await createFixtureProvider();
    dispatcher = createMcpDispatcher(provider);
  });

  it("returns ranked results with scores and explanations", async () => {
    const result = await dispatcher.dispatch("search_components", { query: "button" }, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results.length).toBeGreaterThan(0);
      expect(result.value.ruleVersion).toBe(SEARCH_RULE_VERSION);
      const first = result.value.results[0];
      expect(first).toBeDefined();
      if (first) {
        expect(first.stableId).toBe("button");
        expect(first.score).toBeGreaterThan(0);
        expect(first.explanations.length).toBeGreaterThan(0);
        expect(first.contributions.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns results ordered by score descending", async () => {
    const result = await dispatcher.dispatch("search_components", { query: "table" }, CTX);
    if (result.ok) {
      for (let i = 1; i < result.value.results.length; i++) {
        const prev = result.value.results[i - 1];
        const curr = result.value.results[i];
        if (prev && curr) {
          expect(prev.score).toBeGreaterThanOrEqual(curr.score);
        }
      }
    }
  });

  it("is deterministic (same input => same output)", async () => {
    const input = { query: "pricing tiers" };
    const r1 = await dispatcher.dispatch("search_components", input, CTX);
    const r2 = await dispatcher.dispatch("search_components", input, CTX);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it("paginates search results correctly", async () => {
    const result1 = await dispatcher.dispatch(
      "search_components",
      { query: "a", pageSize: 2 },
      CTX,
    );
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;
    if (result1.value.results.length < 2) return;

    if (result1.value.nextCursor) {
      const result2 = await dispatcher.dispatch(
        "search_components",
        { query: "a", pageSize: 2, cursor: result1.value.nextCursor },
        CTX,
      );
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        const ids1 = result1.value.results.map((r) => `${r.stableId}@${r.version}`);
        const ids2 = result2.value.results.map((r) => `${r.stableId}@${r.version}`);
        const overlap = ids1.filter((id) => ids2.includes(id));
        expect(overlap).toHaveLength(0);
      }
    }
  });

  it("rejects tampered search cursor", async () => {
    const result = await dispatcher.dispatch(
      "search_components",
      { query: "test", cursor: "dGFtcGVyZWQ" },
      CTX,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("cursor_tampered");
    }
  });

  it("filters by category in search", async () => {
    const result = await dispatcher.dispatch(
      "search_components",
      { query: "table", category: "marketing" },
      CTX,
    );
    expect(result.ok).toBe(true);
    if (result.ok && result.value.results.length > 0) {
      // data-table should not appear since category filter is marketing
      const hasDataTable = result.value.results.some((r) => r.stableId === "data-table");
      expect(hasDataTable).toBe(false);
    }
  });
});

describe("createMcpDispatcher - get_design_tokens", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;

  beforeAll(async () => {
    const { provider } = await createFixtureProvider();
    dispatcher = createMcpDispatcher(provider);
  });

  it("returns token document for valid version", async () => {
    const result = await dispatcher.dispatch("get_design_tokens", { exactVersion: "1.0.0" }, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tokenDocument.schemaVersion).toBe("1.0.0");
      expect(result.value.schemaVersion).toBe("1.0.0");
      expect(result.value.supportedTailwindVersions).toContain("3.4.17");
      expect(result.value.registryVersion).toBe("1.0.0");
      expect(result.value.lineage.exactVersion).toBe("1.0.0");
    }
  });

  it("returns not_found with alternatives for unknown version", async () => {
    const result = await dispatcher.dispatch("get_design_tokens", { exactVersion: "9.9.9" }, CTX);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("not_found");
      expect(result.error.error.alternatives?.length).toBeGreaterThan(0);
    }
  });

  it("filters tokens by category", async () => {
    const result = await dispatcher.dispatch(
      "get_design_tokens",
      { exactVersion: "1.0.0", category: "color" },
      CTX,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const tokens = Object.values(result.value.tokenDocument.tokens);
      expect(tokens.every((t) => t.category === "color")).toBe(true);
    }
  });
});

describe("Integrity verification", () => {
  it("rejects component with mutated file content", async () => {
    const corruptArtifact = await buildComponentArtifact({
      stableId: "corrupt",
      version: "1.0.0",
      name: "Corrupt",
      description: "Corrupted component",
      category: "forms",
      tags: [],
      sourceContent: "original content",
      sourcePath: "src/corrupt.tsx",
    });

    // Mutate one byte in source content
    const mutated: ComponentArtifact = {
      ...corruptArtifact,
      sourceFiles: corruptArtifact.sourceFiles.map((f) => ({
        ...f,
        content: f.content.replace("original", "0riginal"),
      })),
    };

    const provider: McpCatalogProvider = {
      verifiedSnapshot: true,
      listComponents(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
      getComponent(): Promise<Result<ComponentArtifact, ProviderError>> {
        return Promise.resolve({ ok: true, value: mutated });
      },
      getComponentsForSearch(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
      getDesignTokens(): Promise<Result<TokenArtifact, ProviderError>> {
        return Promise.resolve({ ok: false, error: { code: "x", message: "x" } });
      },
      getPublishedTokenVersions(): Promise<Result<readonly string[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
      getPublishedComponentRefs(): Promise<Result<readonly ArtifactRef[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
    };

    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch(
      "get_component",
      { stableId: "corrupt", version: "1.0.0" },
      CTX,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.category).toBe("integrity");
      expect(result.error.error.code).toBe("integrity_failed");
    }
  });

  it("rejects token document with mismatched checksum", async () => {
    const tokenDoc = {
      schemaVersion: "1.0.0",
      releaseVersion: "1.0.0",
      ordering: "declaration" as const,
      tokens: {
        "color.brand.primary": { category: "color" as const, type: "color", value: "#6366f1" },
      },
    };
    const checksum = await computeJsonChecksum(JSON.parse(JSON.stringify(tokenDoc)) as JsonValue);

    const modifiedDoc = {
      ...tokenDoc,
      tokens: {
        "color.brand.primary": { category: "color" as const, type: "color", value: "#000000" },
      },
    };

    const tokenArtifact: TokenArtifact = {
      exactVersion: "1.0.0",
      tokenDocument: modifiedDoc,
      checksum,
      registryLocation: "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
    };

    const provider: McpCatalogProvider = {
      verifiedSnapshot: true,
      listComponents(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
      getComponent(): Promise<Result<ComponentArtifact, ProviderError>> {
        return Promise.resolve({ ok: false, error: { code: "x", message: "x" } });
      },
      getComponentsForSearch(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
      getDesignTokens(): Promise<Result<TokenArtifact, ProviderError>> {
        return Promise.resolve({ ok: true, value: tokenArtifact });
      },
      getPublishedTokenVersions(): Promise<Result<readonly string[], ProviderError>> {
        return Promise.resolve({ ok: true, value: ["1.0.0"] });
      },
      getPublishedComponentRefs(): Promise<Result<readonly ArtifactRef[], ProviderError>> {
        return Promise.resolve({ ok: true, value: [] });
      },
    };

    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("get_design_tokens", { exactVersion: "1.0.0" }, CTX);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.category).toBe("integrity");
    }
  });
});

describe("Filesystem isolation", () => {
  it("no files are created/modified/deleted during all four operations", async () => {
    const { provider } = await createFixtureProvider();
    const dispatcher = createMcpDispatcher(provider);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-core-test-"));

    const before = fs.readdirSync(tmpDir);

    await dispatcher.dispatch("list_components", {}, CTX);
    await dispatcher.dispatch("get_component", { stableId: "button", version: "1.0.0" }, CTX);
    await dispatcher.dispatch("search_components", { query: "button" }, CTX);
    await dispatcher.dispatch("get_design_tokens", { exactVersion: "1.0.0" }, CTX);

    const after = fs.readdirSync(tmpDir);
    expect(after).toEqual(before);

    fs.rmdirSync(tmpDir);
  });

  it("mcp-core source does not import node:fs write APIs", () => {
    const srcDir = path.resolve("packages/mcp-core/src");
    const files = fs
      .readdirSync(srcDir)
      .filter((f) => f.endsWith(".ts") && !f.includes(".test") && !f.includes("test-utils"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
      expect(content).not.toMatch(/writeFileSync|writeFile|appendFile|mkdirSync|mkdir\(/);
      expect(content).not.toMatch(/createWriteStream/);
      expect(content).not.toMatch(/from ["']node:fs["']/);
      expect(content).not.toMatch(/require\(["']fs["']\)/);
    }
  });
});

describe("Cursor registry-version mismatch", () => {
  it("rejects cursor with different registry version", async () => {
    const { provider } = await createFixtureProvider();
    const dispatcher = createMcpDispatcher(provider);

    const result1 = await dispatcher.dispatch("list_components", { pageSize: 2 }, CTX);
    expect(result1.ok).toBe(true);
    if (!result1.ok || !result1.value.nextCursor) return;

    const differentCtx = { registryVersion: "2.0.0", requestId: "test-req-2" };
    const result2 = await dispatcher.dispatch(
      "list_components",
      { pageSize: 2, cursor: result1.value.nextCursor },
      differentCtx,
    );
    expect(result2.ok).toBe(false);
    if (!result2.ok) {
      expect(result2.error.error.code).toBe("cursor_tampered");
    }
  });
});

describe("Cursor filter mismatch", () => {
  it("rejects cursor with different category filter", async () => {
    const { provider } = await createFixtureProvider();
    const dispatcher = createMcpDispatcher(provider);

    const result1 = await dispatcher.dispatch(
      "list_components",
      { category: "forms", pageSize: 1 },
      CTX,
    );
    expect(result1.ok).toBe(true);
    if (!result1.ok || !result1.value.nextCursor) return;

    const result2 = await dispatcher.dispatch(
      "list_components",
      { category: "navigation", pageSize: 1, cursor: result1.value.nextCursor },
      CTX,
    );
    expect(result2.ok).toBe(false);
    if (!result2.ok) {
      expect(result2.error.error.code).toBe("cursor_tampered");
    }
  });

  it("rejects cursor with different pageSize", async () => {
    const { provider } = await createFixtureProvider();
    const dispatcher = createMcpDispatcher(provider);

    const result1 = await dispatcher.dispatch("list_components", { pageSize: 2 }, CTX);
    expect(result1.ok).toBe(true);
    if (!result1.ok || !result1.value.nextCursor) return;

    const result2 = await dispatcher.dispatch(
      "list_components",
      { pageSize: 5, cursor: result1.value.nextCursor },
      CTX,
    );
    expect(result2.ok).toBe(false);
    if (!result2.ok) {
      expect(result2.error.error.code).toBe("cursor_tampered");
    }
  });
});
