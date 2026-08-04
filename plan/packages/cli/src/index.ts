#!/usr/bin/env node
/**
 * @neuraforge-ui/cli — Transactional, verified, open-source component installer.
 *
 * Exposes:
 * - Strict JSON-safe types for all operations
 * - ReadOnlyTarget / MutableTarget interfaces
 * - createInstaller(reader) factory
 * - createNodeTarget(rootDir) filesystem adapter
 * - runCli(argv, io, installer) command adapter
 * - Path security utilities
 *
 * No external dependencies. No network fetch, auth, key, subscription,
 * entitlement, usage collection, or environment dependency.
 */

export const cliBoundary = {
  id: "cli",
  responsibility: "verified public artifact discovery and installation",
  publicSource: true,
} as const;

// Types
export type {
  InstallRequest,
  InstallPlan,
  TargetPrecondition,
  FileChange,
  FileChangeKind,
  DependencyChange,
  RollbackAction,
  RollbackActionKind,
  Confirmation,
  InstallJournal,
  JournalBackup,
  InstallReceipt,
  RollbackReport,
  RollbackCompletedAction,
  InstallerError,
  InstallerErrorCode,
  InstallerResult,
  SearchResult,
  SearchResultItem,
  InspectResult,
  ApplyOperation,
} from "./types.js";

// Target interfaces
export type { ReadOnlyTarget, MutableTarget } from "./target.js";

// Installer
export type { Installer } from "./installer.js";
export { createInstaller } from "./installer.js";

// Node filesystem target
export { createNodeTarget } from "./node-target.js";

// CLI command adapter
export { runCli } from "./cli.js";
export type { CliIO, CliOptions } from "./cli.js";

// Path security (exported for testing/conformance)
export { validateConfinedPath, isWithinRoot } from "./path-security.js";

// Plan integrity (exported for testing/conformance)
export { verifyPlanIntegrity, computePlanChecksum, derivePlanId } from "./plan-integrity.js";
export type { PlanIntegrityResult } from "./plan-integrity.js";
