/**
 * Self-hosting configuration types and constants.
 *
 * Closed versioned schema. No NeuraForge account/license/hosted fields.
 * No external network dependencies for runtime operation.
 */

import type { FieldError } from "@neuraforge/schemas";

export const CONFIG_SCHEMA_VERSION = "1.0.0";

export type EnabledInterface = "registry" | "public-api" | "mcp" | "docs";

export interface EndpointConfig {
  readonly host: string;
  readonly port: number;
  readonly basePath: string;
}

export interface LocalStorageConfig {
  readonly type: "local";
  readonly root: string;
}

export interface S3StorageConfig {
  readonly type: "s3-compatible";
  readonly endpoint: string;
  readonly bucket: string;
  readonly credentialRef: string;
}

export type StorageConfig = LocalStorageConfig | S3StorageConfig;

export interface TlsConfig {
  readonly enabled: boolean;
  readonly certRef?: string;
  readonly keyRef?: string;
}

export interface ProxyConfig {
  readonly enabled: boolean;
  readonly upstreamRef?: string;
}

export interface ResourceLimits {
  readonly memoryMB: number;
  readonly maxConcurrentRequests: number;
  readonly mcpCallsPerMinute: number;
}

export interface SelfHostConfig {
  readonly configSchemaVersion: typeof CONFIG_SCHEMA_VERSION;
  readonly serviceVersion: string;
  readonly enabledInterfaces: readonly EnabledInterface[];
  readonly endpoints: Readonly<Record<EnabledInterface, EndpointConfig>>;
  readonly storage: StorageConfig;
  readonly backupStorage: StorageConfig;
  readonly retentionDays: number;
  readonly resourceLimits: ResourceLimits;
  readonly tls: TlsConfig;
  readonly proxy: ProxyConfig;
  readonly telemetry: false;
}

/** Rejection fields that must never be present in config. */
export const REJECTED_CONFIG_FIELDS = [
  "account",
  "licenseKey",
  "hostedPlan",
  "subscription",
  "payment",
  "quota",
] as const;

export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly FieldError[];
  readonly config?: SelfHostConfig;
}
