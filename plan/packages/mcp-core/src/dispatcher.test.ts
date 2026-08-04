/**
 * Tests: Dispatcher - validation before provider reads, list, get operations.
 */

import { describe, expect, it, beforeAll } from "vitest";
import { createMcpDispatcher } from "../src/index.js";
import {
  createFixtureProvider,
  createSpyProvider,
  createThrowingProvider,
} from "./fixtures.test-utils.js";

const CTX = { registryVersion: "1.0.0", requestId: "test-req-1" };

describe("createMcpDispatcher - validation before provider reads", () => {
  it("rejects invalid context without calling provider", async () => {
    const { provider, callCount } = createSpyProvider();
    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("list_components", {}, null);
    expect(result.ok).toBe(false);
    expect(callCount()).toBe(0);
  });

  it("rejects invalid list_components input without calling provider", async () => {
    const { provider, callCount } = createSpyProvider();
    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("list_components", { category: "bad" }, CTX);
    expect(result.ok).toBe(false);
    expect(callCount()).toBe(0);
  });

  it("rejects invalid get_component input without calling provider", async () => {
    const { provider, callCount } = createSpyProvider();
    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("get_component", { stableId: "x" }, CTX);
    expect(result.ok).toBe(false);
    expect(callCount()).toBe(0);
  });

  it("rejects invalid search_components input without calling provider", async () => {
    const { provider, callCount } = createSpyProvider();
    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("search_components", {}, CTX);
    expect(result.ok).toBe(false);
    expect(callCount()).toBe(0);
  });

  it("rejects invalid get_design_tokens input without calling provider", async () => {
    const { provider, callCount } = createSpyProvider();
    const dispatcher = createMcpDispatcher(provider);
    const result = await dispatcher.dispatch("get_design_tokens", {}, CTX);
    expect(result.ok).toBe(false);
    expect(callCount()).toBe(0);
  });
});

describe("createMcpDispatcher - list_components", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;

  beforeAll(async () => {
    const { provider } = await createFixtureProvider();
    dispatcher = createMcpDispatcher(provider);
  });

  it("returns all components without filters", async () => {
    const result = await dispatcher.dispatch("list_components", {}, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.components.length).toBe(7);
      expect(result.value.registryVersion).toBe("1.0.0");
    }
  });

  it("filters by category", async () => {
    const result = await dispatcher.dispatch("list_components", { category: "forms" }, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.components.every((c) => c.category === "forms")).toBe(true);
    }
  });

  it("filters by exactVersion", async () => {
    const result = await dispatcher.dispatch("list_components", { exactVersion: "1.0.0" }, CTX);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.components.every((c) => c.version === "1.0.0")).toBe(true);
    }
  });

  it("uses deterministic ordering (stableId asc, version asc)", async () => {
    const result = await dispatcher.dispatch("list_components", {}, CTX);
    if (result.ok) {
      const ids = result.value.components.map((c) => `${c.stableId}@${c.version}`);
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    }
  });

  it("paginates correctly", async () => {
    const result1 = await dispatcher.dispatch("list_components", { pageSize: 3 }, CTX);
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;
    expect(result1.value.components.length).toBe(3);
    expect(result1.value.nextCursor).toBeDefined();

    const result2 = await dispatcher.dispatch(
      "list_components",
      { pageSize: 3, cursor: result1.value.nextCursor },
      CTX,
    );
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.value.components.length).toBe(3);

    // No overlap
    const ids1 = result1.value.components.map((c) => `${c.stableId}@${c.version}`);
    const ids2 = result2.value.components.map((c) => `${c.stableId}@${c.version}`);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("rejects tampered cursor", async () => {
    const result = await dispatcher.dispatch("list_components", { cursor: "dGFtcGVyZWQ" }, CTX);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("cursor_tampered");
    }
  });
});

describe("createMcpDispatcher - get_component", () => {
  let dispatcher: ReturnType<typeof createMcpDispatcher>;

  beforeAll(async () => {
    const { provider } = await createFixtureProvider();
    dispatcher = createMcpDispatcher(provider);
  });

  it("returns component with integrity-verified source", async () => {
    const result = await dispatcher.dispatch(
      "get_component",
      { stableId: "button", version: "1.0.0" },
      CTX,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stableId).toBe("button");
      expect(result.value.version).toBe("1.0.0");
      expect(result.value.sourceFiles.length).toBeGreaterThan(0);
      expect(result.value.generated).toBe(false);
      expect(result.value.customized).toBe(false);
      expect(result.value.lineage.stableId).toBe("button");
      expect(result.value.lineage.version).toBe("1.0.0");
      expect(result.value.registryVersion).toBe("1.0.0");
    }
  });

  it("returns not_found with alternatives for unknown version", async () => {
    const result = await dispatcher.dispatch(
      "get_component",
      { stableId: "button", version: "9.9.9" },
      CTX,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("not_found");
      expect(result.error.error.resource?.id).toBe("button");
      expect(result.error.error.alternatives?.length).toBeGreaterThan(0);
    }
  });

  it("returns not_found for unknown stableId", async () => {
    const result = await dispatcher.dispatch(
      "get_component",
      { stableId: "nonexistent", version: "1.0.0" },
      CTX,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("not_found");
    }
  });
});

describe("createMcpDispatcher - provider exception handling", () => {
  it("returns availability error on provider throw", async () => {
    const provider = createThrowingProvider();
    const dispatcher = createMcpDispatcher(provider);

    const result = await dispatcher.dispatch("list_components", {}, CTX);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.category).toBe("availability");
      expect(result.error.error.retryable).toBe(true);
      // Should not leak stack traces
      expect(result.error.error.message).not.toContain("connection failed");
    }
  });
});
