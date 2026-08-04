import { describe, expect, it } from "vitest";

import { createMcpDispatcher } from "./index.js";
import { createSpyProvider } from "./fixtures.test-utils.js";

const CONTEXT = { registryVersion: "1.0.0", requestId: "snapshot-integrity-test" };

describe("snapshot integrity contract", () => {
  it.each([
    ["list_components", {}],
    ["search_components", { query: "navigation" }],
  ] as const)("rejects %s before reading an unverified provider", async (operation, input) => {
    const { provider, callCount } = createSpyProvider();
    const unverifiedProvider = { ...provider, verifiedSnapshot: false };
    const result = await createMcpDispatcher(unverifiedProvider).dispatch(
      operation,
      input,
      CONTEXT,
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected an integrity error");
    expect(result.error.error.category).toBe("integrity");
    expect(result.error.error.code).toBe("integrity_failed");
    expect(callCount()).toBe(0);
  });
});
