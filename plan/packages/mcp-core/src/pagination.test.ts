/**
 * Tests: Deterministic multi-page invariants, complete traversal, no duplicates/skips.
 */

import { describe, expect, it, beforeAll } from "vitest";
import { createMcpDispatcher } from "../src/index.js";
import type { ComponentSummary } from "../src/index.js";
import { createFixtureProvider } from "./fixtures.test-utils.js";

const CTX = { registryVersion: "1.0.0", requestId: "test-pagination" };

describe("List pagination invariants", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;
  let allSummaries: readonly ComponentSummary[];

  beforeAll(async () => {
    const fixture = await createFixtureProvider();
    dispatcher = createMcpDispatcher(fixture.provider);
    allSummaries = fixture.summaries;
  });

  it("full traversal returns all items exactly once (pageSize=1)", async () => {
    const collected: string[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 20; page++) {
      const input: Record<string, unknown> = { pageSize: 1 };
      if (cursor) input.cursor = cursor;
      const result = await dispatcher.dispatch("list_components", input, CTX);
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      for (const c of result.value.components) {
        collected.push(`${c.stableId}@${c.version}`);
      }
      cursor = result.value.nextCursor;
      if (!cursor) break;
    }

    expect(collected.length).toBe(allSummaries.length);
    expect(new Set(collected).size).toBe(collected.length); // No duplicates
  });

  it("full traversal with pageSize=3 equals pageSize=1", async () => {
    const collectAll = async (pageSize: number): Promise<string[]> => {
      const items: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 20; page++) {
        const input: Record<string, unknown> = { pageSize };
        if (cursor) input.cursor = cursor;
        const result = await dispatcher.dispatch("list_components", input, CTX);
        if (!result.ok) break;
        for (const c of result.value.components) items.push(`${c.stableId}@${c.version}`);
        cursor = result.value.nextCursor;
        if (!cursor) break;
      }
      return items;
    };

    const byOne = await collectAll(1);
    const byThree = await collectAll(3);
    expect(byOne).toEqual(byThree);
  });

  it("same input always produces same pages (deterministic)", async () => {
    const run = async (): Promise<string[][]> => {
      const pages: string[][] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page++) {
        const input: Record<string, unknown> = { pageSize: 2 };
        if (cursor) input.cursor = cursor;
        const result = await dispatcher.dispatch("list_components", input, CTX);
        if (!result.ok) break;
        pages.push(result.value.components.map((c) => `${c.stableId}@${c.version}`));
        cursor = result.value.nextCursor;
        if (!cursor) break;
      }
      return pages;
    };

    const run1 = await run();
    const run2 = await run();
    expect(run1).toEqual(run2);
  });

  it("totalMatching is consistent across pages", async () => {
    const result1 = await dispatcher.dispatch("list_components", { pageSize: 2 }, CTX);
    expect(result1.ok).toBe(true);
    if (!result1.ok || !result1.value.nextCursor) return;

    const result2 = await dispatcher.dispatch(
      "list_components",
      { pageSize: 2, cursor: result1.value.nextCursor },
      CTX,
    );
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.value.totalMatching).toBe(result1.value.totalMatching);
  });

  it("filtered traversal returns only matching items", async () => {
    const collected: string[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 10; page++) {
      const input: Record<string, unknown> = { category: "forms", pageSize: 1 };
      if (cursor) input.cursor = cursor;
      const result = await dispatcher.dispatch("list_components", input, CTX);
      if (!result.ok) break;
      for (const c of result.value.components) {
        expect(c.category).toBe("forms");
        collected.push(`${c.stableId}@${c.version}`);
      }
      cursor = result.value.nextCursor;
      if (!cursor) break;
    }

    const expectedCount = allSummaries.filter((s) => s.category === "forms").length;
    expect(collected.length).toBe(expectedCount);
    expect(new Set(collected).size).toBe(collected.length);
  });
});

describe("Search pagination invariants", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;

  beforeAll(async () => {
    const { provider } = await createFixtureProvider();
    dispatcher = createMcpDispatcher(provider);
  });

  it("full search traversal has no duplicates", async () => {
    const collected: string[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 20; page++) {
      const input: Record<string, unknown> = { query: "table", pageSize: 1 };
      if (cursor) input.cursor = cursor;
      const result = await dispatcher.dispatch("search_components", input, CTX);
      if (!result.ok) break;
      for (const r of result.value.results) {
        collected.push(`${r.stableId}@${r.version}`);
      }
      cursor = result.value.nextCursor;
      if (!cursor) break;
    }

    expect(new Set(collected).size).toBe(collected.length);
  });

  it("search results maintain score ordering across pages", async () => {
    const allScores: number[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 20; page++) {
      const input: Record<string, unknown> = { query: "component", pageSize: 1 };
      if (cursor) input.cursor = cursor;
      const result = await dispatcher.dispatch("search_components", input, CTX);
      if (!result.ok) break;
      for (const r of result.value.results) {
        allScores.push(r.score);
      }
      cursor = result.value.nextCursor;
      if (!cursor) break;
    }

    // Scores should be non-increasing
    for (let i = 1; i < allScores.length; i++) {
      const prev = allScores[i - 1];
      const curr = allScores[i];
      if (prev !== undefined && curr !== undefined) {
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    }
  });

  it("search is deterministic (same query => byte-equivalent result)", async () => {
    const input = { query: "pricing tiers", pageSize: 5 };
    const r1 = await dispatcher.dispatch("search_components", input, CTX);
    const r2 = await dispatcher.dispatch("search_components", input, CTX);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe("Search tie-breaking", () => {
  it("same score entries are ordered by stableId asc then version asc", async () => {
    const { provider } = await createFixtureProvider();
    const dispatcher = createMcpDispatcher(provider);

    // Query that might produce ties - "action" matches button tag
    const result = await dispatcher.dispatch("search_components", { query: "action" }, CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Verify tie-breaking within same scores
    for (let i = 1; i < result.value.results.length; i++) {
      const prev = result.value.results[i - 1];
      const curr = result.value.results[i];
      if (prev && curr && prev.score === curr.score) {
        if (prev.stableId === curr.stableId) {
          expect(prev.version <= curr.version).toBe(true);
        } else {
          expect(prev.stableId < curr.stableId).toBe(true);
        }
      }
    }
  });
});
