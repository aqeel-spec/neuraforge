import { describe, expect, it } from "vitest";

import {
  checkArtifactVersion,
  compareSemanticVersions,
  isExactSemanticVersion,
  resolveArtifactVersion,
  resolveRegistrySnapshot,
  type CatalogSnapshot,
} from "./version-resolution.js";

const CONTEXT = { requestId: "req-1" };

const VALID_CHECKSUM = {
  algorithm: "sha256",
  canonicalization: "neuraforge-canonical-v1",
  digest: "a".repeat(64),
} as const;

function entry(version: string) {
  return {
    ref: { kind: "component" as const, stableId: "button", version },
    checksum: VALID_CHECKSUM,
  };
}

describe("isExactSemanticVersion", () => {
  it("accepts exact Semantic Versions", () => {
    expect(isExactSemanticVersion("1.2.3")).toBe(true);
    expect(isExactSemanticVersion("1.0.0-beta.1")).toBe(true);
  });

  it("rejects ranges, tags, and non-strings", () => {
    expect(isExactSemanticVersion("^1.2.3")).toBe(false);
    expect(isExactSemanticVersion("latest")).toBe(false);
    expect(isExactSemanticVersion("*")).toBe(false);
    expect(isExactSemanticVersion(undefined)).toBe(false);
  });
});

describe("compareSemanticVersions", () => {
  it("orders by major, minor, patch, then prerelease", () => {
    expect(compareSemanticVersions("1.0.0", "2.0.0")).toBeLessThan(0);
    expect(compareSemanticVersions("1.1.0", "1.0.9")).toBeGreaterThan(0);
    expect(compareSemanticVersions("1.0.0-alpha", "1.0.0")).toBeLessThan(0);
    expect(compareSemanticVersions("1.0.0", "1.0.0")).toBe(0);
  });

  it("throws for a non-exact version", () => {
    expect(() => compareSemanticVersions("1.x", "1.0.0")).toThrow();
  });
});

describe("resolveArtifactVersion", () => {
  const snapshot: CatalogSnapshot = {
    registryVersion: "1.0.0",
    entries: [entry("1.0.0"), entry("1.1.0"), entry("2.0.0")],
  };

  it("resolves an exact published version", () => {
    const outcome = resolveArtifactVersion(snapshot, {
      kind: "component",
      stableId: "button",
      version: "1.1.0",
    });
    expect(outcome.resolved).toBe(true);
    if (outcome.resolved) {
      expect(outcome.version.entry.ref.version).toBe("1.1.0");
      expect(outcome.version.supportStatus).toBe("unspecified");
    }
  });

  it("never substitutes 'latest' bytes for an unpublished exact version", () => {
    const outcome = resolveArtifactVersion(snapshot, {
      kind: "component",
      stableId: "button",
      version: "1.2.0",
    });
    expect(outcome.resolved).toBe(false);
    if (!outcome.resolved) {
      expect(outcome.miss.reason).toBe("unpublished");
      expect(outcome.miss.alternatives.map((ref) => ref.version)).toEqual([
        "2.0.0",
        "1.1.0",
        "1.0.0",
      ]);
    }
  });

  it("treats a non-exact version request (range/tag) as an unpublished miss", () => {
    const outcome = resolveArtifactVersion(snapshot, {
      kind: "component",
      stableId: "button",
      version: "^1.0.0",
    });
    expect(outcome.resolved).toBe(false);
    if (!outcome.resolved) expect(outcome.miss.reason).toBe("unpublished");
  });

  it("returns support status, last-supported-in-line, nearest target, and migration for an unsupported published version", () => {
    const withRanges: CatalogSnapshot = {
      ...snapshot,
      supportedReleaseRanges: [{ kind: "component", stableId: "button", startVersion: "2.0.0" }],
      migrations: [
        {
          kind: "component",
          stableId: "button",
          fromVersion: "1.0.0",
          toVersion: "2.0.0",
          machineReadableGuideRef: "migrations/button/1-to-2.json",
          humanReadableGuideRef: "docs/migrations/button-1-to-2.md",
        },
      ],
    };

    const outcome = resolveArtifactVersion(withRanges, {
      kind: "component",
      stableId: "button",
      version: "1.0.0",
    });
    expect(outcome.resolved).toBe(false);
    if (!outcome.resolved) {
      expect(outcome.miss.reason).toBe("unsupported");
      if (outcome.miss.reason === "unsupported") {
        expect(outcome.miss.lastSupportedVersionInRequestedLine).toBeUndefined();
        expect(outcome.miss.nearestSupportedTarget?.version).toBe("2.0.0");
        expect(outcome.miss.migration?.toVersion).toBe("2.0.0");
      }
    }
  });

  it("is deterministic: identical inputs resolve identically", () => {
    const request = { kind: "component" as const, stableId: "button", version: "1.1.0" };
    expect(resolveArtifactVersion(snapshot, request)).toEqual(
      resolveArtifactVersion(snapshot, request),
    );
  });
});

describe("checkArtifactVersion", () => {
  const snapshot: CatalogSnapshot = { registryVersion: "1.0.0", entries: [entry("1.0.0")] };

  it("wraps a resolved version in an ok Result", () => {
    const result = checkArtifactVersion(
      snapshot,
      { kind: "component", stableId: "button", version: "1.0.0" },
      CONTEXT,
    );
    expect(result.ok).toBe(true);
  });

  it("wraps an unpublished miss in a not_found error envelope with alternatives", () => {
    const result = checkArtifactVersion(
      snapshot,
      { kind: "component", stableId: "button", version: "9.9.9" },
      CONTEXT,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("version_not_found");
      expect(result.error.error.category).toBe("not_found");
      expect(result.error.error.alternatives).toEqual([
        { kind: "component", stableId: "button", version: "1.0.0" },
      ]);
    }
  });
});

describe("resolveRegistrySnapshot", () => {
  const snapshots = [
    { registryVersion: "1.0.0", snapshot: { id: "snapshot-1" } },
    { registryVersion: "1.1.0", snapshot: { id: "snapshot-2" } },
  ];

  it("resolves an exact published Registry version", () => {
    const result = resolveRegistrySnapshot(snapshots, "1.1.0", CONTEXT);
    expect(result).toEqual({ ok: true, value: { id: "snapshot-2" } });
  });

  it("rejects a non-exact requested version as a validation error", () => {
    const result = resolveRegistrySnapshot(snapshots, "latest", CONTEXT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.error.category).toBe("validation");
  });

  it("returns every published Registry version as an alternative for an unknown exact version", () => {
    const result = resolveRegistrySnapshot(snapshots, "2.0.0", CONTEXT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.error.code).toBe("registry_snapshot_not_found");
      expect(result.error.error.details?.publishedRegistryVersions).toEqual(["1.1.0", "1.0.0"]);
    }
  });
});
