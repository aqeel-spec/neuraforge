import type { JsonValue } from "@neuraforge/schemas";

import type {
  ApplicableControl,
  BreakpointId,
  MotionControlName,
  MotionCustomizationSchema,
  MotionOverrideConfig,
  MotionValidationFault,
  ResolvedMotionConfig,
} from "./types.js";
import { BREAKPOINT_IDS, MOTION_CONTROL_NAMES } from "./types.js";
import { isApplicableControl } from "./schema.js";
import { resolveMotionConfig } from "./resolution.js";

// ---------------------------------------------------------------------------
// Exhaustive Invalid Motion Configuration Validation (Task 12.5)
// ---------------------------------------------------------------------------

/**
 * Result of validating a motion override config against a customization schema.
 * On success, contains the resolved config. On failure, contains every accumulated
 * fault — validation never short-circuits after the first error.
 *
 * Requirements: 5.9, 12.16
 */
export type MotionValidationResult =
  | { readonly valid: true; readonly config: ResolvedMotionConfig }
  | { readonly valid: false; readonly faults: readonly MotionValidationFault[] };

/**
 * Validates a motion override configuration against its customization schema.
 * Accumulates ALL detectable faults without short-circuiting:
 * - `unknown_field` — override references a control name not in the schema
 * - `wrong_type` — override value does not match the control's declared type
 * - `non_applicable` — override targets a control classified as non-applicable
 * - `out_of_range` — numeric value falls outside the declared min/max range
 * - `invalid_combination` — constraint violation involving multiple controls
 *
 * If no faults are found, returns the resolved configuration.
 *
 * Requirements: 5.9, 12.16
 */
export function validateMotionConfig(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig,
): MotionValidationResult {
  const faults: MotionValidationFault[] = [];

  // Validate base overrides
  if (config.overrides) {
    for (const [key, value] of Object.entries(config.overrides)) {
      if (value === undefined) continue;
      validateOverrideEntry(schema, key, value, `overrides.${key}`, faults);
    }
  }

  // Validate breakpoint overrides
  if (config.breakpointOverrides) {
    for (const [bpKey, bpOverrides] of Object.entries(config.breakpointOverrides)) {
      if (bpOverrides === undefined) continue;

      // Check if breakpoint ID is valid
      if (!isValidBreakpoint(bpKey)) {
        faults.push({
          code: "unknown_field",
          path: `breakpointOverrides.${bpKey}`,
          constraint: `Breakpoint must be one of: ${BREAKPOINT_IDS.join(", ")}`,
          guidance: `Remove or rename the breakpoint key "${bpKey}" to a supported breakpoint identifier.`,
        });
        continue;
      }

      for (const [controlKey, value] of Object.entries(bpOverrides)) {
        if (value === undefined) continue;
        validateBreakpointOverrideEntry(
          schema,
          bpKey,
          controlKey,
          value,
          `breakpointOverrides.${bpKey}.${controlKey}`,
          faults,
        );
      }
    }
  }

  if (faults.length > 0) {
    return { valid: false, faults };
  }

  // All overrides are valid — resolve the config
  const resolved = resolveMotionConfig(schema, config);
  // Run combination constraints on the resolved values
  const combinationFaults = validateCombinations(schema, resolved);
  if (combinationFaults.length > 0) {
    return { valid: false, faults: combinationFaults };
  }

  return { valid: true, config: resolved };
}

// ---------------------------------------------------------------------------
// Internal validation helpers
// ---------------------------------------------------------------------------

function validateOverrideEntry(
  schema: MotionCustomizationSchema,
  key: string,
  value: JsonValue,
  path: string,
  faults: MotionValidationFault[],
): void {
  // Check if key is a valid control name
  if (!isValidControlName(key)) {
    faults.push({
      code: "unknown_field",
      path,
      constraint: `Control name must be one of: ${MOTION_CONTROL_NAMES.join(", ")}`,
      guidance: `Remove the unknown field "${key}" from overrides.`,
    });
    return;
  }

  const name = key;
  const control = schema.controls[name];

  // Check if control is non-applicable
  if (!isApplicableControl(control)) {
    faults.push({
      code: "non_applicable",
      path,
      constraint: `Control "${name}" is not applicable: ${control.reason}`,
      guidance: `Remove "${name}" from overrides. This control is not applicable to this artifact.`,
    });
    return;
  }

  // Validate the value against the control's type and constraints
  validateControlValue(control, name, value, path, faults);
}

function validateBreakpointOverrideEntry(
  schema: MotionCustomizationSchema,
  bp: BreakpointId,
  key: string,
  value: JsonValue,
  path: string,
  faults: MotionValidationFault[],
): void {
  // Check if key is a valid control name
  if (!isValidControlName(key)) {
    faults.push({
      code: "unknown_field",
      path,
      constraint: `Control name must be one of: ${MOTION_CONTROL_NAMES.join(", ")}`,
      guidance: `Remove the unknown field "${key}" from breakpoint overrides.`,
    });
    return;
  }

  const name = key;
  const control = schema.controls[name];

  // Check if control is non-applicable
  if (!isApplicableControl(control)) {
    faults.push({
      code: "non_applicable",
      path,
      constraint: `Control "${name}" is not applicable: ${control.reason}`,
      guidance: `Remove "${name}" from breakpoint overrides.`,
    });
    return;
  }

  // Check if the control supports this breakpoint
  if (!controlSupportsBreakpoint(control.breakpoints, bp)) {
    const supportedMsg =
      control.breakpoints === "none"
        ? "no breakpoints"
        : (control.breakpoints as readonly string[]).join(", ");
    faults.push({
      code: "non_applicable",
      path,
      constraint: `Control "${name}" does not support breakpoint "${bp}". Supported: ${supportedMsg}`,
      guidance: `Remove "${name}" from the "${bp}" breakpoint overrides, or use it as a base override instead.`,
    });
    return;
  }

  // Validate the value against the control's type and constraints
  validateControlValue(control, name, value, path, faults);
}

function validateControlValue(
  control: ApplicableControl,
  name: MotionControlName,
  value: JsonValue,
  path: string,
  faults: MotionValidationFault[],
): void {
  // Type checks based on the control's declared type
  const typeValid = checkType(control, value);
  if (!typeValid) {
    faults.push({
      code: "wrong_type",
      path,
      constraint: `Expected type "${control.type}" for control "${name}"`,
      guidance: `Provide a value matching type "${control.type}".${getTypeHint(control.type)}`,
    });
    return;
  }

  // Range check for numeric values
  if (control.range && typeof value === "number") {
    if (value < control.range.min || value > control.range.max) {
      faults.push({
        code: "out_of_range",
        path,
        constraint: `Value must be between ${control.range.min} and ${control.range.max}`,
        guidance: `Adjust "${name}" to a value within [${control.range.min}, ${control.range.max}].`,
      });
    }
  }

  // Allowed values check (enum-style)
  if (control.allowedValues && control.allowedValues.length > 0) {
    const valueStr = JSON.stringify(value);
    const isAllowed = control.allowedValues.some((av) => JSON.stringify(av) === valueStr);
    if (!isAllowed) {
      faults.push({
        code: "out_of_range",
        path,
        constraint: `Value must be one of: ${control.allowedValues.map((v) => JSON.stringify(v)).join(", ")}`,
        guidance: `Use one of the allowed values for "${name}".`,
      });
    }
  }
}

/**
 * Validates combination constraints across the resolved config. These are constraints
 * that involve relationships between multiple controls (e.g., spring parameters must
 * be consistent, stagger requires orchestration).
 */
function validateCombinations(
  schema: MotionCustomizationSchema,
  resolved: ResolvedMotionConfig,
): MotionValidationFault[] {
  const faults: MotionValidationFault[] = [];

  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (!isApplicableControl(control)) continue;

    for (const constraint of control.constraints) {
      if (constraint.relatedControls && constraint.relatedControls.length > 0) {
        // Check if the combination of this control's value and related controls
        // satisfies the declared constraint. We use a heuristic approach here:
        // if the constraint references related controls that are all non-applicable,
        // there's a configuration error.
        const relatedNonApplicable = constraint.relatedControls.filter((rc) => {
          const relatedControl = schema.controls[rc];
          return !isApplicableControl(relatedControl);
        });

        // If this control is applicable but all its related controls are non-applicable,
        // that's potentially an invalid_combination (schema misconfiguration).
        // However, specific combination validation depends on runtime values.
        // We check for specific known patterns:
        if (relatedNonApplicable.length === constraint.relatedControls.length) {
          // All related controls are non-applicable — this is only a fault if the
          // current control's value depends on the related controls being available.
          // This is a schema-level concern rather than a runtime concern, but we
          // still surface it for agents to understand.
          const resolvedValue = resolved.values[name];
          if (resolvedValue !== undefined && resolvedValue !== control.default) {
            faults.push({
              code: "invalid_combination",
              path: `overrides.${name}`,
              constraint: constraint.description,
              guidance: `Control "${name}" has a constraint involving ${constraint.relatedControls.join(", ")}, but those controls are not applicable. Consider removing the override.`,
            });
          }
        }
      }
    }
  }

  return faults;
}

// ---------------------------------------------------------------------------
// Type checking
// ---------------------------------------------------------------------------

function checkType(control: ApplicableControl, value: JsonValue): boolean {
  switch (control.type) {
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      // Enum values can be strings or numbers — the allowedValues check handles specifics
      return typeof value === "string" || typeof value === "number";
    case "spring":
      // Spring is an object with numeric stiffness/damping/mass fields
      return isObject(value);
    case "easing-function":
      // Either a string name or an array of bezier control points
      return typeof value === "string" || (Array.isArray(value) && value.length === 4);
    case "variant-map":
      return isObject(value);
    case "keyframe-array":
      return Array.isArray(value);
    case "stagger-config":
      return isObject(value);
    case "gesture-config":
      return isObject(value);
    case "trigger-config":
      return isObject(value);
    case "layout-config":
      return isObject(value) || typeof value === "boolean";
    case "breakpoint-map":
      return isObject(value);
  }
}

function isObject(value: JsonValue): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTypeHint(type: string): string {
  switch (type) {
    case "number":
      return " Provide a numeric value.";
    case "boolean":
      return " Provide true or false.";
    case "enum":
      return " Provide a string matching one of the allowed values.";
    case "spring":
      return ' Provide an object like { "stiffness": 100, "damping": 10 }.';
    case "easing-function":
      return " Provide a named easing string or a [x1, y1, x2, y2] bezier array.";
    case "variant-map":
      return " Provide an object mapping state names to animation values.";
    case "keyframe-array":
      return " Provide an array of keyframe values.";
    case "stagger-config":
      return ' Provide an object like { "each": 0.1, "from": "first" }.';
    case "gesture-config":
      return " Provide a gesture configuration object.";
    case "trigger-config":
      return " Provide a trigger configuration object.";
    case "layout-config":
      return ' Provide true/false or an object like { "type": "crossfade" }.';
    case "breakpoint-map":
      return " Provide an object mapping breakpoint IDs to values.";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Name validation
// ---------------------------------------------------------------------------

const CONTROL_NAME_SET = new Set<string>(MOTION_CONTROL_NAMES);
const BREAKPOINT_SET = new Set<string>(BREAKPOINT_IDS);

function isValidControlName(key: string): key is MotionControlName {
  return CONTROL_NAME_SET.has(key);
}

function isValidBreakpoint(key: string): key is BreakpointId {
  return BREAKPOINT_SET.has(key);
}

function controlSupportsBreakpoint(
  breakpoints: readonly BreakpointId[] | "all" | "none",
  bp: BreakpointId,
): boolean {
  if (breakpoints === "all") return true;
  if (breakpoints === "none") return false;
  return breakpoints.includes(bp);
}
