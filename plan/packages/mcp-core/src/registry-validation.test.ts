/**
 * Tests: Operation registry contracts + input validation + context validation.
 */

import { describe, expect, it } from "vitest";
import {
  OPERATION_REGISTRY,
  MCP_SCHEMA_VERSION,
  OPERATION_IDS,
  validateListComponentsInput,
  validateGetComponentInput,
  validateSearchComponentsInput,
  validateGetDesignTokensInput,
  validateContext,
  isValidOperationId,
} from "../src/index.js";

describe("Operation Registry", () => {
  it("has schema version 1.0.0", () => {
    expect(OPERATION_REGISTRY.schemaVersion).toBe("1.0.0");
    expect(MCP_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("contains exactly four operations", () => {
    expect(OPERATION_REGISTRY.operations).toHaveLength(4);
  });

  it("has no duplicate IDs", () => {
    const ids = OPERATION_REGISTRY.operations.map((op) => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains all four MVP operation IDs", () => {
    const ids = OPERATION_REGISTRY.operations.map((op) => op.id);
    expect(ids).toContain("list_components");
    expect(ids).toContain("get_component");
    expect(ids).toContain("search_components");
    expect(ids).toContain("get_design_tokens");
  });

  it("every contract has complete fields", () => {
    for (const contract of OPERATION_REGISTRY.operations) {
      expect(contract.id).toBeTruthy();
      expect(contract.version).toBe(MCP_SCHEMA_VERSION);
      expect(contract.description.length).toBeGreaterThan(10);
      expect(contract.inputSchema).toBeTruthy();
      expect(contract.outputSchema).toBeTruthy();
      expect(contract.validationRules.length).toBeGreaterThan(0);
      expect(contract.errorCodes.length).toBeGreaterThan(0);
      expect(contract.pagination).toBeTruthy();
      expect(contract.examples.validInput).toBeTruthy();
      expect(contract.examples.validOutput).toBeTruthy();
    }
  });

  it("getContract returns the right contract by ID", () => {
    for (const id of OPERATION_IDS) {
      const contract = OPERATION_REGISTRY.getContract(id);
      expect(contract).toBeDefined();
      expect(contract?.id).toBe(id);
    }
  });

  it("getContract returns undefined for unknown ID", () => {
    expect(OPERATION_REGISTRY.getContract("unknown_op")).toBeUndefined();
  });

  it("list_components and search_components have pagination support", () => {
    const list = OPERATION_REGISTRY.getContract("list_components");
    const search = OPERATION_REGISTRY.getContract("search_components");
    expect(list?.pagination.supported).toBe(true);
    expect(search?.pagination.supported).toBe(true);
  });

  it("get_component and get_design_tokens have no pagination", () => {
    const get = OPERATION_REGISTRY.getContract("get_component");
    const tokens = OPERATION_REGISTRY.getContract("get_design_tokens");
    expect(get?.pagination.supported).toBe(false);
    expect(tokens?.pagination.supported).toBe(false);
  });
});

describe("isValidOperationId", () => {
  it("accepts all four operation IDs", () => {
    for (const id of OPERATION_IDS) {
      expect(isValidOperationId(id)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isValidOperationId("unknown")).toBe(false);
    expect(isValidOperationId("")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidOperationId(123)).toBe(false);
    expect(isValidOperationId(null)).toBe(false);
  });
});

describe("validateContext", () => {
  it("accepts valid context", () => {
    const result = validateContext({ registryVersion: "1.0.0", requestId: "req-1" });
    expect(result.valid).toBe(true);
    expect(result.context?.registryVersion).toBe("1.0.0");
    expect(result.context?.requestId).toBe("req-1");
  });

  it("rejects non-object", () => {
    expect(validateContext(null).valid).toBe(false);
    expect(validateContext("str").valid).toBe(false);
  });

  it("rejects missing registryVersion", () => {
    const result = validateContext({ requestId: "req-1" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("registryVersion"))).toBe(true);
  });

  it("rejects missing requestId", () => {
    const result = validateContext({ registryVersion: "1.0.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("requestId"))).toBe(true);
  });
});

describe("validateListComponentsInput", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = validateListComponentsInput({}, "req-1");
    expect(result.ok).toBe(true);
  });

  it("accepts valid category", () => {
    const result = validateListComponentsInput({ category: "forms" }, "req-1");
    expect(result.ok).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = validateListComponentsInput({ category: "invalid" }, "req-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.fields?.some((f) => f.path === "/category")).toBe(true);
    }
  });

  it("rejects unknown fields", () => {
    const result = validateListComponentsInput({ unknownField: "value" }, "req-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.fields?.some((f) => f.code === "unknown_field")).toBe(true);
    }
  });

  it("accepts valid pageSize", () => {
    const result = validateListComponentsInput({ pageSize: 50 }, "req-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.pageSize).toBe(50);
  });

  it("rejects pageSize below 1", () => {
    const result = validateListComponentsInput({ pageSize: 0 }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects pageSize above 100", () => {
    const result = validateListComponentsInput({ pageSize: 101 }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects non-semver exactVersion", () => {
    const result = validateListComponentsInput({ exactVersion: "latest" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("accepts valid exactVersion", () => {
    const result = validateListComponentsInput({ exactVersion: "1.2.3" }, "req-1");
    expect(result.ok).toBe(true);
  });

  it("defaults pageSize to 20", () => {
    const result = validateListComponentsInput({}, "req-1");
    if (result.ok) expect(result.value.pageSize).toBe(20);
  });
});

describe("validateGetComponentInput", () => {
  it("accepts valid input", () => {
    const result = validateGetComponentInput({ stableId: "button", version: "1.0.0" }, "req-1");
    expect(result.ok).toBe(true);
  });

  it("rejects missing stableId", () => {
    const result = validateGetComponentInput({ version: "1.0.0" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects missing version", () => {
    const result = validateGetComponentInput({ stableId: "button" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects version ranges", () => {
    const result = validateGetComponentInput({ stableId: "button", version: "^1.0.0" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects 'latest' as version", () => {
    const result = validateGetComponentInput({ stableId: "button", version: "latest" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = validateGetComponentInput(
      { stableId: "button", version: "1.0.0", extra: true },
      "req-1",
    );
    expect(result.ok).toBe(false);
  });
});

describe("validateSearchComponentsInput", () => {
  it("accepts valid query", () => {
    const result = validateSearchComponentsInput({ query: "pricing" }, "req-1");
    expect(result.ok).toBe(true);
  });

  it("rejects empty query", () => {
    const result = validateSearchComponentsInput({ query: "" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects blank-only query", () => {
    const result = validateSearchComponentsInput({ query: "   " }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects missing query", () => {
    const result = validateSearchComponentsInput({}, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects query over 500 characters", () => {
    const result = validateSearchComponentsInput({ query: "a".repeat(501) }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = validateSearchComponentsInput({ query: "test", foo: "bar" }, "req-1");
    expect(result.ok).toBe(false);
  });
});

describe("validateGetDesignTokensInput", () => {
  it("accepts valid exactVersion", () => {
    const result = validateGetDesignTokensInput({ exactVersion: "1.0.0" }, "req-1");
    expect(result.ok).toBe(true);
  });

  it("rejects missing exactVersion", () => {
    const result = validateGetDesignTokensInput({}, "req-1");
    expect(result.ok).toBe(false);
  });

  it("rejects non-semver exactVersion", () => {
    const result = validateGetDesignTokensInput({ exactVersion: "latest" }, "req-1");
    expect(result.ok).toBe(false);
  });

  it("accepts valid token category", () => {
    const result = validateGetDesignTokensInput(
      { exactVersion: "1.0.0", category: "color" },
      "req-1",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = validateGetDesignTokensInput(
      { exactVersion: "1.0.0", category: "invalid" },
      "req-1",
    );
    expect(result.ok).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = validateGetDesignTokensInput({ exactVersion: "1.0.0", unknown: true }, "req-1");
    expect(result.ok).toBe(false);
  });
});
