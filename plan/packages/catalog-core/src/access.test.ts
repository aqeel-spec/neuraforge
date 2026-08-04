import { describe, expect, it } from "vitest";

import { validateAccessClassification, validateAccessClassifications } from "./access.js";

const VALID_ACCESS = {
  visibility: "public",
  entitlement: "none",
  paymentRequired: false,
  licenseKeyRequired: false,
  privateVariant: false,
  paidOnlyVariant: false,
} as const;

describe("validateAccessClassification", () => {
  it("accepts a complete entitlement-free access classification", () => {
    expect(validateAccessClassification(VALID_ACCESS)).toEqual({ valid: true, errors: [] });
  });

  it("rejects a non-object candidate", () => {
    const result = validateAccessClassification(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(["access_classification_required"]);
  });

  it("rejects an unexpected field outside the closed contract", () => {
    const result = validateAccessClassification({ ...VALID_ACCESS, tier: "pro" });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) => error.code === "unexpected_access_field" && error.path === "access.tier",
      ),
    ).toBe(true);
  });

  it("accumulates every private/premium/paid/license-key violation in one pass", () => {
    const result = validateAccessClassification({
      visibility: "private",
      entitlement: "premium",
      paymentRequired: true,
      licenseKeyRequired: true,
      privateVariant: true,
      paidOnlyVariant: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual([
      "private_access_forbidden",
      "premium_entitlement_forbidden",
      "payment_required_forbidden",
      "license_key_required_forbidden",
      "private_variant_forbidden",
      "paid_only_variant_forbidden",
    ]);
  });
});

describe("validateAccessClassifications", () => {
  it("applies the identical policy to every artifact regardless of maturity", () => {
    const result = validateAccessClassifications([
      { path: "artifacts[0].access", access: VALID_ACCESS },
      { path: "artifacts[1].access", access: VALID_ACCESS },
    ]);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("reports violations from every entry, keeping each entry's path", () => {
    const result = validateAccessClassifications([
      { path: "artifacts[0].access", access: VALID_ACCESS },
      { path: "artifacts[1].access", access: { ...VALID_ACCESS, paymentRequired: true } },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.path).toBe("artifacts[1].access.paymentRequired");
  });
});
