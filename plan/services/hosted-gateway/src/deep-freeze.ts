/**
 * Recursively freezes an object graph so published hosted models (Pricing Versions in
 * particular) cannot be mutated after construction, regardless of how a caller obtains
 * a reference to them.
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}
