/**
 * Node filesystem target adapter.
 *
 * Rooted at an explicit target directory. Never infers cwd.
 * Rejects symlink/reparse-point escapes by checking real paths.
 * Uses atomic write (temp + rename) where practical.
 * Never invokes shell commands.
 */

import { readFile, writeFile, unlink, mkdir, stat, realpath, rename } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import type { Checksum } from "@neuraforge-ui/schemas";
import { canonicalizeTextBytes, computeSha256Digest } from "@neuraforge-ui/catalog-core";
import type { MutableTarget } from "./target.js";
import { validateConfinedPath, isWithinRoot } from "./path-security.js";

/**
 * Creates a MutableTarget rooted at the given absolute directory.
 * The root must be supplied explicitly — this function does not read cwd.
 */
export async function createNodeTarget(rootDir: string): Promise<MutableTarget> {
  // Normalize root to absolute and resolve any junctions/symlinks
  const absoluteRoot = await realpath(resolve(rootDir));

  function resolveAndValidate(relativePath: string): Promise<string> {
    const pathError = validateConfinedPath(relativePath);
    if (pathError) {
      return Promise.reject(
        new Error(`Path security violation: ${pathError.reason} (path: ${relativePath})`),
      );
    }

    const fullPath = join(absoluteRoot, relativePath.replace(/\//g, "/"));
    const resolvedFull = resolve(fullPath);

    // Verify it's within root (before any symlink resolution)
    if (!isWithinRoot(resolvedFull, absoluteRoot)) {
      return Promise.reject(new Error(`Path escapes root: ${relativePath}`));
    }

    return Promise.resolve(resolvedFull);
  }

  async function resolveExistingPath(relativePath: string): Promise<string> {
    const resolved = await resolveAndValidate(relativePath);

    // For existing paths, check real path to detect symlink escapes
    try {
      const real = await realpath(resolved);
      if (!isWithinRoot(real, absoluteRoot)) {
        throw new Error(`Symlink escape detected: ${relativePath} resolves to ${real}`);
      }
    } catch (err) {
      // If file doesn't exist, realpath will throw — that's ok for some operations
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }

    return resolved;
  }

  async function ensureParentWithinRoot(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    // Verify directory is within root
    if (!isWithinRoot(dir, absoluteRoot)) {
      throw new Error(`Parent directory escapes root`);
    }
    await mkdir(dir, { recursive: true });

    // Verify the created directory's real path is within root
    const realDir = await realpath(dir);
    if (!isWithinRoot(realDir, absoluteRoot)) {
      throw new Error(`Created directory resolves outside root via symlink`);
    }
  }

  const target: MutableTarget = {
    async exists(path: string): Promise<boolean> {
      const resolved = await resolveExistingPath(path);
      try {
        await stat(resolved);
        return true;
      } catch {
        return false;
      }
    },

    async readFile(path: string): Promise<string | undefined> {
      const resolved = await resolveExistingPath(path);
      try {
        // Check for symlink escape on existing file
        const real = await realpath(resolved);
        if (!isWithinRoot(real, absoluteRoot)) {
          throw new Error(`Symlink escape detected: ${path}`);
        }
        return await readFile(real, "utf-8");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          return undefined;
        }
        throw err;
      }
    },

    async checksum(path: string): Promise<Checksum | undefined> {
      const content = await target.readFile(path);
      if (content === undefined) return undefined;
      const bytes = canonicalizeTextBytes(content);
      const digest = await computeSha256Digest(bytes);
      return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
    },

    async writeFile(path: string, content: string): Promise<void> {
      const resolved = await resolveAndValidate(path);
      await ensureParentWithinRoot(resolved);

      // Verify ancestors' real paths before writing
      const parentReal = await realpath(dirname(resolved));
      if (!isWithinRoot(parentReal, absoluteRoot)) {
        throw new Error(`Parent symlink escape detected for: ${path}`);
      }

      // Atomic write: write to temp, then rename.
      // NOTE: randomBytes is used ONLY for the temporary filename to avoid collisions
      // during concurrent atomic writes. It NEVER enters any plan, bundle, checksum,
      // journal, or deterministic output. Plan determinism is unaffected.
      const tempName = `.neuraforge-tmp-${randomBytes(8).toString("hex")}`;
      const tempPath = join(dirname(resolved), tempName);
      try {
        await writeFile(tempPath, content, "utf-8");
        await rename(tempPath, resolved);
      } catch (err) {
        // Clean up temp on failure
        try {
          await unlink(tempPath);
        } catch {
          // Ignore cleanup errors
        }
        throw err;
      }
    },

    async deleteFile(path: string): Promise<void> {
      const resolved = await resolveExistingPath(path);
      try {
        // Verify real path before deletion
        const real = await realpath(resolved);
        if (!isWithinRoot(real, absoluteRoot)) {
          throw new Error(`Symlink escape detected on delete: ${path}`);
        }
        await unlink(real);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          return; // Already absent — idempotent
        }
        throw err;
      }
    },

    async ensureDir(path: string): Promise<void> {
      const resolved = await resolveAndValidate(path);
      await mkdir(resolved, { recursive: true });

      // Verify the created directory's real path
      const realDir = await realpath(resolved);
      if (!isWithinRoot(realDir, absoluteRoot)) {
        throw new Error(`Created directory resolves outside root via symlink: ${path}`);
      }
    },
  };

  return target;
}
