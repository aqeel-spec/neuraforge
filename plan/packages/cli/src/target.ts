/**
 * Target interfaces for filesystem abstraction.
 *
 * ReadOnlyTarget is the seam for preview (no writes by construction).
 * MutableTarget extends it with write/delete operations for apply/rollback.
 */

import type { Checksum } from "@neuraforge/schemas";

/** Read-only view of a target directory, used during preview. */
export interface ReadOnlyTarget {
  /** Returns true if the path exists in the target. */
  readonly exists: (path: string) => Promise<boolean>;

  /** Reads file content as UTF-8 string. Returns undefined if not found. */
  readonly readFile: (path: string) => Promise<string | undefined>;

  /** Computes the SHA-256 checksum of a file. Returns undefined if not found. */
  readonly checksum: (path: string) => Promise<Checksum | undefined>;
}

/** Mutable target that adds write/delete operations. */
export interface MutableTarget extends ReadOnlyTarget {
  /** Writes a file atomically (via temp + rename where possible). Creates parent directories. */
  readonly writeFile: (path: string, content: string) => Promise<void>;

  /** Deletes a file. Does not fail if already absent. */
  readonly deleteFile: (path: string) => Promise<void>;

  /** Ensures a directory exists (creates parents as needed). */
  readonly ensureDir: (path: string) => Promise<void>;
}
