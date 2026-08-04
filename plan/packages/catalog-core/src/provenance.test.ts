import { describe, expect, it } from "vitest";

import {
  traverseProductionInventory,
  validateDependencyInventoryItem,
  validateDependencyReplacementRecord,
  validateLicenseProvenance,
} from "./provenance.js";

const VALID_PROVENANCE = {
  name: "react",
  version: "19.0.0",
  source: "https://registry.npmjs.org/react/-/react-19.0.0.tgz",
  copyright: "Copyright (c) Meta Platforms, Inc.",
  spdxIdentifier: "MIT",
  licenseTextPath: "licenses/react/LICENSE",
  attribution: "React",
  redistributionObligations: [],
  reviewStatus: "approved",
} as const;

const VALID_CHECKSUM = {
  algorithm: "sha256",
  canonicalization: "neuraforge-canonical-v1",
  digest: "a".repeat(64),
} as const;

const VALID_DEPENDENCY = {
  name: "react",
  version: "19.0.0",
  relationship: "direct",
  materialType: "dependency",
  source: "https://registry.npmjs.org/react/-/react-19.0.0.tgz",
  checksum: VALID_CHECKSUM,
  provenance: VALID_PROVENANCE,
} as const;

describe("validateLicenseProvenance", () => {
  it("accepts complete, approved, resolvable provenance", () => {
    expect(validateLicenseProvenance(VALID_PROVENANCE)).toEqual({
      valid: true,
      errors: [],
      rejectionReasons: [],
    });
  });

  it("rejects a non-object candidate as incomplete provenance", () => {
    const result = validateLicenseProvenance(null);
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toEqual(["incomplete_provenance"]);
  });

  it("rejects a reviewed-incompatible license", () => {
    const result = validateLicenseProvenance({ ...VALID_PROVENANCE, reviewStatus: "rejected" });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("incompatible_license");
  });

  it("rejects a pending review as incomplete provenance", () => {
    const result = validateLicenseProvenance({ ...VALID_PROVENANCE, reviewStatus: "pending" });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("incomplete_provenance");
  });

  it("rejects an unresolvable source reference", () => {
    const result = validateLicenseProvenance({ ...VALID_PROVENANCE, source: "not-a-uri" });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("unresolved_source");
  });

  it("accumulates every missing required field in one pass", () => {
    const result = validateLicenseProvenance({
      ...VALID_PROVENANCE,
      name: "",
      version: "",
      copyright: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(["provenance.name", "provenance.version", "provenance.copyright"]),
    );
  });
});

describe("validateDependencyInventoryItem", () => {
  it("accepts a complete direct dependency item", () => {
    expect(validateDependencyInventoryItem(VALID_DEPENDENCY)).toEqual({
      valid: true,
      errors: [],
      rejectionReasons: [],
    });
  });

  it("accepts a complete transitive dependency item", () => {
    const result = validateDependencyInventoryItem({
      ...VALID_DEPENDENCY,
      relationship: "transitive",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects an unresolved (range) dependency version", () => {
    const result = validateDependencyInventoryItem({ ...VALID_DEPENDENCY, version: "^19.0.0" });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("unresolved_source");
  });

  it("rejects a 'latest' moving-target version", () => {
    const result = validateDependencyInventoryItem({ ...VALID_DEPENDENCY, version: "latest" });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("unresolved_source");
  });

  it("rejects an invalid relationship value", () => {
    const result = validateDependencyInventoryItem({
      ...VALID_DEPENDENCY,
      relationship: "indirect",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.path === "dependency.relationship")).toBe(true);
  });

  it("propagates nested provenance incompatibility", () => {
    const result = validateDependencyInventoryItem({
      ...VALID_DEPENDENCY,
      provenance: { ...VALID_PROVENANCE, reviewStatus: "rejected" },
    });
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("incompatible_license");
  });
});

describe("traverseProductionInventory", () => {
  it("partitions valid entries into direct and transitive", () => {
    const result = traverseProductionInventory([
      VALID_DEPENDENCY,
      { ...VALID_DEPENDENCY, name: "react-dom", relationship: "transitive" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.direct).toHaveLength(1);
    expect(result.transitive).toHaveLength(1);
  });

  it("rejects the traversal when any reachable node is incomplete or incompatible", () => {
    const result = traverseProductionInventory([
      VALID_DEPENDENCY,
      {
        ...VALID_DEPENDENCY,
        name: "bad-dep",
        provenance: { ...VALID_PROVENANCE, reviewStatus: "rejected" },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.rejectionReasons).toContain("incompatible_license");
    // The valid entry is still retained even though the traversal overall is ineligible.
    expect(result.direct).toHaveLength(1);
  });

  it("accepts an empty inventory", () => {
    expect(traverseProductionInventory([])).toEqual({
      valid: true,
      errors: [],
      rejectionReasons: [],
      direct: [],
      transitive: [],
    });
  });
});

describe("validateDependencyReplacementRecord", () => {
  const VALID_REPLACEMENT = {
    previousItem: VALID_DEPENDENCY,
    replacementItem: { ...VALID_DEPENDENCY, name: "preact", version: "10.0.0" },
    changeRationale: "Replaced due to bundle size concerns.",
    reviewer: "maintainer-1",
    approvalDate: "2026-01-15",
  };

  it("accepts a complete auditable replacement record", () => {
    expect(validateDependencyReplacementRecord(VALID_REPLACEMENT)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects a missing rationale, reviewer, or approval date", () => {
    const result = validateDependencyReplacementRecord({
      ...VALID_REPLACEMENT,
      changeRationale: "",
      reviewer: "",
      approvalDate: "not-a-date",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "replacement.changeRationale",
        "replacement.reviewer",
        "replacement.approvalDate",
      ]),
    );
  });

  it("rejects a no-op replacement with an identical name and version", () => {
    const result = validateDependencyReplacementRecord({
      ...VALID_REPLACEMENT,
      replacementItem: VALID_DEPENDENCY,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "no_op_replacement")).toBe(true);
  });

  it("rejects an invalid calendar date such as an out-of-range day", () => {
    const result = validateDependencyReplacementRecord({
      ...VALID_REPLACEMENT,
      approvalDate: "2026-02-30",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.path === "replacement.approvalDate")).toBe(true);
  });
});
