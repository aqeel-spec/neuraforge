/**
 * Registry-builder tests: quality classification.
 */

import { describe, it, expect } from "vitest";
import { classifyReleaseQuality, REQUIRED_CHECK_TYPES } from "../quality.js";
import { FIXTURE_APPROVAL, FIXTURE_QUALITY_RESULTS } from "./fixtures.js";
import type { QualityException } from "../types.js";

describe("classifyReleaseQuality", () => {
  it("classifies as stable with complete pass + approval", () => {
    const result = classifyReleaseQuality({
      qualityResults: [...FIXTURE_QUALITY_RESULTS],
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).toBe("stable");
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects when no approval is provided", () => {
    const result = classifyReleaseQuality({
      qualityResults: [...FIXTURE_QUALITY_RESULTS],
      performanceRecords: [],
      exceptions: [],
      approval: undefined,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("approval"))).toBe(true);
  });

  it("rejects when a required check is missing", () => {
    const incomplete = FIXTURE_QUALITY_RESULTS.filter((r) => r.checkType !== "security");
    const result = classifyReleaseQuality({
      qualityResults: incomplete,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("Missing required check: security"))).toBe(true);
  });

  it("rejects when a check is duplicated", () => {
    const firstResult = FIXTURE_QUALITY_RESULTS[0];
    if (!firstResult) throw new Error("missing fixture");
    const duplicated = [
      ...FIXTURE_QUALITY_RESULTS,
      { ...firstResult, checkId: "check-formatting-dup" },
    ];
    const result = classifyReleaseQuality({
      qualityResults: duplicated,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("Duplicate check"))).toBe(true);
  });

  it("rejects when a check has status failed", () => {
    const withFail = FIXTURE_QUALITY_RESULTS.map((r) =>
      r.checkType === "unit" ? { ...r, status: "failed" as const } : r,
    );
    const result = classifyReleaseQuality({
      qualityResults: withFail,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("Check failed"))).toBe(true);
  });

  it("rejects when a check has status unavailable", () => {
    const withUnavailable = FIXTURE_QUALITY_RESULTS.map((r) =>
      r.checkType === "integration" ? { ...r, status: "unavailable" as const } : r,
    );
    const result = classifyReleaseQuality({
      qualityResults: withUnavailable,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("unavailable"))).toBe(true);
  });

  it("rejects when a check has status malformed", () => {
    const withMalformed = FIXTURE_QUALITY_RESULTS.map((r) =>
      r.checkType === "accessibility" ? { ...r, status: "malformed" as const } : r,
    );
    const result = classifyReleaseQuality({
      qualityResults: withMalformed,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("malformed"))).toBe(true);
  });

  it("rejects when a check has an exceptionRef", () => {
    const withException = FIXTURE_QUALITY_RESULTS.map((r) =>
      r.checkType === "package" ? { ...r, exceptionRef: "EXC-001" } : r,
    );
    const result = classifyReleaseQuality({
      qualityResults: withException,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("exceptionRef"))).toBe(true);
  });

  it("rejects when performance record exceeds budget", () => {
    const result = classifyReleaseQuality({
      qualityResults: [...FIXTURE_QUALITY_RESULTS],
      performanceRecords: [
        {
          artifact: { kind: "component", stableId: "navbar", version: "1.0.0" },
          metric: "bundle-size-gzip",
          scenario: "production",
          environment: {
            operatingSystem: "linux",
            runtime: "node 20",
            tools: {},
            prerequisites: [],
            fixtures: [],
          },
          result: 100,
          threshold: 10,
          unit: "KB",
          command: "npm run build",
          status: "failed",
        },
      ],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).not.toBe("stable");
    expect(result.reasons.some((r) => r.includes("Performance"))).toBe(true);
  });

  it("rejects on security failure", () => {
    const withSecurityFail = FIXTURE_QUALITY_RESULTS.map((r) =>
      r.checkType === "security" ? { ...r, status: "failed" as const } : r,
    );
    const result = classifyReleaseQuality({
      qualityResults: withSecurityFail,
      performanceRecords: [],
      exceptions: [],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).toBe("rejected");
  });

  it("rejects on active security exception", () => {
    const securityException: QualityException = {
      checkId: "sec-vuln-1",
      checkType: "security",
      reason: "Known CVE",
      approvedBy: "admin",
      approvedAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-01-01T00:00:00Z",
      category: "security",
    };
    const result = classifyReleaseQuality({
      qualityResults: [...FIXTURE_QUALITY_RESULTS],
      performanceRecords: [],
      exceptions: [securityException],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).toBe("rejected");
  });

  it("classifies as experimental with non-security exception only", () => {
    const nonSecException: QualityException = {
      checkId: "doc-incomplete",
      checkType: "documentation",
      reason: "Docs not finalized",
      approvedBy: "admin",
      approvedAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-01-01T00:00:00Z",
      category: "non-security",
    };
    const result = classifyReleaseQuality({
      qualityResults: [...FIXTURE_QUALITY_RESULTS],
      performanceRecords: [],
      exceptions: [nonSecException],
      approval: FIXTURE_APPROVAL,
    });
    expect(result.classification).toBe("experimental");
  });

  it("defines all required check types", () => {
    expect(REQUIRED_CHECK_TYPES).toContain("formatting");
    expect(REQUIRED_CHECK_TYPES).toContain("static-analysis");
    expect(REQUIRED_CHECK_TYPES).toContain("unit");
    expect(REQUIRED_CHECK_TYPES).toContain("integration");
    expect(REQUIRED_CHECK_TYPES).toContain("accessibility");
    expect(REQUIRED_CHECK_TYPES).toContain("security");
    expect(REQUIRED_CHECK_TYPES).toContain("package");
    expect(REQUIRED_CHECK_TYPES).toContain("documentation");
    expect(REQUIRED_CHECK_TYPES).toContain("compatibility");
    expect(REQUIRED_CHECK_TYPES).toContain("license");
    expect(REQUIRED_CHECK_TYPES).toContain("provenance");
    expect(REQUIRED_CHECK_TYPES).toContain("bundle-size");
    expect(REQUIRED_CHECK_TYPES).toContain("runtime-performance");
    expect(REQUIRED_CHECK_TYPES.length).toBe(13);
  });
});
