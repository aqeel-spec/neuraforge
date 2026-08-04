import { describe, expect, it } from "vitest";

import {
  prioritizeCandidates,
  validatePrioritizationCandidate,
  validatePrioritizationCandidates,
  validatePrioritizationRuleSet,
  type PrioritizationCandidate,
  type PrioritizationRuleSet,
} from "./prioritization.js";

const publicSource = (url: string) => ({ url, visibility: "public" as const });

const ruleSet: PrioritizationRuleSet = {
  schemaVersion: "1.0.0",
  dimensions: [
    { dimension: "impact", direction: "maximize", weight: 3, missingEvidenceValue: 0 },
    { dimension: "effort", direction: "minimize", weight: 2, missingEvidenceValue: 10 },
    { dimension: "accessibilityRisk", direction: "minimize", weight: 2, missingEvidenceValue: 10 },
    { dimension: "securityRisk", direction: "minimize", weight: 2, missingEvidenceValue: 10 },
    { dimension: "demand", direction: "maximize", weight: 1, missingEvidenceValue: 0 },
  ],
};

const evidence = (value: number) => ({
  value,
  source: publicSource("https://example.test/evidence"),
});

const candidateA: PrioritizationCandidate = {
  stableId: "component-alpha",
  evidence: {
    impact: evidence(8),
    effort: evidence(3),
    accessibilityRisk: evidence(1),
    securityRisk: evidence(1),
    demand: evidence(5),
  },
};

const candidateB: PrioritizationCandidate = {
  stableId: "component-beta",
  evidence: {
    impact: evidence(8),
    effort: evidence(3),
    accessibilityRisk: evidence(1),
    securityRisk: evidence(1),
    demand: evidence(5),
  },
};

const candidateC: PrioritizationCandidate = {
  stableId: "component-gamma",
  evidence: {
    impact: evidence(2),
    effort: evidence(8),
    accessibilityRisk: evidence(5),
    securityRisk: evidence(5),
  },
};

describe("validatePrioritizationRuleSet", () => {
  it("accepts a complete rule set covering every dimension exactly once", () => {
    expect(validatePrioritizationRuleSet(ruleSet)).toEqual({ valid: true, errors: [] });
  });

  it("reports missing dimensions, invalid direction, weight, and missing-evidence value", () => {
    const invalid: PrioritizationRuleSet = {
      schemaVersion: "1.0.0",
      dimensions: [
        {
          dimension: "impact",
          direction: "sideways" as never,
          weight: 0,
          missingEvidenceValue: Number.NaN,
        },
      ],
    };
    const result = validatePrioritizationRuleSet(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining([
        "invalid_prioritization_direction",
        "invalid_prioritization_weight",
        "invalid_missing_evidence_value",
        "missing_prioritization_dimension",
      ]),
    );
  });

  it("rejects a duplicate dimension rule", () => {
    const invalid: PrioritizationRuleSet = {
      schemaVersion: "1.0.0",
      dimensions: [
        ...ruleSet.dimensions,
        { dimension: "impact", direction: "maximize", weight: 1, missingEvidenceValue: 0 },
      ],
    };
    const result = validatePrioritizationRuleSet(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("duplicate_prioritization_dimension");
  });
});

describe("validatePrioritizationCandidate(s)", () => {
  it("accepts a candidate with a stable ID and public evidence sources", () => {
    expect(validatePrioritizationCandidate(candidateA)).toEqual({ valid: true, errors: [] });
  });

  it("rejects a non-public evidence source and a non-finite value", () => {
    const invalid: PrioritizationCandidate = {
      stableId: "component-delta",
      evidence: {
        impact: { value: Number.NaN, source: { url: "not-a-url", visibility: "public" } },
      },
    };
    const result = validatePrioritizationCandidate(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["invalid_evidence_value", "invalid_evidence_source"]),
    );
  });

  it("rejects duplicate stable identifiers across a candidate set", () => {
    const result = validatePrioritizationCandidates([
      candidateA,
      { ...candidateB, stableId: candidateA.stableId },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("duplicate_candidate_stable_id");
  });
});

describe("prioritizeCandidates", () => {
  it("applies missing-evidence values for omitted dimensions", () => {
    const result = prioritizeCandidates(ruleSet, [candidateC]);
    const demandScore = result.ordered[0]?.dimensions.find((d) => d.dimension === "demand");
    expect(demandScore).toMatchObject({ evidenceMissing: true, rawValue: 0 });
  });

  it("breaks ties deterministically by ascending stable ID", () => {
    const result = prioritizeCandidates(ruleSet, [candidateB, candidateA]);
    expect(result.ordered.map((c) => c.stableId)).toEqual(["component-alpha", "component-beta"]);
  });

  it("orders candidates by descending weighted score with better candidates first", () => {
    const result = prioritizeCandidates(ruleSet, [candidateC, candidateA]);
    expect(result.ordered.map((c) => c.stableId)).toEqual(["component-alpha", "component-gamma"]);
  });

  it("produces identical ordered output for identical inputs (determinism)", () => {
    const first = prioritizeCandidates(ruleSet, [candidateA, candidateB, candidateC]);
    const second = prioritizeCandidates(ruleSet, [candidateA, candidateB, candidateC]);
    expect(second).toEqual(first);
  });

  it("throws on an invalid rule set instead of silently prioritizing", () => {
    expect(() =>
      prioritizeCandidates({ schemaVersion: "1.0.0", dimensions: [] }, [candidateA]),
    ).toThrow(RangeError);
  });

  it("throws on invalid candidates instead of silently prioritizing", () => {
    expect(() => prioritizeCandidates(ruleSet, [{ stableId: "", evidence: {} }])).toThrow(
      RangeError,
    );
  });
});
