/**
 * Health report — deterministic, no Date.now, no credential values.
 */

import type { JsonValue } from "@neuraforge/schemas";
import { toJsonValue } from "@neuraforge/registry-builder";
import type { EnabledInterface } from "./config-types.js";
import type { PreparedRuntime } from "./prepare.js";

export interface InterfaceStatus {
  readonly interfaceId: EnabledInterface;
  readonly status: "ready" | "disabled";
}

export interface HealthReport {
  readonly serviceVersion: string;
  readonly registryVersion: string;
  readonly configSchemaVersion: string;
  readonly bundleAddress: string;
  readonly bundleChecksum: string;
  readonly enabledInterfaces: readonly InterfaceStatus[];
}

/**
 * Generates a deterministic health report from a prepared runtime.
 * No Date.now, no credential values, no secrets.
 */
export function createHealthReport(prepared: PreparedRuntime): HealthReport {
  const allInterfaces: readonly EnabledInterface[] = ["registry", "public-api", "mcp", "docs"];
  const enabledSet = new Set(prepared.enabledInterfaces);

  const interfaceStatuses: InterfaceStatus[] = allInterfaces.map((iface) => ({
    interfaceId: iface,
    status: enabledSet.has(iface) ? ("ready" as const) : ("disabled" as const),
  }));

  return {
    serviceVersion: prepared.config.serviceVersion,
    registryVersion: prepared.bundle.snapshot.registryVersion,
    configSchemaVersion: prepared.config.configSchemaVersion,
    bundleAddress: prepared.bundle.bundleAddress,
    bundleChecksum: prepared.bundle.bundleChecksum.digest,
    enabledInterfaces: interfaceStatuses,
  };
}

/**
 * Serializes health report to JSON-safe value.
 */
export function healthReportToJson(report: HealthReport): JsonValue {
  return toJsonValue(report);
}
