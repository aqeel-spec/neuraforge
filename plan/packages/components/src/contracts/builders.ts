import { BEHAVIOR_KEYS } from "./types.js";
import type {
  AccessibilityPrimitiveDeclaration,
  BehaviorEntry,
  BehaviorKey,
  BehaviorMap,
} from "./types.js";

/**
 * Authoring helpers that make it convenient to declare a total `BehaviorMap` and the
 * other closed either/or contracts without hand-writing every key. These helpers are
 * pure construction utilities for component authors; they do not validate untrusted
 * data (that is the Registry projection/validation task's responsibility).
 */

/** Declares a behavior dimension as implemented, with its documented contract text. */
export function supported(contract: string): BehaviorEntry {
  return { status: "supported", contract };
}

/** Declares a behavior dimension as intentionally unsupported, with its reason. */
export function notApplicable(reason: string): BehaviorEntry {
  return { status: "not_applicable", reason };
}

/**
 * Builds a total `BehaviorMap` from a partial map plus a default applied to every
 * omitted `BehaviorKey`. This keeps individual component files concise (declare only
 * the behaviors that differ from the shared default) while guaranteeing the resulting
 * object is total over `BEHAVIOR_KEYS`, satisfying Property 6's totality requirement.
 */
export function behaviorMap(
  overrides: Partial<BehaviorMap>,
  fallback: BehaviorEntry = notApplicable("No behavior declared for this component."),
): BehaviorMap {
  const map = {} as Record<BehaviorKey, BehaviorEntry>;
  for (const key of BEHAVIOR_KEYS) {
    map[key] = overrides[key] ?? fallback;
  }
  return map;
}

/** Declares that the component uses no external accessibility primitive. */
export function noExternalPrimitive(): AccessibilityPrimitiveDeclaration {
  return { usesExternalPrimitive: false };
}
