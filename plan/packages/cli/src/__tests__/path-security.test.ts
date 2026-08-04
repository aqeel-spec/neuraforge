/**
 * Path security tests.
 *
 * Tests traversal, absolute, drive, backslash, NUL, symlink escape detection.
 */

import { describe, it, expect } from "vitest";
import { validateConfinedPath, isWithinRoot } from "../path-security.js";

describe("validateConfinedPath", () => {
  it("accepts valid relative paths", () => {
    expect(validateConfinedPath("src/components/Button.tsx")).toBeUndefined();
    expect(validateConfinedPath("a/b/c")).toBeUndefined();
    expect(validateConfinedPath("file.ts")).toBeUndefined();
  });

  it("rejects empty path", () => {
    const result = validateConfinedPath("");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("empty");
  });

  it("rejects NUL bytes", () => {
    const result = validateConfinedPath("src/\0evil.ts");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("NUL");
  });

  it("rejects backslashes", () => {
    const result = validateConfinedPath("src\\evil.ts");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("backslash");
  });

  it("rejects absolute Unix paths", () => {
    const result = validateConfinedPath("/etc/passwd");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("absolute");
  });

  it("rejects drive letters", () => {
    const result = validateConfinedPath("C:/Windows/System32");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("drive");
  });

  it("rejects .. segments (directory traversal)", () => {
    const result = validateConfinedPath("src/../../../etc/passwd");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("..");
  });

  it("rejects . segments", () => {
    const result = validateConfinedPath("src/./file.ts");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("'.'");
  });

  it("rejects empty segments (double slashes)", () => {
    const result = validateConfinedPath("src//file.ts");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("empty segment");
  });

  it("rejects archive-style escapes with embedded ..", () => {
    const result = validateConfinedPath("src/..hidden/file.ts");
    expect(result).toBeDefined();
    expect(result?.reason).toContain("..");
  });

  it("rejects URI scheme prefixes", () => {
    const result = validateConfinedPath("file:///etc/passwd");
    expect(result).toBeDefined();
  });
});

describe("isWithinRoot", () => {
  it("returns true for path equal to root", () => {
    expect(isWithinRoot("C:/project", "C:/project")).toBe(true);
  });

  it("returns true for path within root", () => {
    expect(isWithinRoot("C:/project/src/file.ts", "C:/project")).toBe(true);
  });

  it("returns false for path outside root", () => {
    expect(isWithinRoot("C:/other/file.ts", "C:/project")).toBe(false);
  });

  it("returns false for path that starts with root prefix but is different dir", () => {
    expect(isWithinRoot("C:/project-evil/file.ts", "C:/project")).toBe(false);
  });

  it("handles mixed separators", () => {
    expect(isWithinRoot("C:\\project\\src\\file.ts", "C:/project")).toBe(true);
  });
});
