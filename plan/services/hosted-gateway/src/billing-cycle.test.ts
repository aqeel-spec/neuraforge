import { describe, expect, it } from "vitest";

import {
  isWithinBillingCycle,
  isWithinQuotaWindow,
  nextBillingCycle,
  resolveBillingCycle,
  resolveQuotaWindow,
} from "./billing-cycle.js";

describe("resolveQuotaWindow", () => {
  it("assigns a mid-day timestamp to the half-open UTC-day window", () => {
    expect(resolveQuotaWindow("2025-06-15T13:45:30.000Z")).toEqual({
      windowStart: "2025-06-15T00:00:00.000Z",
      resetAt: "2025-06-16T00:00:00.000Z",
    });
  });

  it("treats exactly UTC midnight as the start of that day's window", () => {
    expect(resolveQuotaWindow("2025-06-15T00:00:00.000Z")).toEqual({
      windowStart: "2025-06-15T00:00:00.000Z",
      resetAt: "2025-06-16T00:00:00.000Z",
    });
  });

  it("crosses month and leap-day boundaries correctly", () => {
    expect(resolveQuotaWindow("2024-02-29T23:59:59.999Z").resetAt).toBe("2024-03-01T00:00:00.000Z");
  });

  it("reports timestamps inside and outside the window", () => {
    const window = resolveQuotaWindow("2025-06-15T13:45:30.000Z");
    expect(isWithinQuotaWindow("2025-06-15T00:00:00.000Z", window)).toBe(true);
    expect(isWithinQuotaWindow("2025-06-15T23:59:59.999Z", window)).toBe(true);
    expect(isWithinQuotaWindow("2025-06-16T00:00:00.000Z", window)).toBe(false);
    expect(isWithinQuotaWindow("2025-06-14T23:59:59.999Z", window)).toBe(false);
  });
});

describe("resolveBillingCycle", () => {
  it("resolves the current monthly cycle when the anchor is after the cycle start day", () => {
    expect(resolveBillingCycle("2025-06-15T00:00:00.000Z", 1)).toEqual({
      startAt: "2025-06-01T00:00:00.000Z",
      endAt: "2025-07-01T00:00:00.000Z",
    });
  });

  it("resolves the previous month's cycle when the anchor is before the cycle start day", () => {
    expect(resolveBillingCycle("2025-06-10T00:00:00.000Z", 15)).toEqual({
      startAt: "2025-05-15T00:00:00.000Z",
      endAt: "2025-06-15T00:00:00.000Z",
    });
  });

  it("clamps a start day beyond a shorter month's length", () => {
    // cycleStartDay=31 in a 30-day April clamps to April 30.
    expect(resolveBillingCycle("2025-04-30T12:00:00.000Z", 31)).toEqual({
      startAt: "2025-04-30T00:00:00.000Z",
      endAt: "2025-05-31T00:00:00.000Z",
    });
  });

  it("rejects an out-of-range cycle start day", () => {
    expect(() => resolveBillingCycle("2025-06-15T00:00:00.000Z", 0)).toThrow(RangeError);
    expect(() => resolveBillingCycle("2025-06-15T00:00:00.000Z", 32)).toThrow(RangeError);
  });

  it("reports timestamps inside and outside the cycle", () => {
    const cycle = resolveBillingCycle("2025-06-15T00:00:00.000Z", 1);
    expect(isWithinBillingCycle("2025-06-30T23:59:59.999Z", cycle)).toBe(true);
    expect(isWithinBillingCycle("2025-07-01T00:00:00.000Z", cycle)).toBe(false);
  });

  it("computes the next Billing Cycle immediately following the current one", () => {
    const cycle = resolveBillingCycle("2025-06-15T00:00:00.000Z", 1);
    expect(nextBillingCycle(cycle, 1)).toEqual({
      startAt: "2025-07-01T00:00:00.000Z",
      endAt: "2025-08-01T00:00:00.000Z",
    });
  });
});
