import { describe, expect, it } from "vitest";

import {
  BEHAVIOR_KEYS,
  behaviorMap,
  capabilityDetectors,
  getCapabilityDetector,
  noExternalPrimitive,
  notApplicable,
  prefersReducedMotion,
  supported,
} from "./index.js";
import type { BehaviorMap } from "./index.js";

describe("supported / notApplicable", () => {
  it("builds a supported behavior entry with its contract text", () => {
    expect(supported("Tab moves focus to the next control.")).toEqual({
      status: "supported",
      contract: "Tab moves focus to the next control.",
    });
  });

  it("builds a not_applicable behavior entry with its reason", () => {
    expect(notApplicable("This component has no loading state.")).toEqual({
      status: "not_applicable",
      reason: "This component has no loading state.",
    });
  });
});

describe("behaviorMap", () => {
  it("produces a total map over every closed BehaviorKey", () => {
    const map = behaviorMap({ keyboard: supported("Enter activates the control.") });
    expect(Object.keys(map).sort()).toEqual([...BEHAVIOR_KEYS].sort());
    for (const key of BEHAVIOR_KEYS) {
      expect(["supported", "not_applicable"]).toContain(map[key].status);
    }
  });

  it("applies the declared overrides and defaults every other key to not_applicable by default", () => {
    const map: BehaviorMap = behaviorMap({
      focus: supported("Renders a visible focus ring."),
      error: supported("Announces validation errors via role=alert."),
    });
    expect(map.focus).toEqual({ status: "supported", contract: "Renders a visible focus ring." });
    expect(map.error).toEqual({
      status: "supported",
      contract: "Announces validation errors via role=alert.",
    });
    expect(map.pointer.status).toBe("not_applicable");
    expect(map.loading.status).toBe("not_applicable");
  });

  it("applies a custom fallback entry to every omitted key", () => {
    const fallback = notApplicable("Not applicable to this static component.");
    const map = behaviorMap({}, fallback);
    for (const key of BEHAVIOR_KEYS) {
      expect(map[key]).toEqual(fallback);
    }
  });
});

describe("noExternalPrimitive", () => {
  it("declares no external accessibility primitive", () => {
    expect(noExternalPrimitive()).toEqual({ usesExternalPrimitive: false });
  });
});

describe("capabilityDetectors", () => {
  it("declares a detector for every closed BrowserCapabilityId", () => {
    const ids: (keyof typeof capabilityDetectors)[] = [
      "container-queries",
      "backdrop-filter",
      "view-transitions",
      "popover",
      "dialog-element",
      "prefers-reduced-motion",
      "intersection-observer",
      "resize-observer",
      "webgl",
      "webgpu",
    ];
    for (const id of ids) {
      expect(typeof capabilityDetectors[id]).toBe("function");
    }
  });

  it("returns a boolean without throwing outside a browser environment for every detector", () => {
    for (const detector of Object.values(capabilityDetectors)) {
      expect(() => detector()).not.toThrow();
      expect(typeof detector()).toBe("boolean");
    }
  });

  it("looks up the exact detector referenced by getCapabilityDetector", () => {
    expect(getCapabilityDetector("resize-observer")).toBe(capabilityDetectors["resize-observer"]);
  });
});

describe("prefersReducedMotion", () => {
  it("returns false outside a browser environment", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
