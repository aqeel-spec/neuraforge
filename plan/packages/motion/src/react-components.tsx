/**
 * Runtime React components that use Framer Motion for animation.
 * These are the actual renderable components agents install into projects.
 *
 * @ts-nocheck — This file depends on framer-motion (peer dependency).
 * Type checking is deferred to consumer projects that install the peer dep.
 */

// @ts-nocheck

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import type { MotionCustomizationSchema, MotionOverrideConfig } from "./types.js";
import { resolveMotionConfig } from "./resolution.js";
import { determineMotionMode } from "./components.js";
import { isApplicableControl } from "./schema.js";

// ---------------------------------------------------------------------------
// AnimatedContainer — wraps children with a motion preset
// ---------------------------------------------------------------------------

export interface AnimatedContainerProps {
  /** The motion customization schema for this animation. */
  schema: MotionCustomizationSchema;
  /** Optional overrides to apply on top of schema defaults. */
  config?: MotionOverrideConfig;
  /** Children to animate. */
  children: React.ReactNode;
  /** HTML element to render (default: div). */
  as?: keyof typeof motion;
  /** Additional className for styling. */
  className?: string;
  /** Whether to animate on mount. */
  animateOnMount?: boolean;
  /** Unique key for AnimatePresence. */
  layoutId?: string;
}

/**
 * A container that applies a Framer Motion preset to its children.
 * Automatically respects prefers-reduced-motion and the motionDisablement control.
 */
export function AnimatedContainer({
  schema,
  config,
  children,
  as = "div",
  className,
  animateOnMount = true,
  layoutId,
}: AnimatedContainerProps): React.JSX.Element {
  const prefersReduced = useReducedMotion() ?? false;
  const mode = determineMotionMode(schema, config, prefersReduced);
  const resolved = resolveMotionConfig(schema, config);

  // Build Framer Motion props from resolved config
  const motionProps: Record<string, unknown> = {};

  if (mode === "disabled") {
    // No animation — render static
    return React.createElement(as, { className }, children);
  }

  // Apply initial/animate/exit if applicable
  const initialCtrl = schema.controls.initial;
  const animateCtrl = schema.controls.animate;
  const exitCtrl = schema.controls.exit;

  if (mode === "full") {
    if (isApplicableControl(initialCtrl) && animateOnMount) {
      motionProps.initial = resolved.values.initial;
    }
    if (isApplicableControl(animateCtrl)) {
      motionProps.animate = resolved.values.animate;
    }
    if (isApplicableControl(exitCtrl)) {
      motionProps.exit = resolved.values.exit;
    }

    // Build transition object
    const transition: Record<string, unknown> = {};
    if (isApplicableControl(schema.controls.duration)) {
      transition.duration = resolved.values.duration;
    }
    if (isApplicableControl(schema.controls.delay)) {
      transition.delay = resolved.values.delay;
    }
    if (isApplicableControl(schema.controls.easing)) {
      transition.ease = resolved.values.easing;
    }
    if (isApplicableControl(schema.controls.springStiffness)) {
      transition.type = "spring";
      transition.stiffness = resolved.values.springStiffness;
      transition.damping = resolved.values.springDamping;
      transition.mass = resolved.values.springMass;
    }
    if (Object.keys(transition).length > 0) {
      motionProps.transition = transition;
    }
  } else {
    // Reduced mode — minimal transition for essential state changes only
    if (isApplicableControl(animateCtrl)) {
      motionProps.animate = resolved.values.animate;
    }
    if (schema.reducedMotion.essentialTransitions.length > 0) {
      const maxDuration = Math.max(...schema.reducedMotion.essentialTransitions.map((t) => t.reducedDuration));
      motionProps.transition = { duration: maxDuration / 1000 };
    } else {
      motionProps.transition = { duration: 0 };
    }
  }

  if (layoutId) {
    motionProps.layoutId = layoutId;
  }

  const MotionComponent = motion[as] as React.ComponentType<Record<string, unknown>>;

  return React.createElement(MotionComponent, { className, ...motionProps }, children);
}

// ---------------------------------------------------------------------------
// AnimatedList — staggered children animations
// ---------------------------------------------------------------------------

export interface AnimatedListProps {
  /** The motion schema (should have orchestration/stagger applicable). */
  schema: MotionCustomizationSchema;
  /** Optional overrides. */
  config?: MotionOverrideConfig;
  /** Each item to animate. */
  children: React.ReactNode[];
  /** Container className. */
  className?: string;
  /** Individual item className. */
  itemClassName?: string;
}

/**
 * Renders a list of items with staggered animation.
 * Falls back to static rendering when motion is disabled/reduced.
 */
export function AnimatedList({
  schema,
  config,
  children,
  className,
  itemClassName,
}: AnimatedListProps): React.JSX.Element {
  const prefersReduced = useReducedMotion() ?? false;
  const mode = determineMotionMode(schema, config, prefersReduced);
  const resolved = resolveMotionConfig(schema, config);

  if (mode === "disabled") {
    return React.createElement(
      "div",
      { className },
      children.map((child, i) => React.createElement("div", { key: i, className: itemClassName }, child)),
    );
  }

  const staggerDelay = isApplicableControl(schema.controls.stagger)
    ? (resolved.values.stagger as number ?? 0.1)
    : 0.1;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay } },
  };

  const itemVariants = mode === "full"
    ? {
        hidden: resolved.values.initial ?? { opacity: 0, y: 20 },
        visible: resolved.values.animate ?? { opacity: 1, y: 0 },
      }
    : {
        hidden: {},
        visible: {},
      };

  return React.createElement(
    motion.div,
    { className, variants: containerVariants, initial: "hidden", animate: "visible" },
    children.map((child, i) =>
      React.createElement(motion.div, { key: i, className: itemClassName, variants: itemVariants }, child),
    ),
  );
}

// ---------------------------------------------------------------------------
// AnimatedPresence — exit animations wrapper
// ---------------------------------------------------------------------------

export interface AnimatedPresenceProps {
  /** Children with key-based mount/unmount. */
  children: React.ReactNode;
  /** AnimatePresence mode. */
  mode?: "sync" | "wait" | "popLayout";
}

/**
 * Wraps AnimatePresence from Framer Motion.
 * Children must have unique keys for exit animations to work.
 */
export function AnimatedPresenceWrapper({
  children,
  mode = "sync",
}: AnimatedPresenceProps): React.JSX.Element {
  return React.createElement(AnimatePresence, { mode }, children);
}
