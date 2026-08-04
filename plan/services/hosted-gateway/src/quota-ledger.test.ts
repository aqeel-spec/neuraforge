import { describe, expect, it } from "vitest";

import {
  createQuotaLedgerEntry,
  QUOTA_LEDGER_ALLOWED_FIELDS,
  validateQuotaLedgerEntry,
} from "./quota-ledger.js";

const validEntry = createQuotaLedgerEntry({
  accountOrOrganizationId: "acct-1",
  plan: "pro",
  pricingVersion: "pricing-v1",
  requestId: "req-1",
  operationId: "list_components",
  requestTimestamp: "2025-06-15T13:00:00.000Z",
  classification: "counted",
  resultClassification: "success",
  callsUsed: 1,
  callsRemaining: 2999,
  resetAt: "2025-06-16T00:00:00.000Z",
});

describe("validateQuotaLedgerEntry", () => {
  it("accepts a well-formed entry built from the allowlisted fields only", () => {
    expect(validateQuotaLedgerEntry(validEntry)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an entry carrying a forbidden field such as request payload or source", () => {
    const result = validateQuotaLedgerEntry({ ...validEntry, source: "export const x = 1;" });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("forbidden_quota_field");
  });

  it("rejects an entry carrying a secret, credential, path, or brand config field", () => {
    for (const field of ["secret", "credentials", "path", "brandConfig", "ipAddress"]) {
      const result = validateQuotaLedgerEntry({ ...validEntry, [field]: "value" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === `quotaLedgerEntry.${field}`)).toBe(true);
    }
  });

  it("rejects an unexpected field that is not on the forbidden list either", () => {
    const result = validateQuotaLedgerEntry({ ...validEntry, notes: "internal note" });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("unexpected_quota_field");
  });

  it("rejects an invalid plan, classification, or result classification", () => {
    const result = validateQuotaLedgerEntry({
      ...validEntry,
      plan: "enterprise",
      classification: "maybe",
      resultClassification: "unknown",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining([
        "invalid_plan",
        "invalid_classification",
        "invalid_result_classification",
      ]),
    );
  });

  it("rejects negative calls used/remaining", () => {
    const result = validateQuotaLedgerEntry({ ...validEntry, callsUsed: -1, callsRemaining: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["invalid_calls_used", "invalid_calls_remaining"]),
    );
  });

  it("rejects a non-object candidate", () => {
    expect(validateQuotaLedgerEntry(null).valid).toBe(false);
  });
});

describe("QUOTA_LEDGER_ALLOWED_FIELDS", () => {
  it("matches exactly the fields produced by createQuotaLedgerEntry", () => {
    expect(new Set(Object.keys(validEntry))).toEqual(QUOTA_LEDGER_ALLOWED_FIELDS);
  });
});
