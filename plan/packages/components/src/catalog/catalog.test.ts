import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeTextBytes,
  computeFileSetChecksum,
  computeSha256Digest,
} from "@neuraforge-ui/catalog-core";
import {
  buildMvpCatalog,
  getStableComponentCatalog,
  resetCatalogCache,
  validateComponentRecord,
  validateComponentCatalog,
  projectComponentRecord,
} from "./index.js";
import type { ComponentRecord } from "../contracts/types.js";
import { BEHAVIOR_KEYS } from "../contracts/types.js";

describe("MVP catalog integrity", () => {
  let catalog: readonly ComponentRecord[];

  beforeAll(async () => {
    resetCatalogCache();
    catalog = await buildMvpCatalog();
  });

  it("contains exactly 20 stable component records", () => {
    expect(catalog).toHaveLength(20);
    for (const record of catalog) {
      expect(record.status).toBe("stable");
    }
  });

  it("covers all six categories", () => {
    const categories = new Set(catalog.map((r) => r.category));
    expect(categories).toEqual(
      new Set(["navigation", "layout", "forms", "feedback", "data-display", "marketing"]),
    );
  });

  it("has unique stableIds", () => {
    const ids = catalog.map((r) => r.ref.stableId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is sorted by stableId (deterministic ordering)", () => {
    const ids = catalog.map((r) => r.ref.stableId);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  it("every record passes validateComponentRecord", () => {
    for (const record of catalog) {
      const result = validateComponentRecord(record);
      expect(
        result.errors,
        `Validation failed for ${record.ref.stableId}: ${JSON.stringify(result.errors)}`,
      ).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it("validateComponentCatalog accepts the full catalog", () => {
    const result = validateComponentCatalog(catalog);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("getStableComponentCatalog returns the same result on subsequent calls", async () => {
    resetCatalogCache();
    const first = await getStableComponentCatalog();
    const second = await getStableComponentCatalog();
    expect(first).toBe(second);
  });

  it("recomputes every declared checksum from the exact published source bytes", async () => {
    const { readFile } = await import("node:fs/promises");

    for (const record of catalog) {
      const files = await Promise.all(
        record.sourceFiles.map(async (file) => {
          const relativeToCatalog = file.path.startsWith("src/")
            ? `../${file.path.slice(4)}`
            : file.path;
          const content = await readFile(new URL(relativeToCatalog, import.meta.url), "utf8");
          const fileDigest = await computeSha256Digest(canonicalizeTextBytes(content));
          expect(file.checksum.digest).toBe(fileDigest);
          expect(file.size).toBe(canonicalizeTextBytes(content).length);
          return { path: file.path, content };
        }),
      );

      const recomputed = await computeFileSetChecksum(files);
      expect(record.checksum).toEqual(recomputed);
    }
  });
});

describe("validateComponentRecord error accumulation", () => {
  it("does not throw on null/undefined/primitives", () => {
    expect(() => validateComponentRecord(null)).not.toThrow();
    expect(() => validateComponentRecord(undefined)).not.toThrow();
    expect(() => validateComponentRecord(42)).not.toThrow();
    expect(() => validateComponentRecord("hello")).not.toThrow();
  });

  it("reports NOT_OBJECT for non-object input", () => {
    const result = validateComponentRecord(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe("NOT_OBJECT");
  });

  it("accumulates multiple independent errors for a malformed record", () => {
    const malformed = {
      ref: { kind: "wrong", stableId: "", version: "" },
      status: "unknown",
      category: "invalid",
      sourceFiles: "not-an-array",
      generatedFiles: [],
      dependencies: [],
      peerDependencies: [],
      compatibility: [],
      installation: [],
      checksum: { algorithm: "md5", canonicalization: "", digest: "short" },
      provenance: [],
      documentationPath: "",
      props: [],
      supportedStates: [],
      behavior: {},
      accessibilityPrimitive: {},
      capability: {},
      reducedMotion: {},
      examples: [],
      performanceBudgets: [],
      performanceRecords: [],
    };
    const result = validateComponentRecord(malformed);
    expect(result.valid).toBe(false);
    // Should have many errors, not just the first
    expect(result.errors.length).toBeGreaterThan(5);
    // Check some specific codes
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("INVALID_REF_KIND");
    expect(codes).toContain("INVALID_REF_STABLE_ID");
    expect(codes).toContain("INVALID_STATUS");
    expect(codes).toContain("INVALID_CATEGORY");
    expect(codes).toContain("INVALID_FILE_RECORDS");
    expect(codes).toContain("INVALID_CHECKSUM_ALGORITHM");
    expect(codes).toContain("INVALID_CHECKSUM_DIGEST");
    expect(codes).toContain("EMPTY_PROVENANCE");
    expect(codes).toContain("INVALID_DOCUMENTATION_PATH");
    expect(codes).toContain("EMPTY_STATES");
  });

  it("rejects unknown top-level fields", () => {
    const withExtra = {
      ref: { kind: "component", stableId: "test", version: "1.0.0" },
      status: "stable",
      unknownField: true,
      anotherUnknown: 42,
    };
    const result = validateComponentRecord(withExtra);
    expect(result.valid).toBe(false);
    const unknownErrors = result.errors.filter((e) => e.code === "UNKNOWN_FIELD");
    expect(unknownErrors.length).toBe(2);
    expect(unknownErrors.map((e) => e.path).sort()).toEqual(["anotherUnknown", "unknownField"]);
  });

  it("rejects incomplete behavior map (missing keys)", () => {
    const partial = {
      ref: { kind: "component", stableId: "x", version: "1.0.0" },
      status: "stable",
      category: "forms",
      sourceFiles: [],
      generatedFiles: [],
      dependencies: [],
      peerDependencies: [],
      compatibility: [],
      installation: [{ step: 1, description: "install" }],
      checksum: { algorithm: "sha256", canonicalization: "v1", digest: "a".repeat(64) },
      provenance: [
        {
          name: "x",
          version: "1.0.0",
          source: "x",
          copyright: "x",
          spdxIdentifier: "MIT",
          licenseTextPath: "x",
          attribution: "x",
          redistributionObligations: [],
          reviewStatus: "approved",
        },
      ],
      documentationPath: "/docs/x",
      props: [{ name: "x", type: "string", required: true, description: "test" }],
      supportedStates: [{ name: "default", description: "default state" }],
      behavior: { keyboard: { status: "supported", contract: "test" } }, // Only one key
      accessibilityPrimitive: { usesExternalPrimitive: false },
      capability: { requiresOptionalCapability: false },
      reducedMotion: { includesAnimationOrMotion: false },
      examples: [{ id: "ex1", title: "Ex", description: "Ex", props: {}, sourcePath: "x.tsx" }],
      performanceBudgets: [{ metric: "bundle-size", threshold: 5, unit: "KB" }],
      performanceRecords: [
        {
          artifact: { kind: "component", stableId: "x", version: "1.0.0" },
          metric: "bundle-size",
          scenario: "prod",
          environment: {
            operatingSystem: "linux",
            runtime: "node",
            tools: {},
            prerequisites: [],
            fixtures: [],
          },
          result: 3,
          threshold: 5,
          unit: "KB",
          command: "build",
          status: "passed",
        },
      ],
    };
    const result = validateComponentRecord(partial);
    expect(result.valid).toBe(false);
    const missingBehavior = result.errors.filter((e) => e.code === "MISSING_BEHAVIOR_KEY");
    // Should be missing 6 of 7 keys
    expect(missingBehavior.length).toBe(BEHAVIOR_KEYS.length - 1);
  });

  it("rejects invalid checksum digest", () => {
    const result = validateComponentRecord({
      ref: { kind: "component", stableId: "x", version: "1.0.0" },
      checksum: { algorithm: "sha256", canonicalization: "v1", digest: "not-hex" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_CHECKSUM_DIGEST")).toBe(true);
  });

  it("provides actionable error data (code, path, constraint, guidance)", () => {
    const result = validateComponentRecord({});
    expect(result.valid).toBe(false);
    for (const error of result.errors) {
      expect(error.code).toBeTruthy();
      expect(error.path).toBeTruthy();
      expect(error.constraint).toBeTruthy();
      expect(error.guidance).toBeTruthy();
    }
  });
});

describe("projectComponentRecord", () => {
  let catalog: readonly ComponentRecord[];

  beforeAll(async () => {
    resetCatalogCache();
    catalog = await buildMvpCatalog();
  });

  it("produces deterministic JSON-safe output (no functions)", () => {
    for (const record of catalog) {
      const projection = projectComponentRecord(record);
      const json = JSON.stringify(projection);
      expect(json).toBeDefined();
      // Verify no [object Function] in serialization
      expect(json).not.toContain("[object Function]");
      // Re-parse and compare
      const reparsed = JSON.parse(json) as object;
      expect(reparsed).toEqual(JSON.parse(JSON.stringify(projection)));
    }
  });

  it("preserves capability ID and fallback without the detector function", () => {
    const dataTable = catalog.find((r) => r.ref.stableId === "data-table");
    expect(dataTable).toBeDefined();
    if (!dataTable) return;
    const projection = projectComponentRecord(dataTable);
    if (projection.capability.requiresOptionalCapability) {
      expect(projection.capability.capability).toBe("container-queries");
      expect(projection.capability.fallback.preservesContent).toBe(true);
      expect(projection.capability.fallback.preservesPrimaryActions).toBe(true);
      // No detection function
      expect("detection" in projection.capability).toBe(false);
    }
  });

  it("is immutable (frozen)", () => {
    const record = catalog[0];
    if (!record) return;
    const projection = projectComponentRecord(record);
    expect(Object.isFrozen(projection)).toBe(true);
  });

  it("prevents caller mutation from affecting source catalog", () => {
    const record = catalog[0];
    if (!record) return;
    const projection = projectComponentRecord(record);
    // Try to mutate the projection's deep data (would throw in strict mode due to freeze)
    expect(() => {
      const mutable = projection as unknown as Record<string, unknown>;
      mutable.status = "experimental";
    }).toThrow();
  });

  it("projection is deterministic across multiple calls", () => {
    for (const record of catalog) {
      const p1 = projectComponentRecord(record);
      const p2 = projectComponentRecord(record);
      expect(JSON.stringify(p1)).toBe(JSON.stringify(p2));
    }
  });
});
