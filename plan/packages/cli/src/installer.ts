/**
 * createInstaller factory.
 *
 * Accepts a verified RegistryBundleReader and exposes search, inspect, preview,
 * apply, and rollback operations. No network fetch, auth, key, subscription,
 * entitlement, telemetry, or environment dependency.
 *
 * The reader is passed to apply for registry revalidation before any target
 * mutation. This ensures that even a caller who tampers with plan fields
 * (operation content, paths, rollback actions) will be caught by independent
 * Registry comparison.
 */

import type { RegistryBundleReader } from "@neuraforge/registry-builder";
import type { ReadOnlyTarget, MutableTarget } from "./target.js";
import type {
  InstallRequest,
  InstallPlan,
  Confirmation,
  InstallReceipt,
  InstallerResult,
  SearchResult,
  InspectResult,
  RollbackReport,
} from "./types.js";
import { search, inspect } from "./search-inspect.js";
import { preview } from "./preview.js";
import { apply } from "./apply.js";
import { rollbackFromJournal } from "./rollback.js";

/** The public Installer interface. */
export interface Installer {
  search(query: string): InstallerResult<SearchResult>;
  inspect(stableId: string, version: string): InstallerResult<InspectResult>;
  preview(request: InstallRequest, target: ReadOnlyTarget): Promise<InstallerResult<InstallPlan>>;
  apply(
    plan: InstallPlan,
    confirmation: Confirmation,
    target: MutableTarget,
  ): Promise<InstallerResult<InstallReceipt>>;
  rollback(planId: string, target: MutableTarget): Promise<InstallerResult<RollbackReport>>;
}

/**
 * Creates an Installer over a verified bundle reader.
 * The reader must already be verified (verifiedSnapshot === true).
 */
export function createInstaller(reader: RegistryBundleReader): InstallerResult<Installer> {
  if (!reader.verifiedSnapshot) {
    return {
      ok: false,
      error: {
        code: "integrity_failed",
        message: "Bundle reader must be verified before creating installer",
      },
    };
  }

  const installer: Installer = {
    search(query: string): InstallerResult<SearchResult> {
      return search(reader, query);
    },

    inspect(stableId: string, version: string): InstallerResult<InspectResult> {
      return inspect(reader, stableId, version);
    },

    preview(
      request: InstallRequest,
      target: ReadOnlyTarget,
    ): Promise<InstallerResult<InstallPlan>> {
      return preview(reader, request, target);
    },

    apply(
      plan: InstallPlan,
      confirmation: Confirmation,
      target: MutableTarget,
    ): Promise<InstallerResult<InstallReceipt>> {
      return apply(plan, confirmation, target, reader);
    },

    rollback(planId: string, target: MutableTarget): Promise<InstallerResult<RollbackReport>> {
      return rollbackFromJournal(planId, target);
    },
  };

  return { ok: true, value: installer };
}
