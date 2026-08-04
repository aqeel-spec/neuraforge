/**
 * Path security validation.
 *
 * Rejects absolute paths, drive letters, backslashes, NUL bytes, empty/dot/dot-dot
 * segments, archive-style escapes, and any path that resolves outside the confined root.
 */

export interface PathValidationError {
  readonly path: string;
  readonly reason: string;
}

/**
 * Validates that a relative path is safe and confined.
 * Returns undefined if valid, or a PathValidationError if rejected.
 */
export function validateConfinedPath(path: string): PathValidationError | undefined {
  if (path.length === 0) {
    return { path, reason: "Path must not be empty" };
  }

  // Reject NUL bytes
  if (path.includes("\0")) {
    return { path, reason: "Path must not contain NUL bytes" };
  }

  // Reject backslashes
  if (path.includes("\\")) {
    return { path, reason: "Path must not contain backslashes" };
  }

  // Reject absolute paths (Unix-style)
  if (path.startsWith("/")) {
    return { path, reason: "Path must not be absolute" };
  }

  // Reject drive letters (Windows-style: C:, D:, etc.)
  if (/^[A-Za-z]:/.test(path)) {
    return { path, reason: "Path must not contain drive letters" };
  }

  // Reject protocol-prefixed URIs that could confuse path handling
  if (/^[a-z][a-z0-9+\-.]*:/i.test(path)) {
    return { path, reason: "Path must not contain URI scheme prefixes" };
  }

  // Split into segments and validate each
  const segments = path.split("/");
  for (const segment of segments) {
    if (segment === "") {
      // Double slash / trailing slash — reject
      return { path, reason: "Path must not contain empty segments (double slashes)" };
    }
    if (segment === ".") {
      return { path, reason: "Path must not contain '.' segments" };
    }
    if (segment === "..") {
      return { path, reason: "Path must not contain '..' segments (directory traversal)" };
    }
    // Archive-style escapes that embed traversal in encoded form
    if (segment.includes("..")) {
      return { path, reason: "Path must not contain '..' in any segment" };
    }
  }

  return undefined;
}

/**
 * Validates that a resolved real path is within the confined root.
 * Both paths must be already-resolved absolute paths (from realpath/resolve).
 */
export function isWithinRoot(realPath: string, rootRealPath: string): boolean {
  // Normalize separators for comparison
  const normalizedPath = realPath.replace(/\\/g, "/").toLowerCase();
  const normalizedRoot = rootRealPath.replace(/\\/g, "/").toLowerCase();

  // The path must either equal root or start with root + "/"
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(normalizedRoot + "/");
}
