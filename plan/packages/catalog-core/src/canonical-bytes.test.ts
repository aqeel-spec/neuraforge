import { describe, expect, it } from "vitest";

import {
  canonicalizeFileSet,
  canonicalizeJson,
  computeChecksum,
  computeFileSetChecksum,
  computeJsonChecksum,
  computeSha256Digest,
  lengthDelimit,
  normalizeLineEndings,
  normalizePath,
} from "./canonical-bytes.js";

describe("normalizePath", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizePath("src\\components\\button.tsx")).toBe("src/components/button.tsx");
  });

  it("collapses repeated separators and strips a leading ./ segment", () => {
    expect(normalizePath("./src//components///button.tsx")).toBe("src/components/button.tsx");
  });
});

describe("normalizeLineEndings", () => {
  it("normalizes CRLF and lone CR to LF", () => {
    expect(normalizeLineEndings("a\r\nb\rc\nd")).toBe("a\nb\nc\nd");
  });
});

describe("canonicalizeJson", () => {
  it("recursively sorts object keys lexicographically", () => {
    expect(canonicalizeJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalizeJson({ z: { b: 1, a: 2 }, a: [{ y: 1, x: 2 }] })).toBe(
      '{"a":[{"x":2,"y":1}],"z":{"a":2,"b":1}}',
    );
  });

  it("removes insignificant whitespace and is order-of-input independent", () => {
    const first = canonicalizeJson({ a: 1, b: 2 });
    const second = canonicalizeJson({ b: 2, a: 1 });
    expect(first).toBe(second);
    expect(first).not.toContain(" ");
  });

  it("preserves array element order", () => {
    expect(canonicalizeJson([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("lengthDelimit", () => {
  it("prefixes bytes with a 4-byte big-endian length", () => {
    const bytes = new TextEncoder().encode("abc");
    const delimited = lengthDelimit(bytes);
    expect(delimited.length).toBe(7);
    expect(new DataView(delimited.buffer).getUint32(0, false)).toBe(3);
    expect(delimited.slice(4)).toEqual(bytes);
  });
});

describe("canonicalizeFileSet", () => {
  it("produces identical bytes regardless of input file order", () => {
    const filesA = [
      { path: "b.txt", content: "second" },
      { path: "a.txt", content: "first" },
    ];
    const filesB = [
      { path: "a.txt", content: "first" },
      { path: "b.txt", content: "second" },
    ];
    expect(canonicalizeFileSet(filesA)).toEqual(canonicalizeFileSet(filesB));
  });

  it("normalizes path separators and line endings before hashing", () => {
    const withBackslashCRLF = canonicalizeFileSet([
      { path: "src\\a.txt", content: "line1\r\nline2" },
    ]);
    const withForwardSlashLF = canonicalizeFileSet([
      { path: "src/a.txt", content: "line1\nline2" },
    ]);
    expect(withBackslashCRLF).toEqual(withForwardSlashLF);
  });

  it("distinguishes byte content from equivalent-looking text content", () => {
    const asText = canonicalizeFileSet([{ path: "a.bin", content: "abc" }]);
    const asBytes = canonicalizeFileSet([
      { path: "a.bin", content: new TextEncoder().encode("abc") },
    ]);
    expect(asText).toEqual(asBytes);
  });

  it("produces different bytes for different file sets", () => {
    const one = canonicalizeFileSet([{ path: "a.txt", content: "hello" }]);
    const two = canonicalizeFileSet([{ path: "a.txt", content: "world" }]);
    expect(one).not.toEqual(two);
  });
});

describe("computeSha256Digest / computeChecksum", () => {
  it("computes the known SHA-256 digest of an empty byte sequence", async () => {
    const digest = await computeSha256Digest(new Uint8Array());
    expect(digest).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("computes a stable declared Checksum record", async () => {
    const checksum = await computeChecksum(new TextEncoder().encode("hello"));
    expect(checksum.algorithm).toBe("sha256");
    expect(checksum.canonicalization).toBe("neuraforge-canonical-v1");
    expect(checksum.digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces the same digest for the same canonical bytes and a different digest otherwise", async () => {
    const a = await computeSha256Digest(new TextEncoder().encode("abc"));
    const b = await computeSha256Digest(new TextEncoder().encode("abc"));
    const c = await computeSha256Digest(new TextEncoder().encode("abd"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("computeJsonChecksum", () => {
  it("is independent of JSON key order", async () => {
    const first = await computeJsonChecksum({ b: 1, a: 2 });
    const second = await computeJsonChecksum({ a: 2, b: 1 });
    expect(first).toEqual(second);
  });
});

describe("computeFileSetChecksum", () => {
  it("is independent of input file order (cross-channel parity)", async () => {
    const first = await computeFileSetChecksum([
      { path: "b.txt", content: "second" },
      { path: "a.txt", content: "first" },
    ]);
    const second = await computeFileSetChecksum([
      { path: "a.txt", content: "first" },
      { path: "b.txt", content: "second" },
    ]);
    expect(first).toEqual(second);
  });
});
