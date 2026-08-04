import type { JsonValue } from "@neuraforge-ui/schemas";

/**
 * Projects an unknown value to the closed JSON data model used by canonicalization.
 * Undefined object properties are omitted, matching JSON.stringify; undefined array entries and
 * non-finite numbers are rejected because they would not have a stable JSON representation.
 */
export function toJsonValue(value: unknown, path = "$", seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} must be a finite JSON number`);
    return value;
  }
  if (typeof value !== "object") {
    throw new TypeError(`${path} contains a non-JSON ${typeof value} value`);
  }
  if (seen.has(value)) throw new TypeError(`${path} contains a circular reference`);
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((entry, index) => {
        if (entry === undefined) {
          throw new TypeError(`${path}[${String(index)}] cannot be undefined`);
        }
        return toJsonValue(entry, `${path}[${String(index)}]`, seen);
      });
    }

    const projected: Record<string, JsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) projected[key] = toJsonValue(entry, `${path}.${key}`, seen);
    }
    return projected;
  } finally {
    seen.delete(value);
  }
}
