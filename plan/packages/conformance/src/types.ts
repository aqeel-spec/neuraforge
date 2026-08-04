/**
 * Conformance report and adapter types.
 * All types are JSON-safe — no functions, no class instances, no undefined.
 */

import type { JsonValue } from "@neuraforge/schemas";

/** Result of a single conformance case. */
export interface ConformanceCaseResult {
  readonly caseName: string;
  readonly passed: boolean;
  readonly mismatchDetails: readonly ConformanceMismatch[];
}

/** Detail of a single mismatch found in a case. */
export interface ConformanceMismatch {
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
}

/** The full conformance report — JSON-safe, deterministic. */
export interface ConformanceReport {
  readonly schemaVersion: "1.0.0";
  readonly bundleAddress: string;
  readonly bundleChecksum: string;
  readonly totalCases: number;
  readonly passed: number;
  readonly failed: number;
  readonly cases: readonly ConformanceCaseResult[];
}

/** Adapter for conformance testing over a single verified bundle. */
export interface ConformanceAdapters {
  readonly registry: RegistryAdapter;
  readonly publicApi: PublicApiAdapter;
  readonly mcp: McpAdapter;
}

/** Registry reader adapter for conformance. */
export interface RegistryAdapter {
  getSnapshot(): Promise<JsonValue>;
  listComponents(category?: string): Promise<JsonValue>;
  getComponent(stableId: string, version: string): Promise<JsonValue>;
  getTokenArtifact(version: string): Promise<JsonValue>;
}

/** Public API adapter for conformance. */
export interface PublicApiAdapter {
  handle(
    method: string,
    path: string,
    query?: Record<string, string>,
  ): Promise<{
    readonly status: number;
    readonly body: JsonValue;
  }>;
}

/** MCP dispatcher adapter for conformance. */
export interface McpAdapter {
  dispatch(operation: string, input: JsonValue, context: JsonValue): Promise<JsonValue>;
}
