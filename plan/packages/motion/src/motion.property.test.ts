import { describe, it, expect } from "vitest";
import fc from "fast-check";

import type {
  ApplicableControl,
  MotionControl,
  MotionControlName,
  MotionCustomizationSchema,
  MotionOverrideConfig,
  ReducedMotionBehavior,
} from "./types.js";
import { MOTION_CONTROL_NAMES } from "./types.js";
import { createMotionCustomizationSchema, isApplicableControl } from "./schema.js";
import { resolveMotionConfig } from "./resolution.js";
import { validateMotionConfig } from "./validation.js";
import type { SemanticState } from "./components.js";
import { resolveAnimationOutput, determineMotionMode, semanticStatesEquivalent } from "./components.js";

// ---------------------------------------------------------------------------
// Arbitraries — reusable generators for property tests
// ---------------------------------------------------------------------------

const arbReducedMotion: fc.Arbitrary<ReducedMotionBehavior> = fc.record({
  disabledDecorativeMotion: fc.string({ minLength: 1, maxLength: 80 }),
  essentialTransitions: fc.array(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      description: fc.string({ minLength: 1, maxLength: 60 }),
      reducedDuration: fc.integer({ min: 50, max: 500 }),
    }),
    { minLength: 0, maxLength: 3 },
  ),
});

/**
 * Generates a full controls record where each of the 22 controls is randomly either
 * applicable or non-applicable based on a provided array of booleans.
 */
function buildControlsRecord(
  applicabilityFlags: readonly boolean[],
): Record<MotionControlName, MotionControl> {
  const controls = {} as Record<MotionControlName, MotionControl>;
  for (let i = 0; i < MOTION_CONTROL_NAMES.length; i++) {
    const name = MOTION_CONTROL_NAMES[i]!;
    if (applicabilityFlags[i]) {
      controls[name] = {
        applicability: "applicable",
        type: "number",
        default: 1.0,
        constraints: [],
        breakpoints: "all",
        range: { min: 0, max: 100 },
      } satisfies ApplicableControl;
    } else {
      controls[name] = {
        applicability: "not_applicable",
        reason: `Not applicable for test (control: ${name})`,
      };
    }
  }
  return controls;
}

/** Arbitrary that generates a valid MotionCustomizationSchema with random applicability. */
const arbSchema: fc.Arbitrary<MotionCustomizationSchema> = fc
  .tuple(
    fc.array(fc.boolean(), { minLength: 22, maxLength: 22 }),
    arbReducedMotion,
  )
  .map(([flags, reducedMotion]) => {
    const controls = buildControlsRecord(flags);
    return createMotionCustomizationSchema(
      { kind: "motion-preset", stableId: "test-preset", version: "1.0.0" },
      "1.0.0",
      controls,
      reducedMotion,
    );
  });

/** Generates a SemanticState with random content. */
const arbSemanticState: fc.Arbitrary<SemanticState> = fc.record({
  content: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constantFrom("open", "closed", "loading", "idle", "error"),
  focusOrder: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 0, maxLength: 5 }),
  primaryActions: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 4 }),
  keyboardAccessible: fc.constant(true as const),
  assistiveTechnologyPreserved: fc.constant(true as const),
});


// ===========================================================================
// Property 10: Motion control classification is closed and exclusive
// ===========================================================================

// Feature: neuraforge-open-source-ui, Property 10: Motion control classification is closed and exclusive
describe("Property 10: Motion control classification is closed and exclusive", () => {
  it("every control appears exactly once in any generated schema", () => {
    fc.assert(
      fc.property(arbSchema, (schema) => {
        const controlKeys = Object.keys(schema.controls) as MotionControlName[];

        // Every one of the 22 names must be present
        expect(controlKeys.length).toBe(MOTION_CONTROL_NAMES.length);
        for (const name of MOTION_CONTROL_NAMES) {
          expect(schema.controls[name]).toBeDefined();
        }

        // No duplicates (keys of a Record are unique by definition, but verify set size)
        const uniqueKeys = new Set(controlKeys);
        expect(uniqueKeys.size).toBe(MOTION_CONTROL_NAMES.length);
      }),
      { numRuns: 100 },
    );
  });

  it("applicable entries have type, default, and constraints", () => {
    fc.assert(
      fc.property(arbSchema, (schema) => {
        for (const name of MOTION_CONTROL_NAMES) {
          const control = schema.controls[name];
          if (isApplicableControl(control)) {
            expect(control.type).toBeDefined();
            expect(control.default).toBeDefined();
            expect(control.constraints).toBeDefined();
            expect(Array.isArray(control.constraints)).toBe(true);
            expect(control.breakpoints).toBeDefined();
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("non-applicable controls are never accepted as override input", () => {
    fc.assert(
      fc.property(arbSchema, (schema) => {
        // Collect non-applicable control names
        const nonApplicable: MotionControlName[] = [];
        for (const name of MOTION_CONTROL_NAMES) {
          const control = schema.controls[name];
          if (!isApplicableControl(control)) {
            nonApplicable.push(name);
          }
        }

        if (nonApplicable.length === 0) return;

        // Attempt to override each non-applicable control
        for (const name of nonApplicable) {
          const config: MotionOverrideConfig = {
            overrides: { [name]: 42 } as Partial<Record<MotionControlName, number>>,
          };
          const result = validateMotionConfig(schema, config);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            const fault = result.faults.find((f) => f.path === `overrides.${name}`);
            expect(fault).toBeDefined();
            expect(fault!.code).toBe("non_applicable");
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("the MOTION_CONTROL_NAMES array contains exactly 22 entries", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(MOTION_CONTROL_NAMES.length).toBe(22);
        const unique = new Set(MOTION_CONTROL_NAMES);
        expect(unique.size).toBe(22);
      }),
      { numRuns: 100 },
    );
  });
});


// ===========================================================================
// Property 11: Valid motion overrides resolve exactly
// ===========================================================================

// Feature: neuraforge-open-source-ui, Property 11: Valid motion overrides resolve exactly
describe("Property 11: Valid motion overrides resolve exactly", () => {
  it("every supplied override appears in resolved values", () => {
    fc.assert(
      fc.property(
        arbSchema.chain((schema) => {
          // Get applicable controls with numeric type and range
          const applicable: MotionControlName[] = [];
          for (const name of MOTION_CONTROL_NAMES) {
            const control = schema.controls[name];
            if (isApplicableControl(control) && control.type === "number" && control.range) {
              applicable.push(name);
            }
          }

          if (applicable.length === 0) {
            return fc.constant({ schema, overrides: {} as Partial<Record<MotionControlName, number>> });
          }

          // Generate random valid overrides for a subset of applicable controls
          const overrideArb = fc
            .subarray(applicable, { minLength: 1, maxLength: applicable.length })
            .chain((selectedControls) => {
              const entries = selectedControls.map((name) => {
                const control = schema.controls[name] as ApplicableControl;
                const min = control.range!.min;
                const max = control.range!.max;
                return fc.double({ min, max, noNaN: true }).map((v) => [name, v] as const);
              });
              return fc.tuple(...entries).map((pairs) => {
                const obj: Partial<Record<MotionControlName, number>> = {};
                for (const [k, v] of pairs) {
                  obj[k] = v;
                }
                return obj;
              });
            });

          return overrideArb.map((overrides) => ({ schema, overrides }));
        }),
        ({ schema, overrides }) => {
          const config: MotionOverrideConfig = {
            overrides: overrides as Partial<Record<MotionControlName, number>>,
          };
          const resolved = resolveMotionConfig(schema, config);

          // Every supplied override must appear in the resolved values
          for (const [name, value] of Object.entries(overrides)) {
            expect(resolved.values[name as MotionControlName]).toBe(value);
            expect(resolved.appliedOverrides).toContain(name);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("omitted applicable controls use schema defaults", () => {
    fc.assert(
      fc.property(arbSchema, (schema) => {
        // Resolve with no overrides at all
        const resolved = resolveMotionConfig(schema, {});

        for (const name of MOTION_CONTROL_NAMES) {
          const control = schema.controls[name];
          if (isApplicableControl(control)) {
            expect(resolved.values[name]).toEqual(control.default);
            expect(resolved.appliedDefaults).toContain(name);
          } else {
            expect(resolved.values[name]).toBeUndefined();
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("no unsupported control is introduced in resolved output", () => {
    fc.assert(
      fc.property(arbSchema, (schema) => {
        const config: MotionOverrideConfig = {};
        const resolved = resolveMotionConfig(schema, config);

        // Every key in resolved.values must be a valid control name
        for (const key of Object.keys(resolved.values)) {
          expect((MOTION_CONTROL_NAMES as readonly string[]).includes(key)).toBe(true);
        }

        // appliedOverrides + appliedDefaults should only reference valid control names
        for (const entry of resolved.appliedOverrides) {
          // May contain breakpoint-prefixed entries like "sm.duration"
          const controlPart = entry.includes(".") ? entry.split(".")[1]! : entry;
          expect((MOTION_CONTROL_NAMES as readonly string[]).includes(controlPart)).toBe(true);
        }
        for (const entry of resolved.appliedDefaults) {
          expect((MOTION_CONTROL_NAMES as readonly string[]).includes(entry)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});


// ===========================================================================
// Property 12: Invalid motion configurations report all faults
// ===========================================================================

// Feature: neuraforge-open-source-ui, Property 12: Invalid motion configurations report all faults
describe("Property 12: Invalid motion configurations report all faults", () => {
  it("wrong type overrides produce wrong_type faults", () => {
    fc.assert(
      fc.property(
        arbSchema.filter((schema) => {
          // Need at least one applicable numeric control
          return MOTION_CONTROL_NAMES.some((name) => {
            const c = schema.controls[name];
            return isApplicableControl(c) && c.type === "number";
          });
        }),
        (schema) => {
          // Find a numeric control and supply a string value (wrong type)
          const numericControl = MOTION_CONTROL_NAMES.find((name) => {
            const c = schema.controls[name];
            return isApplicableControl(c) && c.type === "number";
          })!;

          const config: MotionOverrideConfig = {
            overrides: { [numericControl]: "not-a-number" } as Partial<Record<MotionControlName, string>>,
          };

          const result = validateMotionConfig(schema, config);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            const fault = result.faults.find((f) => f.path === `overrides.${numericControl}`);
            expect(fault).toBeDefined();
            expect(fault!.code).toBe("wrong_type");
            expect(fault!.constraint).toBeDefined();
            expect(fault!.guidance).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("unknown fields produce unknown_field faults", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          arbSchema,
          fc.string({ minLength: 10, maxLength: 30 }).filter(
            (s) => !(MOTION_CONTROL_NAMES as readonly string[]).includes(s),
          ),
        ),
        ([schema, unknownField]) => {
          const config: MotionOverrideConfig = {
            overrides: { [unknownField]: 42 } as unknown as Partial<Record<MotionControlName, number>>,
          };

          const result = validateMotionConfig(schema, config);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            const fault = result.faults.find((f) => f.code === "unknown_field");
            expect(fault).toBeDefined();
            expect(fault!.path).toBe(`overrides.${unknownField}`);
            expect(fault!.constraint).toBeDefined();
            expect(fault!.guidance).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("non-applicable control overrides produce non_applicable faults", () => {
    fc.assert(
      fc.property(
        arbSchema.filter((schema) => {
          return MOTION_CONTROL_NAMES.some((name) => !isApplicableControl(schema.controls[name]));
        }),
        (schema) => {
          const nonApplicableName = MOTION_CONTROL_NAMES.find(
            (name) => !isApplicableControl(schema.controls[name]),
          )!;

          const config: MotionOverrideConfig = {
            overrides: { [nonApplicableName]: true } as Partial<Record<MotionControlName, boolean>>,
          };

          const result = validateMotionConfig(schema, config);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            const fault = result.faults.find((f) => f.path === `overrides.${nonApplicableName}`);
            expect(fault).toBeDefined();
            expect(fault!.code).toBe("non_applicable");
            expect(fault!.constraint).toBeDefined();
            expect(fault!.guidance).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("out-of-range values produce out_of_range faults", () => {
    fc.assert(
      fc.property(
        arbSchema.filter((schema) => {
          return MOTION_CONTROL_NAMES.some((name) => {
            const c = schema.controls[name];
            return isApplicableControl(c) && c.type === "number" && c.range !== undefined;
          });
        }),
        (schema) => {
          const rangedControl = MOTION_CONTROL_NAMES.find((name) => {
            const c = schema.controls[name];
            return isApplicableControl(c) && c.type === "number" && c.range !== undefined;
          })!;
          const control = schema.controls[rangedControl] as ApplicableControl;
          const outOfRange = control.range!.max + 1000;

          const config: MotionOverrideConfig = {
            overrides: { [rangedControl]: outOfRange } as Partial<Record<MotionControlName, number>>,
          };

          const result = validateMotionConfig(schema, config);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            const fault = result.faults.find((f) => f.path === `overrides.${rangedControl}`);
            expect(fault).toBeDefined();
            expect(fault!.code).toBe("out_of_range");
            expect(fault!.constraint).toBeDefined();
            expect(fault!.guidance).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("every fault has code, path, constraint, and guidance fields", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          arbSchema,
          fc.array(
            fc.oneof(
              fc.constant("__unknown_field__"),
              fc.constant("__another_unknown__"),
            ),
            { minLength: 1, maxLength: 3 },
          ),
        ),
        ([schema, invalidEntries]) => {
          // Build an override config with multiple invalid entries
          const overrides: Record<string, string> = {};
          for (const entry of invalidEntries) {
            overrides[entry] = "invalid";
          }

          const config: MotionOverrideConfig = {
            overrides: overrides as unknown as Partial<Record<MotionControlName, string>>,
          };

          const result = validateMotionConfig(schema, config);
          if (!result.valid) {
            for (const fault of result.faults) {
              expect(fault.code).toBeDefined();
              expect(typeof fault.code).toBe("string");
              expect(fault.path).toBeDefined();
              expect(typeof fault.path).toBe("string");
              expect(fault.constraint).toBeDefined();
              expect(typeof fault.constraint).toBe("string");
              expect(fault.guidance).toBeDefined();
              expect(typeof fault.guidance).toBe("string");
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});


// ===========================================================================
// Property 13: Motion reduction preserves the semantic interaction model
// ===========================================================================

// Feature: neuraforge-open-source-ui, Property 13: Motion reduction preserves the semantic interaction model
describe("Property 13: Motion reduction preserves the semantic interaction model", () => {
  /** Schema with animate/initial controls always applicable for this property. */
  const arbSchemaWithAnimateInitial: fc.Arbitrary<MotionCustomizationSchema> = fc
    .tuple(
      fc.array(fc.boolean(), { minLength: 22, maxLength: 22 }),
      arbReducedMotion,
    )
    .map(([flags, reducedMotion]) => {
      const controls = buildControlsRecord(flags);
      // Force initial and animate to be applicable with variant-map type
      controls.initial = {
        applicability: "applicable",
        type: "variant-map",
        default: { opacity: 0 },
        constraints: [],
        breakpoints: "all",
      };
      controls.animate = {
        applicability: "applicable",
        type: "variant-map",
        default: { opacity: 1 },
        constraints: [],
        breakpoints: "all",
      };
      return createMotionCustomizationSchema(
        { kind: "motion-preset", stableId: "animated-component", version: "1.0.0" },
        "1.0.0",
        controls,
        reducedMotion,
      );
    });

  it("resolveAnimationOutput preserves semantic state across all three modes", () => {
    fc.assert(
      fc.property(
        fc.tuple(arbSchemaWithAnimateInitial, arbSemanticState),
        ([schema, semanticState]) => {
          const config: MotionOverrideConfig = {};

          const fullOutput = resolveAnimationOutput(schema, config, "full", semanticState);
          const reducedOutput = resolveAnimationOutput(schema, config, "reduced", semanticState);
          const disabledOutput = resolveAnimationOutput(schema, config, "disabled", semanticState);

          // Semantic state must be identical across all three modes
          expect(semanticStatesEquivalent(fullOutput.semanticState, semanticState)).toBe(true);
          expect(semanticStatesEquivalent(reducedOutput.semanticState, semanticState)).toBe(true);
          expect(semanticStatesEquivalent(disabledOutput.semanticState, semanticState)).toBe(true);

          // Cross-mode equivalence
          expect(semanticStatesEquivalent(fullOutput.semanticState, reducedOutput.semanticState)).toBe(true);
          expect(semanticStatesEquivalent(reducedOutput.semanticState, disabledOutput.semanticState)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("disabled mode emits no motion props but keeps semantic state", () => {
    fc.assert(
      fc.property(
        fc.tuple(arbSchemaWithAnimateInitial, arbSemanticState),
        ([schema, semanticState]) => {
          const config: MotionOverrideConfig = {
            overrides: { initial: { opacity: 0 }, animate: { opacity: 1 } },
          };

          const output = resolveAnimationOutput(schema, config, "disabled", semanticState);

          expect(output.mode).toBe("disabled");
          expect(Object.keys(output.motionProps).length).toBe(0);
          expect(output.decorativeMotionActive).toBe(false);
          expect(output.activeEssentialTransitions.length).toBe(0);
          expect(output.semanticState.content).toBe(semanticState.content);
          expect(output.semanticState.status).toBe(semanticState.status);
          expect(output.semanticState.keyboardAccessible).toBe(true);
          expect(output.semanticState.assistiveTechnologyPreserved).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("reduced mode disables decorative motion", () => {
    fc.assert(
      fc.property(
        fc.tuple(arbSchemaWithAnimateInitial, arbSemanticState),
        ([schema, semanticState]) => {
          const config: MotionOverrideConfig = {};
          const output = resolveAnimationOutput(schema, config, "reduced", semanticState);

          expect(output.mode).toBe("reduced");
          expect(output.decorativeMotionActive).toBe(false);
          // Semantic state preserved
          expect(semanticStatesEquivalent(output.semanticState, semanticState)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("determineMotionMode returns correct mode based on preferences", () => {
    fc.assert(
      fc.property(
        fc.tuple(arbSchemaWithAnimateInitial, fc.boolean()),
        ([schema, prefersReduced]) => {
          // Without explicit disablement override
          const mode = determineMotionMode(schema, {}, prefersReduced);

          if (prefersReduced) {
            expect(mode).toBe("reduced");
          } else {
            expect(mode).toBe("full");
          }

          // With explicit disablement (if control is applicable)
          const disableControl = schema.controls.motionDisablement;
          if (isApplicableControl(disableControl)) {
            const disabledMode = determineMotionMode(
              schema,
              { overrides: { motionDisablement: true } },
              prefersReduced,
            );
            expect(disabledMode).toBe("disabled");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("semantic state fields are preserved byte-for-byte across mode transitions", () => {
    fc.assert(
      fc.property(
        fc.tuple(arbSchemaWithAnimateInitial, arbSemanticState),
        ([schema, semanticState]) => {
          const modes = ["full", "reduced", "disabled"] as const;
          const outputs = modes.map((mode) =>
            resolveAnimationOutput(schema, {}, mode, semanticState),
          );

          for (const output of outputs) {
            expect(output.semanticState.content).toBe(semanticState.content);
            expect(output.semanticState.status).toBe(semanticState.status);
            expect(output.semanticState.focusOrder).toEqual(semanticState.focusOrder);
            expect(output.semanticState.primaryActions).toEqual(semanticState.primaryActions);
            expect(output.semanticState.keyboardAccessible).toBe(true);
            expect(output.semanticState.assistiveTechnologyPreserved).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
