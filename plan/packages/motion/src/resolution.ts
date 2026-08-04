import type { JsonValue } from "@neuraforge/schemas";

import type {
  BreakpointId,
  MotionControlName,
  MotionCustomizationSchema,
  MotionOverrideConfig,
  ResolvedMotionConfig,
} from "./types.js";
import { BREAKPOINT_IDS, MOTION_CONTROL_NAMES } from "./types.js";
import { isApplicableControl } from "./schema.js";

// ---------------------------------------------------------------------------
// Motion Default and Override Resolution (Task 12.3)
// ---------------------------------------------------------------------------

/**
 * Resolves a complete motion configuration by applying valid overrides on top of the
 * schema defaults. For every applicable control:
 * - If the consumer supplies a valid override, use it.
 * - Otherwise, use the schema's declared default.
 * Non-applicable controls are never exposed in the resolved configuration (their value
 * is `undefined`).
 *
 * This function does NOT validate the overrides — that is the job of `validateMotionConfig`
 * (Task 12.5). It assumes overrides have already been validated or will be validated
 * separately. If an override targets a non-applicable control, it is silently ignored
 * (the validation layer reports it as a fault instead).
 *
 * Requirements: 5.7, 5.8, 12.15
 */
export function resolveMotionConfig(
  schema: MotionCustomizationSchema,
  config?: MotionOverrideConfig,
): ResolvedMotionConfig {
  const values = {} as Record<MotionControlName, JsonValue | undefined>;
  const breakpointValues = {} as Record<
    BreakpointId,
    Record<MotionControlName, JsonValue | undefined>
  >;
  const appliedOverrides: string[] = [];
  const appliedDefaults: string[] = [];

  // Initialize breakpoint maps
  for (const bp of BREAKPOINT_IDS) {
    breakpointValues[bp] = {} as Record<MotionControlName, JsonValue | undefined>;
  }

  // Resolve each control
  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];

    if (!isApplicableControl(control)) {
      // Non-applicable: never expose in resolved config
      values[name] = undefined;
      for (const bp of BREAKPOINT_IDS) {
        breakpointValues[bp][name] = undefined;
      }
      continue;
    }

    // Resolve base value: override takes priority over default
    const overrideValue = config?.overrides?.[name];
    if (overrideValue !== undefined) {
      values[name] = overrideValue;
      appliedOverrides.push(name);
    } else {
      values[name] = control.default;
      appliedDefaults.push(name);
    }

    // Resolve per-breakpoint values
    for (const bp of BREAKPOINT_IDS) {
      const bpOverride = config?.breakpointOverrides?.[bp]?.[name];

      // Check if this control supports this breakpoint
      const supportsBreakpoint = controlSupportsBreakpoint(control.breakpoints, bp);

      if (supportsBreakpoint && bpOverride !== undefined) {
        breakpointValues[bp][name] = bpOverride;
        appliedOverrides.push(`${bp}.${name}`);
      } else {
        // Fall through to base value (already resolved above)
        breakpointValues[bp][name] = values[name];
      }
    }
  }

  return {
    values: values as Readonly<Record<MotionControlName, JsonValue | undefined>>,
    breakpointValues: breakpointValues as Readonly<
      Record<BreakpointId, Readonly<Record<MotionControlName, JsonValue | undefined>>>
    >,
    appliedOverrides,
    appliedDefaults,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a control's breakpoint specification supports the given breakpoint.
 * - `"all"` means every breakpoint is supported.
 * - `"none"` means no breakpoints are supported (responsive overrides are not allowed).
 * - An array of `BreakpointId` means only those specific breakpoints are supported.
 */
function controlSupportsBreakpoint(
  breakpoints: readonly BreakpointId[] | "all" | "none",
  bp: BreakpointId,
): boolean {
  if (breakpoints === "all") return true;
  if (breakpoints === "none") return false;
  return breakpoints.includes(bp);
}

/**
 * Returns the list of applicable control names that have declared breakpoint support
 * (either `"all"` or an explicit list of breakpoints). Useful for determining which
 * controls can accept responsive overrides.
 */
export function getBreakpointSupportedControls(
  schema: MotionCustomizationSchema,
): MotionControlName[] {
  const result: MotionControlName[] = [];
  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (isApplicableControl(control) && control.breakpoints !== "none") {
      result.push(name);
    }
  }
  return result;
}

/**
 * Returns the default values for all applicable controls in the schema. This is the
 * "zero-override" resolved configuration — what you get when no consumer overrides are
 * supplied.
 */
export function getSchemaDefaults(
  schema: MotionCustomizationSchema,
): Readonly<Record<MotionControlName, JsonValue | undefined>> {
  return resolveMotionConfig(schema).values;
}
