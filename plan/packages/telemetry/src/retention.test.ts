import { describe, expect, it } from "vitest";

import type { ConsentReceipt } from "./types.js";
import {
  deleteTelemetryByReceipt,
  isRetentionExpired,
  pruneExpiredTelemetryEvents,
  retentionExpiresAt,
  type RetainedTelemetryEvent,
} from "./retention.js";

const event = (overrides: Partial<RetainedTelemetryEvent> = {}): RetainedTelemetryEvent => ({
  receiptId: "receipt-1",
  name: "cli_command_invoked",
  occurredAt: "2026-01-01T00:00:00.000Z",
  fields: { commandName: "install" },
  retentionDays: 7,
  ...overrides,
});

describe("retentionExpiresAt / isRetentionExpired", () => {
  it("computes the exact expiry instant from occurredAt + retentionDays", () => {
    expect(retentionExpiresAt(event())).toBe("2026-01-08T00:00:00.000Z");
  });

  it("treats zero-day retention as expiring immediately", () => {
    const zeroDay = event({ retentionDays: 0 });
    expect(retentionExpiresAt(zeroDay)).toBe("2026-01-01T00:00:00.000Z");
    expect(isRetentionExpired(zeroDay, "2026-01-01T00:00:00.000Z")).toBe(true);
  });

  it("is not expired before the expiry instant and is expired at/after it", () => {
    expect(isRetentionExpired(event(), "2026-01-07T23:59:59.999Z")).toBe(false);
    expect(isRetentionExpired(event(), "2026-01-08T00:00:00.000Z")).toBe(true);
  });

  it("rejects retention values outside the 0-30 day contract", () => {
    expect(() => retentionExpiresAt(event({ retentionDays: 31 }))).toThrow(RangeError);
    expect(() => retentionExpiresAt(event({ retentionDays: -1 }))).toThrow(RangeError);
  });
});

describe("pruneExpiredTelemetryEvents", () => {
  it("keeps only events still inside their bounded retention window", () => {
    const fresh = event({ occurredAt: "2026-01-05T00:00:00.000Z" });
    const stale = event({ occurredAt: "2025-12-01T00:00:00.000Z" });
    const pruned = pruneExpiredTelemetryEvents([fresh, stale], "2026-01-06T00:00:00.000Z");
    expect(pruned).toEqual([fresh]);
  });
});

describe("deleteTelemetryByReceipt", () => {
  const receipt: ConsentReceipt = {
    receiptId: "receipt-1",
    schemaVersion: "1.0.0",
    scope: "all",
    grantedAt: "2026-01-01T00:00:00.000Z",
    status: "active",
  };

  it("deletes every event matching the receipt and reports completion", () => {
    const other = event({ receiptId: "receipt-2" });
    const { remaining, result } = deleteTelemetryByReceipt([event(), event(), other], receipt);
    expect(result).toEqual({ status: "completed", deletedCount: 2 });
    expect(remaining).toEqual([other]);
  });

  it("reports an invalid receipt without deleting anything", () => {
    // A structurally complete receipt whose blank `receiptId` is the single invalid field.
    const invalidReceipt: ConsentReceipt = {
      receiptId: "",
      schemaVersion: "1.0.0",
      scope: "all",
      grantedAt: "2026-01-01T00:00:00.000Z",
      status: "active",
    };
    const events = [event()];
    const { remaining, result } = deleteTelemetryByReceipt(events, invalidReceipt);
    expect(result).toEqual({ status: "invalid_receipt" });
    expect(remaining).toEqual(events);
  });

  it("reports legally required retention while still deleting uncovered events", () => {
    const covered = event({ name: "legal_hold_event" });
    const uncovered = event({ name: "cli_command_invoked" });
    const { remaining, result } = deleteTelemetryByReceipt([covered, uncovered], receipt, {
      legalRetentionReason: "Open regulatory inquiry",
      legallyRetainedNames: ["legal_hold_event"],
    });
    expect(result).toEqual({
      status: "retained_by_legal_requirement",
      reason: "Open regulatory inquiry",
      deletedCount: 1,
    });
    expect(remaining).toEqual([covered]);
  });
});
