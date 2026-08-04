import { describe, expect, it } from "vitest";

import { TelemetryStore } from "./collection.js";
import { deleteByConsentReceipt } from "./deletion.js";
import { grantConsent } from "./consent.js";
import type { TelemetrySchema } from "./types.js";

const SCHEMA: TelemetrySchema = {
  schemaVersion: "1.0.0",
  surfaces: ["cli"],
  events: [
    {
      name: "cli_install_completed",
      fields: [
        {
          name: "succeeded",
          type: "boolean",
          description: "whether the install transaction committed",
        },
      ],
      purpose: "measure aggregate CLI install reliability",
      recipient: "neuraforge-telemetry-aggregate",
      retentionDays: 5,
    },
  ],
};

describe("deleteByConsentReceipt", () => {
  it("deletes every event bound to the receipt and reports completion", () => {
    const { receipt } = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    const store = new TelemetryStore();
    store.add({
      name: "cli_install_completed",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: receipt.receiptId,
      retainUntil: "2025-01-06T00:00:00.000Z",
    });
    store.add({
      name: "cli_install_completed",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: "other-receipt",
      retainUntil: "2025-01-06T00:00:00.000Z",
    });

    const report = deleteByConsentReceipt(receipt, store);

    expect(report).toEqual({ receiptId: receipt.receiptId, deletedCount: 1 });
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]?.receiptId).toBe("other-receipt");
  });

  it("reports zero deletions and the retention reason under a legally required retention hold", () => {
    const { receipt } = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    const store = new TelemetryStore();
    store.add({
      name: "cli_install_completed",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: receipt.receiptId,
      retainUntil: "2025-01-06T00:00:00.000Z",
    });

    const report = deleteByConsentReceipt(receipt, store, "active regulatory audit hold");

    expect(report).toEqual({
      receiptId: receipt.receiptId,
      deletedCount: 0,
      legallyRequiredRetention: "active regulatory audit hold",
    });
    expect(store.all()).toHaveLength(1);
  });
});
