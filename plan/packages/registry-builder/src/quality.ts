/**
 * Quality classification — fail-closed logic.
 *
 * Determines whether a release can be classified as stable, experimental, or rejected.
 * Stable requires:
 * - Every required check present exactly once, structurally complete, status passed
 * - No exceptionRef or active exception on any check
 * - Every performance record within threshold/passed
 * - Explicit manual approval
 *
 * Missing/malformed/failed => rejected (never stable).
 * Active non-security exception => experimental only.
 * Security exception/failure => rejected.
 */

import type { PerformanceRecord, QualityGateResult, ReleaseApproval } from "@neuraforge-ui/schemas";
import type { QualityClassificationResult, QualityException } from "./types.js";

/** The complete required MVP check types. */
export const REQUIRED_CHECK_TYPES = [
  "formatting",
  "static-analysis",
  "unit",
  "integration",
  "accessibility",
  "security",
  "package",
  "documentation",
  "compatibility",
  "license",
  "provenance",
  "bundle-size",
  "runtime-performance",
] as const;

export type RequiredCheckType = (typeof REQUIRED_CHECK_TYPES)[number];

export interface QualityClassificationInput {
  readonly qualityResults: readonly QualityGateResult[];
  readonly performanceRecords: readonly PerformanceRecord[];
  readonly exceptions: readonly QualityException[];
  readonly approval?: ReleaseApproval | undefined;
}

export function classifyReleaseQuality(
  input: QualityClassificationInput,
): QualityClassificationResult {
  const reasons: string[] = [];
  let hasSecurityIssue = false;
  let hasNonSecurityException = false;

  // Check for explicit manual approval
  if (!input.approval) {
    reasons.push("No explicit manual approval provided");
  }

  // Validate quality results: every required check present exactly once
  const checkTypeCounts = new Map<string, number>();
  for (const result of input.qualityResults) {
    const count = checkTypeCounts.get(result.checkType) ?? 0;
    checkTypeCounts.set(result.checkType, count + 1);
  }

  for (const requiredType of REQUIRED_CHECK_TYPES) {
    const count = checkTypeCounts.get(requiredType) ?? 0;
    if (count === 0) {
      reasons.push(`Missing required check: ${requiredType}`);
    } else if (count > 1) {
      reasons.push(`Duplicate check: ${requiredType} (found ${String(count)} times)`);
    }
  }

  // Validate each result structurally
  for (const result of input.qualityResults) {
    if (result.status === "failed") {
      if (result.checkType === "security") {
        hasSecurityIssue = true;
        reasons.push(`Security check failed: ${result.checkId}`);
      } else {
        reasons.push(`Check failed: ${result.checkId} (${result.checkType})`);
      }
    } else if (result.status === "unavailable") {
      reasons.push(`Check unavailable: ${result.checkId} (${result.checkType})`);
    } else if (result.status === "malformed") {
      reasons.push(`Check malformed: ${result.checkId} (${result.checkType})`);
    }

    // Check for exceptionRef on results
    if (result.exceptionRef !== undefined) {
      reasons.push(`Check ${result.checkId} has exceptionRef — cannot be stable`);
    }

    // Structural completeness: command and scope must be non-empty
    if (result.command.length === 0) {
      reasons.push(`Check ${result.checkId} missing command`);
    }
    if (result.scope.length === 0) {
      reasons.push(`Check ${result.checkId} missing scope`);
    }
  }

  // Active exceptions
  for (const exception of input.exceptions) {
    if (exception.category === "security") {
      hasSecurityIssue = true;
      reasons.push(`Active security exception: ${exception.checkId}`);
    } else {
      hasNonSecurityException = true;
      reasons.push(`Active non-security exception: ${exception.checkId}`);
    }
  }

  // Performance records
  for (const record of input.performanceRecords) {
    if (record.status !== "passed") {
      reasons.push(`Performance check failed: ${record.metric} for ${record.artifact.stableId}`);
    }
    if (record.result > record.threshold) {
      reasons.push(
        `Performance over budget: ${record.metric} (${String(record.result)} > ${String(record.threshold)})`,
      );
    }
  }

  // Classification decision — fail-closed
  if (hasSecurityIssue) {
    return { classification: "rejected", reasons };
  }

  if (reasons.length > 0) {
    // Non-security exception without other failures => experimental
    const onlyExceptionReasons = reasons.every((r) => r.includes("non-security exception"));
    if (hasNonSecurityException && onlyExceptionReasons) {
      return { classification: "experimental", reasons };
    }
    return { classification: "rejected", reasons };
  }

  return { classification: "stable", reasons: [] };
}
