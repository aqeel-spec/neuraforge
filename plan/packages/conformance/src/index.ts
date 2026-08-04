/**
 * @neuraforge/conformance — Shared transport-neutral conformance harness.
 *
 * Runs deterministic named cases over one verified bundle using adapters for:
 * - Registry reader (RegistryBundleReader)
 * - Public API handler
 * - MCP dispatcher
 *
 * Returns a JSON-safe ConformanceReport. Never hides failures.
 * Tampered/unverified bundles fail construction/report — never pass.
 */

export const conformanceBoundary = {
  id: "conformance",
  responsibility: "shared public and self-hosted conformance cases",
  publicSource: true,
} as const;

export type { ConformanceReport, ConformanceCaseResult, ConformanceAdapters } from "./types.js";
export { runMvpConformance } from "./harness.js";
export { CONFORMANCE_CASE_NAMES } from "./cases.js";
export { runAdvancedConformance, ADVANCED_CONFORMANCE_CASE_NAMES } from "./advanced-cases.js";
export type { AdvancedConformanceInput, AdvancedConformanceCaseName } from "./advanced-cases.js";
