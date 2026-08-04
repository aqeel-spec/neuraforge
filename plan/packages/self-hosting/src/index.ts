/**
 * @neuraforge/self-hosting — Account-free self-hosting process composition.
 *
 * No NeuraForge account, license, hosted quota, or required egress.
 * Local operation after bundle acquisition is sufficient.
 */

export const selfHostingBoundary = {
  id: "self-hosting",
  responsibility: "account-free self-hosted process composition",
  publicSource: true,
} as const;

// Config types
export type {
  SelfHostConfig,
  EnabledInterface,
  EndpointConfig,
  LocalStorageConfig,
  S3StorageConfig,
  StorageConfig,
  TlsConfig,
  ProxyConfig,
  ResourceLimits,
  ConfigValidationResult,
} from "./config-types.js";
export { CONFIG_SCHEMA_VERSION, REJECTED_CONFIG_FIELDS } from "./config-types.js";

// Config validation
export { validateSelfHostConfig } from "./validate-config.js";

// Runtime preparation
export type { PreparedRuntime, PrepareError } from "./prepare.js";
export { prepareSelfHostedRuntime } from "./prepare.js";

// Runtime start
export type { BindRequest, RuntimeBinder, StartedRuntime } from "./start.js";
export { startSelfHostedRuntime } from "./start.js";

// Docs handler
export type { DocsHandler, DocsResponse } from "./docs-handler.js";
export { createDocsHandler } from "./docs-handler.js";

// Health
export type { HealthReport, InterfaceStatus } from "./health.js";
export { createHealthReport, healthReportToJson } from "./health.js";

// Backup/restore
export type { BackupArchive, RestoreResult } from "./backup.js";
export { createBackup, restoreBackup } from "./backup.js";

// Upgrade/rollback
export type { UpgradeState } from "./upgrade.js";
export { upgradeRuntime, rollbackUpgrade } from "./upgrade.js";

// Integrity
export { verifyRuntimeIntegrity } from "./integrity.js";
