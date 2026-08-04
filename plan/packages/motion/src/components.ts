import type { JsonValue } from "@neuraforge-ui/schemas";

import type {
  BreakpointId,
  MotionControlName,
  MotionCustomizationSchema,
  MotionOverrideConfig,
  ReducedMotionBehavior,
  ResolvedMotionConfig,
} from "./types.js";
import { MOTION_CONTROL_NAMES } from "./types.js";
import { isApplicableControl } from "./schema.js";
import { resolveMotionConfig } from "./resolution.js";

// ---------------------------------------------------------------------------
// Accessible Animated Components and Reduced-Motion (Task 12.7)
// ---------------------------------------------------------------------------

/**
 * Whether motion is enabled, reduced, or fully disabled for a given rendering context.
 * - `"full"` — all animations play normally.
 * - `"reduced"` — continuous decorative motion is disabled; essential transitions play
 *   at their documented reduced duration.
 * - `"disabled"` — all motion is disabled; the non-animated state is rendered directly.
 */
export type MotionMode = "full" | "reduced" | "disabled";

/**
 * The semantic state preserved regardless of motion mode. When motion is reduced or
 * disabled, these properties guarantee that content, status, focus order, and primary
 * actions remain available and unchanged.
 *
 * Requirements: 5.10, 5.11, 10.7
 */
export interface SemanticState {
  /** The text/content visible to the user, preserved under all motion modes. */
  readonly content: string;
  /** The component's logical status (e.g., "open", "closed", "loading"). */
  readonly status: string;
  /** Ordered list of focusable element IDs in tab order. */
  readonly focusOrder: readonly string[];
  /** Primary interactive actions available to the user. */
  readonly primaryActions: readonly string[];
  /** Whether keyboard interaction is fully preserved. */
  readonly keyboardAccessible: true;
  /** Whether assistive technology announcements remain intact. */
  readonly assistiveTechnologyPreserved: true;
}

/**
 * The resolved animation output for a given motion mode. In `"full"` mode, all Framer
 * Motion props are active. In `"reduced"` mode, only essential transitions with capped
 * durations are active. In `"disabled"` mode, the static state is rendered directly.
 */
export interface AnimationOutput {
  readonly mode: MotionMode;
  /** Framer Motion props to apply (empty object when disabled). */
  readonly motionProps: Readonly<Record<string, JsonValue>>;
  /** Whether continuous decorative animation is active. */
  readonly decorativeMotionActive: boolean;
  /** Essential transitions that remain active (empty when disabled). */
  readonly activeEssentialTransitions: readonly string[];
  /** The guaranteed semantic state. */
  readonly semanticState: SemanticState;
}

/**
 * Resolves the animation output for a component given its motion mode, customization
 * schema, overrides, and semantic state. This function guarantees:
 *
 * - In `"full"` mode: all resolved motion config values become Framer Motion props.
 * - In `"reduced"` mode: decorative motion is stripped; only essential transitions
 *   from the `ReducedMotionBehavior` remain, with their documented reduced durations.
 * - In `"disabled"` mode: no motion props are emitted; the static state is rendered.
 *
 * In ALL modes, `SemanticState` (content, status, focus order, primary actions,
 * keyboard accessibility, and assistive technology) is preserved unchanged.
 *
 * Requirements: 5.10, 5.11, 5.12, 10.7, 10.8
 */
export function resolveAnimationOutput(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
  mode: MotionMode,
  semanticState: SemanticState,
): AnimationOutput {
  switch (mode) {
    case "disabled":
      return {
        mode: "disabled",
        motionProps: {},
        decorativeMotionActive: false,
        activeEssentialTransitions: [],
        semanticState,
      };

    case "reduced":
      return resolveReducedMode(schema, config, semanticState);

    case "full":
      return resolveFullMode(schema, config, semanticState);
  }
}

/**
 * Determines the appropriate `MotionMode` from user preferences and the component's
 * explicit motion disablement control.
 *
 * Priority:
 * 1. If the `motionDisablement` control is applicable and overridden to `true`,
 *    motion is `"disabled"`.
 * 2. If the operating system / user agent signals `prefers-reduced-motion: reduce`,
 *    motion is `"reduced"`.
 * 3. Otherwise, motion is `"full"`.
 *
 * The `prefersReducedMotion` parameter should be read from `window.matchMedia` or
 * equivalent. This function is pure and does not access the DOM.
 */
export function determineMotionMode(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
  prefersReducedMotion: boolean,
): MotionMode {
  // Check explicit disablement
  const disablementControl = schema.controls.motionDisablement;
  if (isApplicableControl(disablementControl)) {
    const overrideValue = config?.overrides?.motionDisablement;
    if (overrideValue === true) {
      return "disabled";
    }
  }

  // Check OS/user preference
  if (prefersReducedMotion) {
    return "reduced";
  }

  return "full";
}

/**
 * Resolves the list of Framer Motion props for the "full" mode. Translates the
 * resolved control values into the Framer Motion prop namespace.
 */
function resolveFullMode(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
  semanticState: SemanticState,
): AnimationOutput {
  const resolved = resolveMotionConfig(schema, config);
  const motionProps = buildMotionProps(schema, resolved);

  return {
    mode: "full",
    motionProps,
    decorativeMotionActive: true,
    activeEssentialTransitions: schema.reducedMotion.essentialTransitions.map((t) => t.id),
    semanticState,
  };
}

/**
 * Resolves the animation output for "reduced" mode. Strips all decorative motion
 * but preserves essential transitions with capped durations.
 */
function resolveReducedMode(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
  semanticState: SemanticState,
): AnimationOutput {
  const reducedMotion = schema.reducedMotion;
  const motionProps = buildReducedMotionProps(reducedMotion, schema, config);

  return {
    mode: "reduced",
    motionProps,
    decorativeMotionActive: false,
    activeEssentialTransitions: reducedMotion.essentialTransitions.map((t) => t.id),
    semanticState,
  };
}

/**
 * Builds the full Framer Motion prop set from resolved control values.
 */
function buildMotionProps(
  schema: MotionCustomizationSchema,
  resolved: ResolvedMotionConfig,
): Readonly<Record<string, JsonValue>> {
  const props: Record<string, JsonValue> = {};

  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (!isApplicableControl(control)) continue;

    const value = resolved.values[name];
    if (value === undefined) continue;

    // Map control names to Framer Motion prop names
    const framerPropMapping = mapControlToFramerProp(name, value);
    if (framerPropMapping) {
      for (const [propName, propValue] of Object.entries(framerPropMapping)) {
        props[propName] = propValue;
      }
    }
  }

  return props;
}

/**
 * Builds reduced-motion props. Only essential transitions get animation props,
 * and their durations are capped to the declared `reducedDuration`.
 */
function buildReducedMotionProps(
  reducedMotion: ReducedMotionBehavior,
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
): Readonly<Record<string, JsonValue>> {
  if (reducedMotion.essentialTransitions.length === 0) {
    return {};
  }

  // For essential transitions, use reduced durations
  const maxReducedDuration = Math.max(
    ...reducedMotion.essentialTransitions.map((t) => t.reducedDuration),
  );

  // Only preserve the transition config with capped duration
  const props: Record<string, JsonValue> = {
    transition: { duration: maxReducedDuration / 1000 },
  };

  // If initial/animate states are defined, keep them (they show the target state)
  const resolved = resolveMotionConfig(schema, config);
  const initialValue = resolved.values.initial;
  const animateValue = resolved.values.animate;

  if (initialValue !== undefined) {
    props.initial = initialValue;
  }
  if (animateValue !== undefined) {
    props.animate = animateValue;
  }

  return props;
}

/**
 * Maps a NeuraForge motion control name and value to the equivalent Framer Motion
 * prop(s). Returns null for controls that don't map directly to props (like
 * breakpointBehavior which is a meta-control).
 */
function mapControlToFramerProp(
  name: MotionControlName,
  value: JsonValue,
): Record<string, JsonValue> | null {
  switch (name) {
    case "variants":
      return { variants: value };
    case "initial":
      return { initial: value };
    case "animate":
      return { animate: value };
    case "exit":
      return { exit: value };
    case "duration":
      return { transition: { duration: value } };
    case "delay":
      return { transition: { delay: value } };
    case "repeat":
      return { transition: { repeat: value } };
    case "easing":
      return { transition: { ease: value } };
    case "springStiffness":
      return { transition: { type: "spring", stiffness: value } };
    case "springDamping":
      return { transition: { damping: value } };
    case "springMass":
      return { transition: { mass: value } };
    case "springBounce":
      return { transition: { bounce: value } };
    case "orchestration":
      return { transition: { staggerChildren: 0, delayChildren: 0, ...asObject(value) } };
    case "stagger":
      return { transition: { staggerChildren: value } };
    case "gestureDrag":
      return { drag: value };
    case "gestureHover":
      return { whileHover: value };
    case "gestureTap":
      return { whileTap: value };
    case "viewportTrigger":
      return { whileInView: value };
    case "scrollTrigger":
      return { viewport: value };
    case "layoutAnimation":
      return { layout: value };
    case "motionDisablement":
      // This is a meta-control handled by determineMotionMode, not a direct prop
      return null;
    case "breakpointBehavior":
      // This is a meta-control that affects resolution, not a direct prop
      return null;
  }
}

// ---------------------------------------------------------------------------
// Breakpoint-responsive animation
// ---------------------------------------------------------------------------

/**
 * Given a resolved config and a current breakpoint, returns the effective motion
 * props for that breakpoint. Controls that have breakpoint-specific overrides use
 * those values; others fall through to the base resolved value.
 *
 * Requirement 5.8, 5.12
 */
export function getBreakpointMotionProps(
  schema: MotionCustomizationSchema,
  config: MotionOverrideConfig | undefined,
  breakpoint: BreakpointId,
  mode: MotionMode,
): Readonly<Record<string, JsonValue>> {
  if (mode === "disabled") return {};

  const resolved = resolveMotionConfig(schema, config);
  const props: Record<string, JsonValue> = {};

  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (!isApplicableControl(control)) continue;

    // Use breakpoint value if available, otherwise base value
    const bpValues = resolved.breakpointValues[breakpoint];
    const value = bpValues[name] ?? resolved.values[name];
    if (value === undefined) continue;

    if (mode === "reduced") {
      // In reduced mode, only output essential-transition-related props
      if (name === "initial" || name === "animate") {
        const mapped = mapControlToFramerProp(name, value);
        if (mapped) Object.assign(props, mapped);
      }
      continue;
    }

    const mapped = mapControlToFramerProp(name, value);
    if (mapped) Object.assign(props, mapped);
  }

  // In reduced mode, add capped duration
  if (mode === "reduced" && schema.reducedMotion.essentialTransitions.length > 0) {
    const maxDuration = Math.max(
      ...schema.reducedMotion.essentialTransitions.map((t) => t.reducedDuration),
    );
    props.transition = { duration: maxDuration / 1000 };
  }

  return props;
}

/**
 * Detects the current active breakpoint based on viewport width.
 * Breakpoint thresholds align with Tailwind CSS defaults:
 * - sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
 *
 * Returns the largest breakpoint the viewport width satisfies, or undefined if below sm.
 * This is a pure function — pass the viewport width directly for testability.
 */
export function detectBreakpoint(viewportWidth: number): BreakpointId | undefined {
  const thresholds: readonly [BreakpointId, number][] = [
    ["2xl", 1536],
    ["xl", 1280],
    ["lg", 1024],
    ["md", 768],
    ["sm", 640],
  ];

  for (const [bp, threshold] of thresholds) {
    if (viewportWidth >= threshold) return bp;
  }

  return undefined;
}

/**
 * Validates that a `SemanticState` is preserved under motion mode change. Returns true
 * if the two states are structurally equivalent — meaning content, status, focus order,
 * and primary actions are identical.
 *
 * This is used in testing to prove Property 13: motion reduction preserves the semantic
 * interaction model.
 */
export function semanticStatesEquivalent(a: SemanticState, b: SemanticState): boolean {
  return (
    a.content === b.content &&
    a.status === b.status &&
    a.keyboardAccessible === b.keyboardAccessible &&
    a.assistiveTechnologyPreserved === b.assistiveTechnologyPreserved &&
    arraysEqual(a.focusOrder, b.focusOrder) &&
    arraysEqual(a.primaryActions, b.primaryActions)
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function asObject(value: JsonValue): Record<string, JsonValue> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return {};
}
