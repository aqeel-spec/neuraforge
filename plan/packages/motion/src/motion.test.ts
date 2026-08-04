import { describe, it, expect } from "vitest";

import type {
  ApplicableControl,
  MotionControl,
  MotionControlName,
  MotionCustomizationSchema,
  MotionOverrideConfig,
  MotionPresetRecord,
  NonApplicableControl,
  ReducedMotionBehavior,
} from "./types.js";
import { BREAKPOINT_IDS, MOTION_CONTROL_NAMES } from "./types.js";
import {
  createMotionCustomizationSchema,
  FRAMER_MOTION_PROVENANCE,
  FRAMER_MOTION_VERSION,
  getApplicableControlNames,
  getNonApplicableControlNames,
  isApplicableControl,
  isNonApplicableControl,
  validateSchemaCompleteness,
} from "./schema.js";
import { getBreakpointSupportedControls, getSchemaDefaults, resolveMotionConfig } from "./resolution.js";
import { validateMotionConfig } from "./validation.js";
import type { SemanticState } from "./components.js";
import {
  detectBreakpoint,
  determineMotionMode,
  getBreakpointMotionProps,
  resolveAnimationOutput,
  semanticStatesEquivalent,
} from "./components.js";
import {
  buildMotionMcpPayload,
  buildMotionMcpSummary,
  classifyMotionPresetStatus,
  projectMotionPreset,
  validateProjectionCompleteness,
} from "./projection.js";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const REDUCED_MOTION: ReducedMotionBehavior = {
  disabledDecorativeMotion: "All decorative fade/slide animations are disabled",
  essentialTransitions: [
    { id: "state-change", description: "Opacity transition for open/close state", reducedDuration: 150 },
  ],
};

function makeApplicable(overrides: Partial<ApplicableControl> = {}): ApplicableControl {
  return {
    applicability: "applicable",
    type: "number",
    default: 0.3,
    constraints: [],
    breakpoints: "all",
    ...overrides,
  };
}

function makeNonApplicable(reason = "Not relevant to this preset"): NonApplicableControl {
  return { applicability: "not_applicable", reason };
}

/** Creates a full controls record with specified applicable controls, rest non-applicable. */
function makeControls(
  applicableNames: MotionControlName[],
  customApplicable?: Partial<Record<MotionControlName, Partial<ApplicableControl>>>,
): Record<MotionControlName, MotionControl> {
  const controls = {} as Record<MotionControlName, MotionControl>;
  for (const name of MOTION_CONTROL_NAMES) {
    if (applicableNames.includes(name)) {
      controls[name] = makeApplicable(customApplicable?.[name]);
    } else {
      controls[name] = makeNonApplicable();
    }
  }
  return controls;
}

function makeSchema(
  applicableNames: MotionControlName[] = ["duration", "delay", "easing", "initial", "animate", "exit", "motionDisablement"],
  customApplicable?: Partial<Record<MotionControlName, Partial<ApplicableControl>>>,
): MotionCustomizationSchema {
  return createMotionCustomizationSchema(
    { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
    "1.0.0",
    makeControls(applicableNames, customApplicable),
    REDUCED_MOTION,
  );
}

const SEMANTIC_STATE: SemanticState = {
  content: "Hello World",
  status: "visible",
  focusOrder: ["btn-1", "btn-2"],
  primaryActions: ["submit", "cancel"],
  keyboardAccessible: true,
  assistiveTechnologyPreserved: true,
};

// ---------------------------------------------------------------------------
// Schema Tests
// ---------------------------------------------------------------------------

describe("Motion Schema", () => {
  it("FRAMER_MOTION_VERSION is pinned", () => {
    expect(FRAMER_MOTION_VERSION).toBe("11.15.0");
  });

  it("FRAMER_MOTION_PROVENANCE has MIT license and approved status", () => {
    expect(FRAMER_MOTION_PROVENANCE.spdxIdentifier).toBe("MIT");
    expect(FRAMER_MOTION_PROVENANCE.reviewStatus).toBe("approved");
    expect(FRAMER_MOTION_PROVENANCE.name).toBe("framer-motion");
  });

  it("MOTION_CONTROL_NAMES contains all 22 controls", () => {
    expect(MOTION_CONTROL_NAMES).toHaveLength(22);
    expect(MOTION_CONTROL_NAMES).toContain("variants");
    expect(MOTION_CONTROL_NAMES).toContain("springBounce");
    expect(MOTION_CONTROL_NAMES).toContain("breakpointBehavior");
  });

  it("BREAKPOINT_IDS contains Tailwind breakpoints", () => {
    expect(BREAKPOINT_IDS).toEqual(["sm", "md", "lg", "xl", "2xl"]);
  });

  it("isApplicableControl type guard works", () => {
    const applicable = makeApplicable();
    const nonApplicable = makeNonApplicable();
    expect(isApplicableControl(applicable)).toBe(true);
    expect(isApplicableControl(nonApplicable)).toBe(false);
    expect(isNonApplicableControl(nonApplicable)).toBe(true);
    expect(isNonApplicableControl(applicable)).toBe(false);
  });

  it("validateSchemaCompleteness reports valid for a complete schema", () => {
    const schema = makeSchema();
    const result = validateSchemaCompleteness(schema);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
  });

  it("createMotionCustomizationSchema throws on missing controls", () => {
    const incompleteControls = {} as Record<MotionControlName, MotionControl>;
    incompleteControls.duration = makeApplicable();
    // Missing all other controls
    expect(() =>
      createMotionCustomizationSchema(
        { kind: "motion-preset", stableId: "test", version: "1.0.0" },
        "1.0.0",
        incompleteControls,
        REDUCED_MOTION,
      ),
    ).toThrow("Incomplete MotionCustomizationSchema");
  });

  it("getApplicableControlNames returns only applicable controls", () => {
    const schema = makeSchema(["duration", "delay"]);
    const applicable = getApplicableControlNames(schema);
    expect(applicable).toEqual(["duration", "delay"]);
  });

  it("getNonApplicableControlNames returns only non-applicable controls", () => {
    const schema = makeSchema(["duration"]);
    const nonApplicable = getNonApplicableControlNames(schema);
    expect(nonApplicable).toHaveLength(21); // 22 - 1
    expect(nonApplicable).not.toContain("duration");
  });
});


// ---------------------------------------------------------------------------
// Resolution Tests
// ---------------------------------------------------------------------------

describe("Motion Resolution", () => {
  it("resolves defaults when no overrides provided", () => {
    const schema = makeSchema(["duration", "delay"], {
      duration: { default: 0.3 },
      delay: { default: 0 },
    });
    const resolved = resolveMotionConfig(schema);
    expect(resolved.values.duration).toBe(0.3);
    expect(resolved.values.delay).toBe(0);
    expect(resolved.appliedDefaults).toContain("duration");
    expect(resolved.appliedDefaults).toContain("delay");
    expect(resolved.appliedOverrides).toHaveLength(0);
  });

  it("applies overrides over defaults", () => {
    const schema = makeSchema(["duration", "delay"], {
      duration: { default: 0.3 },
      delay: { default: 0 },
    });
    const config: MotionOverrideConfig = { overrides: { duration: 0.5 } };
    const resolved = resolveMotionConfig(schema, config);
    expect(resolved.values.duration).toBe(0.5);
    expect(resolved.values.delay).toBe(0); // uses default
    expect(resolved.appliedOverrides).toContain("duration");
    expect(resolved.appliedDefaults).toContain("delay");
  });

  it("non-applicable controls resolve to undefined", () => {
    const schema = makeSchema(["duration"]);
    const resolved = resolveMotionConfig(schema);
    expect(resolved.values.duration).toBe(0.3);
    expect(resolved.values.springStiffness).toBeUndefined();
    expect(resolved.values.gestureDrag).toBeUndefined();
  });

  it("applies breakpoint overrides for supported breakpoints", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, breakpoints: "all" },
    });
    const config: MotionOverrideConfig = {
      breakpointOverrides: { md: { duration: 0.5 } },
    };
    const resolved = resolveMotionConfig(schema, config);
    expect(resolved.breakpointValues.md.duration).toBe(0.5);
    expect(resolved.breakpointValues.sm.duration).toBe(0.3); // falls through to base
    expect(resolved.appliedOverrides).toContain("md.duration");
  });

  it("ignores breakpoint override when control does not support that breakpoint", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, breakpoints: ["sm", "md"] },
    });
    const config: MotionOverrideConfig = {
      breakpointOverrides: { xl: { duration: 0.8 } },
    };
    const resolved = resolveMotionConfig(schema, config);
    // xl is not supported so it falls through to base
    expect(resolved.breakpointValues.xl.duration).toBe(0.3);
    expect(resolved.appliedOverrides).not.toContain("xl.duration");
  });

  it("getBreakpointSupportedControls returns only controls with breakpoint support", () => {
    const schema = makeSchema(["duration", "delay"], {
      duration: { default: 0.3, breakpoints: "all" },
      delay: { default: 0, breakpoints: "none" },
    });
    const supported = getBreakpointSupportedControls(schema);
    expect(supported).toContain("duration");
    expect(supported).not.toContain("delay");
  });

  it("getSchemaDefaults returns the zero-override resolved values", () => {
    const schema = makeSchema(["duration", "easing"], {
      duration: { default: 0.4 },
      easing: { default: "easeOut", type: "easing-function" },
    });
    const defaults = getSchemaDefaults(schema);
    expect(defaults.duration).toBe(0.4);
    expect(defaults.easing).toBe("easeOut");
  });
});


// ---------------------------------------------------------------------------
// Validation Tests
// ---------------------------------------------------------------------------

describe("Motion Validation", () => {
  it("valid config returns resolved result", () => {
    const schema = makeSchema(["duration", "delay"], {
      duration: { default: 0.3, range: { min: 0, max: 5 } },
      delay: { default: 0, range: { min: 0, max: 10 } },
    });
    const config: MotionOverrideConfig = { overrides: { duration: 1.0 } };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config.values.duration).toBe(1.0);
    }
  });

  it("unknown_field fault for invalid control names", () => {
    const schema = makeSchema(["duration"]);
    const config = {
      overrides: { nonExistentControl: 5 },
    } as unknown as MotionOverrideConfig;
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults).toHaveLength(1);
      expect(result.faults[0]!.code).toBe("unknown_field");
      expect(result.faults[0]!.path).toContain("nonExistentControl");
    }
  });

  it("unknown_field fault for invalid breakpoint IDs", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, breakpoints: "all" },
    });
    const config = {
      breakpointOverrides: { xxl: { duration: 1 } },
    } as unknown as MotionOverrideConfig;
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults.some((f) => f.code === "unknown_field" && f.path.includes("xxl"))).toBe(true);
    }
  });

  it("wrong_type fault when value type does not match", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, type: "number" },
    });
    const config: MotionOverrideConfig = {
      overrides: { duration: "fast" as unknown as number },
    };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults[0]!.code).toBe("wrong_type");
    }
  });

  it("non_applicable fault when override targets non-applicable control", () => {
    const schema = makeSchema(["duration"]); // springStiffness is non-applicable
    const config: MotionOverrideConfig = {
      overrides: { springStiffness: 100 },
    };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults[0]!.code).toBe("non_applicable");
      expect(result.faults[0]!.path).toContain("springStiffness");
    }
  });

  it("non_applicable fault when breakpoint override targets unsupported breakpoint", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, breakpoints: ["sm", "md"] },
    });
    const config: MotionOverrideConfig = {
      breakpointOverrides: { xl: { duration: 0.5 } },
    };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults[0]!.code).toBe("non_applicable");
      expect(result.faults[0]!.path).toContain("xl");
    }
  });

  it("out_of_range fault when numeric value exceeds range", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, type: "number", range: { min: 0, max: 5 } },
    });
    const config: MotionOverrideConfig = { overrides: { duration: 10 } };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults[0]!.code).toBe("out_of_range");
    }
  });

  it("out_of_range fault when value not in allowedValues", () => {
    const schema = makeSchema(["easing"], {
      easing: {
        default: "easeOut",
        type: "enum",
        allowedValues: ["easeIn", "easeOut", "easeInOut", "linear"],
      },
    });
    const config: MotionOverrideConfig = { overrides: { easing: "superFast" } };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults[0]!.code).toBe("out_of_range");
    }
  });

  it("accumulates multiple faults without short-circuiting", () => {
    const schema = makeSchema(["duration", "easing"], {
      duration: { default: 0.3, type: "number", range: { min: 0, max: 5 } },
      easing: { default: "easeOut", type: "enum", allowedValues: ["easeIn", "easeOut"] },
    });
    const config: MotionOverrideConfig = {
      overrides: {
        duration: 99, // out of range
        easing: "invalid", // not in allowed values
        springStiffness: 100, // non-applicable
      },
    };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.faults.length).toBeGreaterThanOrEqual(3);
      const codes = result.faults.map((f) => f.code);
      expect(codes).toContain("out_of_range");
      expect(codes).toContain("non_applicable");
    }
  });

  it("all faults have code, path, constraint, and guidance", () => {
    const schema = makeSchema(["duration"]);
    const config: MotionOverrideConfig = {
      overrides: { springStiffness: 100 },
    };
    const result = validateMotionConfig(schema, config);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      for (const fault of result.faults) {
        expect(fault.code).toBeTruthy();
        expect(fault.path).toBeTruthy();
        expect(fault.constraint).toBeTruthy();
        expect(fault.guidance).toBeTruthy();
      }
    }
  });
});


// ---------------------------------------------------------------------------
// Accessibility & Reduced-Motion Tests
// ---------------------------------------------------------------------------

describe("Motion Accessibility", () => {
  it("determineMotionMode returns disabled when motionDisablement overridden to true", () => {
    const schema = makeSchema(["duration", "motionDisablement"], {
      motionDisablement: { default: false, type: "boolean" },
    });
    const config: MotionOverrideConfig = { overrides: { motionDisablement: true } };
    const mode = determineMotionMode(schema, config, false);
    expect(mode).toBe("disabled");
  });

  it("determineMotionMode returns reduced when prefers-reduced-motion is true", () => {
    const schema = makeSchema(["duration", "motionDisablement"], {
      motionDisablement: { default: false, type: "boolean" },
    });
    const mode = determineMotionMode(schema, undefined, true);
    expect(mode).toBe("reduced");
  });

  it("determineMotionMode returns full by default", () => {
    const schema = makeSchema(["duration", "motionDisablement"], {
      motionDisablement: { default: false, type: "boolean" },
    });
    const mode = determineMotionMode(schema, undefined, false);
    expect(mode).toBe("full");
  });

  it("disabled mode emits no motion props and preserves semantic state", () => {
    const schema = makeSchema(["duration", "animate", "initial"], {
      duration: { default: 0.3 },
      animate: { default: { opacity: 1 }, type: "variant-map" },
      initial: { default: { opacity: 0 }, type: "variant-map" },
    });
    const output = resolveAnimationOutput(schema, undefined, "disabled", SEMANTIC_STATE);
    expect(output.mode).toBe("disabled");
    expect(output.motionProps).toEqual({});
    expect(output.decorativeMotionActive).toBe(false);
    expect(output.activeEssentialTransitions).toHaveLength(0);
    expect(output.semanticState).toBe(SEMANTIC_STATE);
  });

  it("reduced mode disables decorative motion but keeps essential transitions", () => {
    const schema = makeSchema(["duration", "animate", "initial"], {
      duration: { default: 0.3 },
      animate: { default: { opacity: 1 }, type: "variant-map" },
      initial: { default: { opacity: 0 }, type: "variant-map" },
    });
    const output = resolveAnimationOutput(schema, undefined, "reduced", SEMANTIC_STATE);
    expect(output.mode).toBe("reduced");
    expect(output.decorativeMotionActive).toBe(false);
    expect(output.activeEssentialTransitions).toContain("state-change");
    // Should have capped duration from essentialTransitions
    expect(output.motionProps).toHaveProperty("transition");
  });

  it("full mode enables all motion and decorative animation", () => {
    const schema = makeSchema(["duration", "animate", "initial"], {
      duration: { default: 0.3 },
      animate: { default: { opacity: 1 }, type: "variant-map" },
      initial: { default: { opacity: 0 }, type: "variant-map" },
    });
    const output = resolveAnimationOutput(schema, undefined, "full", SEMANTIC_STATE);
    expect(output.mode).toBe("full");
    expect(output.decorativeMotionActive).toBe(true);
    expect(output.motionProps).toHaveProperty("animate");
    expect(output.motionProps).toHaveProperty("initial");
  });

  it("semantic state is preserved identically across all motion modes (Property 13)", () => {
    const schema = makeSchema(["duration", "animate", "initial"], {
      duration: { default: 0.3 },
      animate: { default: { opacity: 1 }, type: "variant-map" },
      initial: { default: { opacity: 0 }, type: "variant-map" },
    });

    const fullOutput = resolveAnimationOutput(schema, undefined, "full", SEMANTIC_STATE);
    const reducedOutput = resolveAnimationOutput(schema, undefined, "reduced", SEMANTIC_STATE);
    const disabledOutput = resolveAnimationOutput(schema, undefined, "disabled", SEMANTIC_STATE);

    expect(semanticStatesEquivalent(fullOutput.semanticState, reducedOutput.semanticState)).toBe(true);
    expect(semanticStatesEquivalent(fullOutput.semanticState, disabledOutput.semanticState)).toBe(true);
    expect(semanticStatesEquivalent(reducedOutput.semanticState, disabledOutput.semanticState)).toBe(true);
  });

  it("reduced mode caps essential transition duration", () => {
    const schema = makeSchema(["duration", "animate", "initial"], {
      duration: { default: 2.0 },
      animate: { default: { opacity: 1 }, type: "variant-map" },
      initial: { default: { opacity: 0 }, type: "variant-map" },
    });
    const output = resolveAnimationOutput(schema, undefined, "reduced", SEMANTIC_STATE);
    // REDUCED_MOTION has reducedDuration of 150ms = 0.15s
    const transition = output.motionProps["transition"] as { duration: number } | undefined;
    expect(transition).toBeDefined();
    expect(transition!.duration).toBe(0.15); // 150ms / 1000
  });

  it("semanticStatesEquivalent detects differences", () => {
    const altered: SemanticState = { ...SEMANTIC_STATE, content: "Different" };
    expect(semanticStatesEquivalent(SEMANTIC_STATE, altered)).toBe(false);
  });
});


// ---------------------------------------------------------------------------
// Breakpoint & Responsive Tests
// ---------------------------------------------------------------------------

describe("Motion Breakpoints", () => {
  it("detectBreakpoint returns correct breakpoint for viewport widths", () => {
    expect(detectBreakpoint(1600)).toBe("2xl");
    expect(detectBreakpoint(1536)).toBe("2xl");
    expect(detectBreakpoint(1300)).toBe("xl");
    expect(detectBreakpoint(1024)).toBe("lg");
    expect(detectBreakpoint(800)).toBe("md");
    expect(detectBreakpoint(640)).toBe("sm");
    expect(detectBreakpoint(500)).toBeUndefined();
  });

  it("getBreakpointMotionProps returns empty for disabled mode", () => {
    const schema = makeSchema(["duration"], { duration: { default: 0.3, breakpoints: "all" } });
    const props = getBreakpointMotionProps(schema, undefined, "md", "disabled");
    expect(props).toEqual({});
  });

  it("getBreakpointMotionProps uses breakpoint override value", () => {
    const schema = makeSchema(["duration"], {
      duration: { default: 0.3, breakpoints: "all" },
    });
    const config: MotionOverrideConfig = {
      breakpointOverrides: { lg: { duration: 0.6 } },
    };
    const props = getBreakpointMotionProps(schema, config, "lg", "full");
    expect(props).toHaveProperty("transition");
  });
});

// ---------------------------------------------------------------------------
// Projection & MCP Tests
// ---------------------------------------------------------------------------

describe("Motion Projection", () => {
  function makePresetRecord(): MotionPresetRecord {
    return {
      ref: { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
      status: "stable",
      schemaVersion: "1.0.0",
      customizationSchema: makeSchema(["duration", "delay", "easing", "initial", "animate", "exit", "motionDisablement"], {
        duration: { default: 0.3, range: { min: 0, max: 5 } },
        delay: { default: 0, range: { min: 0, max: 10 } },
        easing: { default: "easeOut", type: "easing-function" },
        initial: { default: { opacity: 0 }, type: "variant-map" },
        animate: { default: { opacity: 1 }, type: "variant-map" },
        exit: { default: { opacity: 0 }, type: "variant-map" },
        motionDisablement: { default: false, type: "boolean" },
      }),
      framerMotionVersion: FRAMER_MOTION_VERSION,
      framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
      sourceFiles: [{
        path: "src/presets/fade-in.ts",
        origin: "original",
        mediaType: "text/typescript",
        size: 1024,
        checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "abc123" },
      }],
      dependencies: [{ name: "framer-motion", version: "11.15.0", source: "https://github.com/framer/motion" }],
      examples: [{
        id: "basic-fade",
        title: "Basic fade in",
        description: "A simple opacity fade from 0 to 1",
        config: { overrides: { duration: 0.5 } },
        sourcePath: "examples/basic-fade.tsx",
        interactive: true,
      }],
      performanceRecords: [{
        artifact: { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
        metric: "bundle-size",
        scenario: "tree-shaken import",
        environment: {
          operatingSystem: "linux",
          runtime: "node-20",
          tools: { vite: "5.4.21" },
          prerequisites: [],
          fixtures: [],
        },
        result: 2.1,
        threshold: 5,
        unit: "kB",
        command: "npm run measure:bundle",
        status: "passed",
      }],
      reducedMotionContract: REDUCED_MOTION,
    };
  }

  it("projectMotionPreset creates a frozen, JSON-safe projection", () => {
    const record = makePresetRecord();
    const projected = projectMotionPreset(record);
    expect(projected.ref.stableId).toBe("fade-in");
    expect(projected.status).toBe("stable");
    expect(projected.framerMotionVersion).toBe("11.15.0");
    expect(projected.applicability.applicable.length).toBeGreaterThan(0);
    expect(projected.applicability.nonApplicable.length).toBeGreaterThan(0);
    expect(Object.isFrozen(projected)).toBe(true);
  });

  it("projection includes all applicable controls with defaults and ranges", () => {
    const record = makePresetRecord();
    const projected = projectMotionPreset(record);
    const durationCtrl = projected.applicability.applicable.find((c) => c.name === "duration");
    expect(durationCtrl).toBeDefined();
    expect(durationCtrl!.default).toBe(0.3);
    expect(durationCtrl!.range).toEqual({ min: 0, max: 5 });
  });

  it("projection includes reduced-motion contract", () => {
    const record = makePresetRecord();
    const projected = projectMotionPreset(record);
    expect(projected.reducedMotionContract.disabledDecorativeMotion).toBeTruthy();
    expect(projected.reducedMotionContract.essentialTransitions).toHaveLength(1);
    expect(projected.reducedMotionContract.essentialTransitions[0]!.reducedDurationMs).toBe(150);
  });

  it("validateProjectionCompleteness returns empty for complete record", () => {
    const record = makePresetRecord();
    const missing = validateProjectionCompleteness(record);
    expect(missing).toHaveLength(0);
  });

  it("validateProjectionCompleteness catches missing fields", () => {
    const record = makePresetRecord();
    (record as { examples: unknown[] }).examples = [];
    const missing = validateProjectionCompleteness(record);
    expect(missing).toContain("examples");
  });

  it("classifyMotionPresetStatus returns stable for complete record", () => {
    const record = makePresetRecord();
    const result = classifyMotionPresetStatus(record);
    expect(result.status).toBe("stable");
    expect(result.blockers).toHaveLength(0);
  });

  it("classifyMotionPresetStatus returns experimental with blockers for incomplete record", () => {
    const record = makePresetRecord();
    (record as { performanceRecords: unknown[] }).performanceRecords = [];
    const result = classifyMotionPresetStatus(record);
    expect(result.status).toBe("experimental");
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("buildMotionMcpPayload returns complete MCP response structure", () => {
    const record = makePresetRecord();
    const payload = buildMotionMcpPayload(record);
    expect(payload["kind"]).toBe("motion-preset");
    expect(payload["stableId"]).toBe("fade-in");
    expect(payload["version"]).toBe("1.0.0");
    expect(payload["controls"]).toBeDefined();
    expect(payload["reducedMotion"]).toBeDefined();
    expect(payload["examples"]).toBeDefined();
    expect(payload["performance"]).toBeDefined();
  });

  it("buildMotionMcpPayload includes experimental warnings for experimental presets", () => {
    const record = makePresetRecord();
    (record as { status: string }).status = "experimental";
    (record as { blockers: unknown[] }).blockers = [
      { code: "perf_fail", description: "Runtime threshold exceeded" },
    ];
    const payload = buildMotionMcpPayload(record);
    expect(payload["experimental"]).toBeDefined();
    const experimental = payload["experimental"] as { blockers: unknown[]; warnings: unknown[] };
    expect(experimental.blockers).toHaveLength(1);
    expect(experimental.warnings.length).toBeGreaterThan(0);
  });

  it("buildMotionMcpSummary returns summary with control counts", () => {
    const record = makePresetRecord();
    const summary = buildMotionMcpSummary(record);
    expect(summary["kind"]).toBe("motion-preset");
    expect(summary["stableId"]).toBe("fade-in");
    expect(summary["applicableControls"]).toBe(7);
    expect(summary["totalControls"]).toBe(22);
    expect(summary["hasReducedMotionSupport"]).toBe(true);
    expect(summary["performanceStatus"]).toBe("passing");
  });
});

// ---------------------------------------------------------------------------
// Performance Budget Tests
// ---------------------------------------------------------------------------

describe("Motion Performance", () => {
  it("stable classification requires passing performance records", () => {
    const record: MotionPresetRecord = {
      ref: { kind: "motion-preset", stableId: "bounce", version: "1.0.0" },
      status: "experimental",
      schemaVersion: "1.0.0",
      customizationSchema: makeSchema(["duration"]),
      framerMotionVersion: FRAMER_MOTION_VERSION,
      framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
      sourceFiles: [{
        path: "src/presets/bounce.ts",
        origin: "original",
        mediaType: "text/typescript",
        size: 512,
        checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "def456" },
      }],
      dependencies: [],
      examples: [{ id: "ex1", title: "Bounce", description: "Bounce example", config: {}, sourcePath: "ex.tsx", interactive: false }],
      performanceRecords: [{
        artifact: { kind: "motion-preset", stableId: "bounce", version: "1.0.0" },
        metric: "runtime-fps",
        scenario: "60fps animation",
        environment: { operatingSystem: "linux", runtime: "chrome-120", tools: {}, prerequisites: [], fixtures: [] },
        result: 45,
        threshold: 55,
        unit: "fps",
        command: "npm run perf:fps",
        status: "failed",
      }],
      reducedMotionContract: REDUCED_MOTION,
    };

    const result = classifyMotionPresetStatus(record);
    expect(result.status).toBe("experimental");
    expect(result.blockers.some((b) => b.description.includes("failing"))).toBe(true);
  });

  it("experimental preset MCP summary shows failing performance status", () => {
    const record: MotionPresetRecord = {
      ref: { kind: "motion-preset", stableId: "slide", version: "0.1.0" },
      status: "experimental",
      schemaVersion: "1.0.0",
      customizationSchema: makeSchema(["duration"]),
      framerMotionVersion: FRAMER_MOTION_VERSION,
      framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
      sourceFiles: [{
        path: "src/presets/slide.ts",
        origin: "original",
        mediaType: "text/typescript",
        size: 768,
        checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "ghi789" },
      }],
      dependencies: [],
      examples: [{ id: "ex1", title: "Slide", description: "Slide example", config: {}, sourcePath: "ex.tsx", interactive: false }],
      performanceRecords: [{
        artifact: { kind: "motion-preset", stableId: "slide", version: "0.1.0" },
        metric: "bundle-size",
        scenario: "full import",
        environment: { operatingSystem: "linux", runtime: "node-20", tools: {}, prerequisites: [], fixtures: [] },
        result: 12,
        threshold: 5,
        unit: "kB",
        command: "npm run measure:bundle",
        status: "failed",
      }],
      reducedMotionContract: REDUCED_MOTION,
    };

    const summary = buildMotionMcpSummary(record);
    expect(summary["performanceStatus"]).toBe("failing");
  });
});
