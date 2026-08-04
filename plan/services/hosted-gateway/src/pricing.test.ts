import { describe, expect, it } from "vitest";

import {
  calculateMonthlyChargeCents,
  HOSTED_PLAN_IDS,
  INITIAL_PRICING_VERSION,
  isInitialPricingVersion,
  validatePricingVersion,
  type PricingVersion,
} from "./pricing.js";

describe("Initial Pricing Version", () => {
  it("defines the exact Starter, Pro, and Team prices and daily quotas from Requirement 18.2", () => {
    expect(INITIAL_PRICING_VERSION.plans.starter).toMatchObject({
      monthlyUsdCents: 900,
      dailyLimit: 500,
    });
    expect(INITIAL_PRICING_VERSION.plans.pro).toMatchObject({
      monthlyUsdCents: 2900,
      dailyLimit: 3000,
    });
    expect(INITIAL_PRICING_VERSION.plans.team).toMatchObject({
      monthlyUsdCents: 7900,
      dailyLimit: 10000,
    });
  });

  it("is deeply frozen so the Initial Pricing Version cannot be mutated", () => {
    expect(Object.isFrozen(INITIAL_PRICING_VERSION)).toBe(true);
    expect(Object.isFrozen(INITIAL_PRICING_VERSION.plans)).toBe(true);
    expect(Object.isFrozen(INITIAL_PRICING_VERSION.plans.starter)).toBe(true);
    expect(() => {
      // @ts-expect-error -- verifying runtime immutability, not just the type system
      INITIAL_PRICING_VERSION.plans.starter.monthlyUsdCents = 1;
    }).toThrow();
  });

  it("publishes exactly the starter, pro, and team plan IDs", () => {
    expect(HOSTED_PLAN_IDS).toEqual(["starter", "pro", "team"]);
    expect(Object.keys(INITIAL_PRICING_VERSION.plans).sort()).toEqual(["pro", "starter", "team"]);
  });

  it("calculates the monthly charge as exactly the published plan price with no overage", () => {
    expect(calculateMonthlyChargeCents(INITIAL_PRICING_VERSION.plans.starter)).toBe(900);
    expect(calculateMonthlyChargeCents(INITIAL_PRICING_VERSION.plans.pro)).toBe(2900);
    expect(calculateMonthlyChargeCents(INITIAL_PRICING_VERSION.plans.team)).toBe(7900);
  });

  it("recognizes itself as the Initial Pricing Version and detects a mutated copy", () => {
    expect(isInitialPricingVersion(INITIAL_PRICING_VERSION)).toBe(true);
    const mutated: PricingVersion = {
      ...INITIAL_PRICING_VERSION,
      plans: {
        ...INITIAL_PRICING_VERSION.plans,
        starter: { ...INITIAL_PRICING_VERSION.plans.starter, monthlyUsdCents: 1000 },
      },
    };
    expect(isInitialPricingVersion(mutated)).toBe(false);
  });
});

describe("validatePricingVersion", () => {
  it("accepts the published Initial Pricing Version", () => {
    expect(validatePricingVersion(INITIAL_PRICING_VERSION)).toEqual({ valid: true, errors: [] });
  });

  it("rejects a missing plan", () => {
    const { team, ...rest } = INITIAL_PRICING_VERSION.plans;
    void team;
    const result = validatePricingVersion({ ...INITIAL_PRICING_VERSION, plans: rest });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.path)).toContain("pricingVersion.plans.team");
  });

  it("rejects an unrecognized extra plan", () => {
    const result = validatePricingVersion({
      ...INITIAL_PRICING_VERSION,
      plans: {
        ...INITIAL_PRICING_VERSION.plans,
        enterprise: { monthlyUsdCents: 100, dailyLimit: 1, adminLimits: {} },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("unexpected_plan");
  });

  it("rejects a plan definition with a field outside the closed contract", () => {
    const result = validatePricingVersion({
      ...INITIAL_PRICING_VERSION,
      plans: {
        ...INITIAL_PRICING_VERSION.plans,
        starter: { ...INITIAL_PRICING_VERSION.plans.starter, artifactAccessTier: "gold" },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("unexpected_plan_field");
  });

  it("rejects non-positive prices and quotas", () => {
    const result = validatePricingVersion({
      ...INITIAL_PRICING_VERSION,
      plans: {
        ...INITIAL_PRICING_VERSION.plans,
        starter: { ...INITIAL_PRICING_VERSION.plans.starter, monthlyUsdCents: 0, dailyLimit: -1 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toEqual(
      expect.arrayContaining(["invalid_monthly_price", "invalid_daily_limit"]),
    );
  });

  it("rejects missing transition terms", () => {
    const { transitionTerms, ...rest } = INITIAL_PRICING_VERSION;
    void transitionTerms;
    const result = validatePricingVersion(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("transition_terms_required");
  });

  it("rejects a non-object candidate", () => {
    expect(validatePricingVersion(null).valid).toBe(false);
    expect(validatePricingVersion("pricing-v1").valid).toBe(false);
  });
});
