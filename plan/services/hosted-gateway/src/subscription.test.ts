import { describe, expect, it } from "vitest";

import { resolveBillingCycle } from "./billing-cycle.js";
import { isSubscriptionActiveAt, validateSubscription, type Subscription } from "./subscription.js";

const cycle = resolveBillingCycle("2025-06-15T00:00:00.000Z", 1);

const baseSubscription: Subscription = {
  accountOrOrganizationId: "acct-1",
  planId: "pro",
  pricingVersionId: "pricing-v1",
  status: "active",
  currentBillingCycle: cycle,
  renewalEnabled: true,
};

describe("validateSubscription", () => {
  it("accepts a complete active subscription", () => {
    expect(validateSubscription(baseSubscription)).toEqual({ valid: true, errors: [] });
  });

  it("accepts a subscription with a scheduled downgrade", () => {
    const withDowngrade: Subscription = {
      ...baseSubscription,
      scheduledPlanChange: { planId: "starter", effectiveAt: cycle.endAt },
    };
    expect(validateSubscription(withDowngrade)).toEqual({ valid: true, errors: [] });
  });

  it("accepts a canceled subscription with access-end metadata", () => {
    const canceled: Subscription = {
      ...baseSubscription,
      status: "canceled",
      renewalEnabled: false,
      cancellation: { requestedAt: "2025-06-16T00:00:00.000Z", accessEndAt: cycle.endAt },
    };
    expect(validateSubscription(canceled)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an invalid plan ID", () => {
    const result = validateSubscription({ ...baseSubscription, planId: "enterprise" });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("invalid_plan");
  });

  it("rejects a malformed billing cycle", () => {
    const result = validateSubscription({
      ...baseSubscription,
      currentBillingCycle: { startAt: cycle.endAt, endAt: cycle.startAt },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("invalid_billing_cycle_order");
  });

  it("rejects a non-object candidate", () => {
    expect(validateSubscription(null).valid).toBe(false);
  });
});

describe("isSubscriptionActiveAt", () => {
  it("treats an active subscription as active", () => {
    expect(isSubscriptionActiveAt(baseSubscription, "2025-06-20T00:00:00.000Z")).toBe(true);
  });

  it("treats an inactive subscription as inactive", () => {
    expect(
      isSubscriptionActiveAt(
        { ...baseSubscription, status: "inactive" },
        "2025-06-20T00:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("treats a canceled subscription as active until its access end, then inactive", () => {
    const canceled: Subscription = {
      ...baseSubscription,
      status: "canceled",
      renewalEnabled: false,
      cancellation: { requestedAt: "2025-06-16T00:00:00.000Z", accessEndAt: cycle.endAt },
    };
    expect(isSubscriptionActiveAt(canceled, "2025-06-30T00:00:00.000Z")).toBe(true);
    expect(isSubscriptionActiveAt(canceled, cycle.endAt)).toBe(false);
  });
});
