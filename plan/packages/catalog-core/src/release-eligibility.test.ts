import { describe, expect, it } from "vitest";

import { checkReleaseEligibility, evaluateReleaseEligibility } from "./release-eligibility.js";

const VALID_ACCESS = {
  visibility: "public",
  entitlement: "none",
  paymentRequired: false,
  licenseKeyRequired: false,
  privateVariant: false,
  paidOnlyVariant: false,
} as const;

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

const VALID_ARTIFACT = {
  ref: { kind: "component" as const, stableId: "neuraforge/button", version: "1.0.0" },
  access: VALID_ACCESS,
};

describe("evaluateReleaseEligibility", () => {
  it("accepts a release with entitlement-free artifacts and complete provenance", () => {
    const { result, fieldErrors } = evaluateReleaseEligibility({
      artifacts: [VALID_ARTIFACT],
      productionInventory: [VALID_DEPENDENCY],
    });
    expect(result.eligible).toBe(true);
    expect(result.rejectionCategories).toEqual([]);
    expect(fieldErrors).toEqual([]);
  });

  it("applies the same policy to an advanced-capability artifact as an MVP artifact", () => {
    const advancedArtifact = {
      ref: { kind: "motion-preset" as const, stableId: "neuraforge/fade-in", version: "1.0.0" },
      access: VALID_ACCESS,
    };
    const { result } = evaluateReleaseEligibility({
      artifacts: [VALID_ARTIFACT, advancedArtifact],
      productionInventory: [],
    });
    expect(result.eligible).toBe(true);
  });

  it("rejects a release containing a private or paid-only artifact", () => {
    const { result } = evaluateReleaseEligibility({
      artifacts: [
        {
          ref: VALID_ARTIFACT.ref,
          access: { ...VALID_ACCESS, privateVariant: true, paymentRequired: true },
        },
      ],
      productionInventory: [],
    });
    expect(result.eligible).toBe(false);
    expect(result.rejectionCategories).toEqual(
      expect.arrayContaining(["private_variant", "paid_only_variant"]),
    );
  });

  it("rejects a release with an unresolved transitive dependency", () => {
    const { result } = evaluateReleaseEligibility({
      artifacts: [VALID_ARTIFACT],
      productionInventory: [
        { ...VALID_DEPENDENCY, relationship: "transitive", version: "^19.0.0" },
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.rejectionCategories).toContain("unresolved_source");
  });

  it("rejects a release with an incompatible-license dependency asset", () => {
    const { result } = evaluateReleaseEligibility({
      artifacts: [VALID_ARTIFACT],
      productionInventory: [
        {
          ...VALID_DEPENDENCY,
          materialType: "asset",
          provenance: { ...VALID_PROVENANCE, reviewStatus: "rejected" },
        },
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.rejectionCategories).toContain("incompatible_license");
  });

  it("retains only valid, auditable dependency replacement records", () => {
    const { result } = evaluateReleaseEligibility({
      artifacts: [VALID_ARTIFACT],
      productionInventory: [VALID_DEPENDENCY],
      dependencyReplacements: [
        {
          previousItem: VALID_DEPENDENCY,
          replacementItem: { ...VALID_DEPENDENCY, name: "preact", version: "10.0.0" },
          changeRationale: "Bundle size reduction.",
          reviewer: "maintainer-1",
          approvalDate: "2026-01-15",
        },
        {
          previousItem: VALID_DEPENDENCY,
          replacementItem: VALID_DEPENDENCY,
          changeRationale: "",
          reviewer: "",
          approvalDate: "bad-date",
        },
      ],
    });
    expect(result.dependencyReplacements).toHaveLength(1);
    expect(result.dependencyReplacements[0]?.replacementItem.name).toBe("preact");
  });
});

describe("checkReleaseEligibility", () => {
  it("returns an ok Result for an eligible release", () => {
    const outcome = checkReleaseEligibility(
      { artifacts: [VALID_ARTIFACT], productionInventory: [VALID_DEPENDENCY] },
      { requestId: "req-1" },
    );
    expect(outcome.ok).toBe(true);
  });

  it("returns a policy ErrorEnvelope naming the first rejection category for an ineligible release", () => {
    const outcome = checkReleaseEligibility(
      {
        artifacts: [{ ref: VALID_ARTIFACT.ref, access: { ...VALID_ACCESS, privateVariant: true } }],
        productionInventory: [],
      },
      { requestId: "req-2" },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.error.category).toBe("policy");
      expect(outcome.error.error.code).toBe("release_rejected_private_variant");
      expect(outcome.error.error.requestId).toBe("req-2");
      expect(outcome.error.error.fields?.length).toBeGreaterThan(0);
    }
  });
});
