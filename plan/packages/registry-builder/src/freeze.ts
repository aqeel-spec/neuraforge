/**
 * Deep-freeze utility for release bundles.
 *
 * Recursively freezes all objects, arrays, and nested records.
 * Ensures no input object references can mutate the bundle after construction.
 */

/**
 * Recursively deep-freezes a value and all nested objects/arrays.
 * Returns the frozen value (same reference, now immutable).
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  // Already frozen — skip traversal
  if (Object.isFrozen(value)) return value;

  Object.freeze(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item);
    }
  } else {
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }

  return value;
}

/**
 * Deep-clones a JSON-safe value via structured serialization.
 * Used to ensure no input references leak into the bundle.
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
