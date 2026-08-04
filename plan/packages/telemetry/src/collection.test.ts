import { describe, expect, it } from "vitest";

import { collectAndSend, collectEvent, TelemetryStore, type TelemetrySink } from "./collection.js";
import { grantConsent, withdrawConsent } from "./consent.js";
import type { TelemetryEvent, TelemetrySchema } from "./types.js";

const SCHEMA: TelemetrySchema = {
  schemaVersion: "1.0.0",
  surfaces: ["cli"],
  events: [
    {
      name: "cli_install_completed",
      fields: [
        {
          name: "componentCount",
          type: "number",
          description: "count of components written by the install",
        },
        {
          name: "succeeded",
          type: "boolean",
          description: "whether the install transaction committed",
        },
      ],
      purpose: "measure aggregate CLI install reliability",
      recipient: "neuraforge-telemetry-aggregate",
      retentionDays: 2,
    },
    {
      // A second permitted event so a receipt can be scoped to one event and tested against
      // the other; `grantConsent` rejects a scope naming an event the schema never permits.
      name: "cli_preview_completed",
      fields: [
        {
          name: "succeeded",
          type: "boolean",
          description: "whether the preview resolved every artifact",
        },
      ],
      purpose: "measure aggregate CLI preview reliability",
      recipient: "neuraforge-telemetry-aggregate",
      retentionDays: 2,
    },
  ],
};

function activeReceipt(scope: "all" | readonly string[] = "all") {
  const { receipt } = grantConsent(SCHEMA, scope, "2025-01-01T00:00:00.000Z");
  if (!receipt) throw new Error("expected a receipt");
  return receipt;
}

describe("collectEvent", () => {
  it("admits a valid event within schema and scope, computing bounded retention", () => {
    const receipt = activeReceipt();
    const event: TelemetryEvent = {
      name: "cli_install_completed",
      fields: { componentCount: 3, succeeded: true },
      occurredAt: "2025-01-01T00:00:00.000Z",
    };

    const result = collectEvent(event, SCHEMA, receipt);
    expect(result.admitted).toBe(true);
    if (result.admitted) {
      expect(result.event.receiptId).toBe(receipt.receiptId);
      expect(new Date(result.event.retainUntil).getTime()).toBe(
        new Date("2025-01-03T00:00:00.000Z").getTime(),
      );
    }
  });

  it("discards an event when consent is withdrawn", () => {
    const receipt = withdrawConsent(activeReceipt());
    const event: TelemetryEvent = {
      name: "cli_install_completed",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
    };
    const result = collectEvent(event, SCHEMA, receipt);
    expect(result).toEqual({ admitted: false, reason: "no_active_consent" });
  });

  it("discards an event when the receipt's schema version does not match", () => {
    const receipt = activeReceipt();
    const result = collectEvent(
      { name: "cli_install_completed", fields: {}, occurredAt: "2025-01-01T00:00:00.000Z" },
      { ...SCHEMA, schemaVersion: "2.0.0" },
      receipt,
    );
    expect(result).toEqual({ admitted: false, reason: "schema_version_mismatch" });
  });

  it("discards an event outside the receipt's consented scope", () => {
    const receipt = activeReceipt(["cli_preview_completed"]);
    const result = collectEvent(
      { name: "cli_install_completed", fields: {}, occurredAt: "2025-01-01T00:00:00.000Z" },
      SCHEMA,
      receipt,
    );
    expect(result).toEqual({ admitted: false, reason: "event_out_of_scope" });
  });

  it("discards an event name not defined by the schema", () => {
    const receipt = activeReceipt();
    const result = collectEvent(
      { name: "unknown_event", fields: {}, occurredAt: "2025-01-01T00:00:00.000Z" },
      SCHEMA,
      receipt,
    );
    expect(result).toEqual({ admitted: false, reason: "unknown_event" });
  });

  it("discards an event with a field outside the event's allowlist", () => {
    const receipt = activeReceipt();
    const result = collectEvent(
      {
        name: "cli_install_completed",
        fields: { sourcePath: "/etc/passwd" },
        occurredAt: "2025-01-01T00:00:00.000Z",
      },
      SCHEMA,
      receipt,
    );
    expect(result).toEqual({ admitted: false, reason: "unknown_field" });
  });

  it("discards an event whose field value type does not match the schema", () => {
    const receipt = activeReceipt();
    const result = collectEvent(
      {
        name: "cli_install_completed",
        fields: { componentCount: "three" },
        occurredAt: "2025-01-01T00:00:00.000Z",
      },
      SCHEMA,
      receipt,
    );
    expect(result).toEqual({ admitted: false, reason: "field_type_mismatch" });
  });
});

describe("TelemetryStore", () => {
  it("deletes only events bound to the given receipt ID", () => {
    const store = new TelemetryStore();
    store.add({
      name: "a",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: "r1",
      retainUntil: "2025-01-02T00:00:00.000Z",
    });
    store.add({
      name: "b",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: "r2",
      retainUntil: "2025-01-02T00:00:00.000Z",
    });

    const deleted = store.deleteByReceiptId("r1");
    expect(deleted).toBe(1);
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]?.receiptId).toBe("r2");
  });

  it("purges events whose retention deadline has passed", () => {
    const store = new TelemetryStore();
    store.add({
      name: "a",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: "r1",
      retainUntil: "2025-01-02T00:00:00.000Z",
    });
    store.add({
      name: "b",
      fields: {},
      occurredAt: "2025-01-01T00:00:00.000Z",
      receiptId: "r2",
      retainUntil: "2025-01-10T00:00:00.000Z",
    });

    const purged = store.purgeExpired("2025-01-05T00:00:00.000Z");
    expect(purged).toBe(1);
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]?.receiptId).toBe("r2");
  });
});

describe("collectAndSend", () => {
  it("stores and forwards an admitted event", async () => {
    const receipt = activeReceipt();
    const store = new TelemetryStore();
    const sent: string[] = [];
    const sink: TelemetrySink = {
      send: (event) => {
        sent.push(event.name);
        return Promise.resolve();
      },
    };

    const result = await collectAndSend(
      {
        name: "cli_install_completed",
        fields: { componentCount: 1, succeeded: true },
        occurredAt: "2025-01-01T00:00:00.000Z",
      },
      SCHEMA,
      receipt,
      store,
      sink,
    );

    expect(result.admitted).toBe(true);
    expect(store.all()).toHaveLength(1);
    expect(sent).toEqual(["cli_install_completed"]);
  });

  it("never stores or forwards an event that fails local validation (fail-closed)", async () => {
    const receipt = activeReceipt();
    const store = new TelemetryStore();
    let sendCalls = 0;
    const sink: TelemetrySink = {
      send: () => {
        sendCalls += 1;
        return Promise.resolve();
      },
    };

    const result = await collectAndSend(
      {
        name: "cli_install_completed",
        fields: { sourcePath: "/etc/passwd" },
        occurredAt: "2025-01-01T00:00:00.000Z",
      },
      SCHEMA,
      receipt,
      store,
      sink,
    );

    expect(result.admitted).toBe(false);
    expect(store.all()).toHaveLength(0);
    expect(sendCalls).toBe(0);
  });
});
