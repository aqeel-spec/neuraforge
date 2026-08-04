/**
 * The component authoring framework and accessibility contracts (task 3.1).
 *
 * Re-exports the shared typed-prop, state/behavior-map, accessibility-primitive
 * provenance, capability-detection, and functional-fallback contracts every editable
 * React/Tailwind Component in this package is authored against, plus small authoring
 * helpers for constructing them.
 *
 * Validates: Requirements 3.1-3.6, 10.1-10.4, 10.7, 10.8.
 */
export * from "./types.js";
export * from "./capabilities.js";
export * from "./builders.js";
