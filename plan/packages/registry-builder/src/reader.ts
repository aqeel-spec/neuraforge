/**
 * Read-only RegistryBundleReader over one immutable bundle.
 *
 * Verifies the bundle once before exposing data.
 * Provides exact-version getSnapshot, list summaries, component get with source content,
 * and token get. Unknown versions return typed not-found errors with alternatives.
 */

import type { ArtifactRef, Checksum, Result, SemanticVersion } from "@neuraforge-ui/schemas";
import type {
  RegistryArtifactEntry,
  RegistrySnapshot,
  RegistryTokenArtifact,
  ReleaseBundle,
} from "./types.js";
import { verifyReleaseBundle } from "./verify.js";

/** Summary of a component artifact for list operations. */
export interface ComponentSummaryFromBundle {
  readonly stableId: string;
  readonly version: SemanticVersion;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly checksum: Checksum;
}

/** Error returned when a requested version is not found. */
export interface NotFoundError {
  readonly code: "not_found";
  readonly message: string;
  readonly alternatives: readonly ArtifactRef[];
}

/**
 * Read-only reader over a single verified release bundle.
 */
export interface RegistryBundleReader {
  readonly verifiedSnapshot: boolean;

  getSnapshot(): RegistrySnapshot;
  listComponents(category?: string): readonly ComponentSummaryFromBundle[];
  getComponent(stableId: string, version: string): Result<RegistryArtifactEntry, NotFoundError>;
  getTokenArtifact(version: string): Result<RegistryTokenArtifact, NotFoundError>;
}

/**
 * Creates a RegistryBundleReader after verifying bundle integrity.
 * Returns an error if verification fails.
 */
export async function createRegistryBundleReader(
  bundle: ReleaseBundle,
): Promise<Result<RegistryBundleReader, { readonly code: string; readonly message: string }>> {
  const verification = await verifyReleaseBundle(bundle);

  if (!verification.valid) {
    return {
      ok: false,
      error: {
        code: "integrity_verification_failed",
        message: `Bundle verification failed with ${String(verification.mismatches.length)} mismatch(es): ${verification.mismatches.map((m) => m.path).join(", ")}`,
      },
    };
  }

  const reader: RegistryBundleReader = {
    verifiedSnapshot: true,

    getSnapshot(): RegistrySnapshot {
      return bundle.snapshot;
    },

    listComponents(category?: string): readonly ComponentSummaryFromBundle[] {
      let components = bundle.snapshot.components;
      if (category) {
        components = components.filter((c) => c.category === category);
      }
      return components.map((c) => ({
        stableId: c.ref.stableId,
        version: c.ref.version,
        name: c.name,
        description: c.description,
        category: c.category,
        tags: c.tags,
        checksum: c.checksum,
      }));
    },

    getComponent(stableId: string, version: string): Result<RegistryArtifactEntry, NotFoundError> {
      const found = bundle.snapshot.components.find(
        (c) => c.ref.stableId === stableId && c.ref.version === version,
      );
      if (found) {
        return { ok: true, value: found };
      }

      // Build alternatives from available versions of same stableId
      const alternatives: ArtifactRef[] = bundle.snapshot.components
        .filter((c) => c.ref.stableId === stableId)
        .map((c) => c.ref);

      return {
        ok: false,
        error: {
          code: "not_found",
          message: `Component '${stableId}@${version}' not found in this bundle`,
          alternatives,
        },
      };
    },

    getTokenArtifact(version: string): Result<RegistryTokenArtifact, NotFoundError> {
      if (bundle.snapshot.tokenArtifact.releaseVersion === version) {
        return { ok: true, value: bundle.snapshot.tokenArtifact };
      }

      return {
        ok: false,
        error: {
          code: "not_found",
          message: `Token version '${version}' not found in this bundle`,
          alternatives: [
            {
              kind: "token-set",
              stableId: "design-tokens",
              version: bundle.snapshot.tokenArtifact.releaseVersion,
            },
          ],
        },
      };
    },
  };

  return { ok: true, value: reader };
}
