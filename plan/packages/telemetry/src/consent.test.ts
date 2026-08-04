import { describe, expect, it } from "vitest";

import {
  buildConsentDisclosure,
  grantConsent,
  isConsentActive,
  isEventInScope,
  withdrawConsent,
} from "./consent.js";
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
      retentionDays: 14,
    },
  ],
};

describe("buildConsentDisclosure", () => {
  it("discloses the exact schema version, events, and procedures", () => {
    const disclosure = buildConsentDisclosure(
      SCHEMA,
      "run `neuraforge telemetry disable`",
      "run `neuraforge telemetry delete <receiptId>`",
    );
    expect(disclosure.schemaVersion).toBe("1.0.0");
    expect(disclosure.events).toEqual(SCHEMA.events);
    expect(disclosure.disableProcedure).toContain("disable");
    expect(disclosure.deletionProcedure).toContain("delete");
  });
});

describe("grantConsent", () => {
  it("issues an active receipt bound to the exact consented schema version", () => {
    const result = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    expect(result.receipt).toBeDefined();
    expect(result.receipt?.schemaVersion).toBe("1.0.0");
    expect(result.receipt?.status).toBe("active");
    expect(result.receipt?.receiptId.length).toBeGreaterThan(0);
  });

  it("issues distinct receipt IDs for repeated grants", () => {
    const first = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    const second = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    expect(first.receipt?.receiptId).not.toBe(second.receipt?.receiptId);
  });

  it("rejects a scope naming an event the schema does not permit", () => {
    const result = grantConsent(SCHEMA, ["unknown_event"], "2025-01-01T00:00:00.000Z");
    expect(result.receipt).toBeUndefined();
    expect((result as { errors: unknown[] }).errors.length).toBeGreaterThan(0);
  });

  it("rejects an invalid schema instead of issuing a receipt", () => {
    const result = grantConsent(
      {
        schemaVersion: "1.0.0",
        surfaces: ["cli"],
        // `sourcePath` is a forbidden excluded-category name, so the schema is invalid.
        events: [
          { name: "sourcePath", fields: [], purpose: "p", recipient: "r", retentionDays: 1 },
        ],
      },
      "all",
      "2025-01-01T00:00:00.000Z",
    );
    expect(result.receipt).toBeUndefined();
  });
});

describe("withdrawConsent / isConsentActive", () => {
  it("marks the receipt withdrawn and deactivates it", () => {
    const { receipt } = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    const withdrawn = withdrawConsent(receipt);
    expect(withdrawn.status).toBe("withdrawn");
    expect(isConsentActive(withdrawn, "1.0.0")).toBe(false);
  });

  it("is active only while status is active and schema version matches exactly", () => {
    const { receipt } = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    expect(isConsentActive(receipt, "1.0.0")).toBe(true);
    expect(isConsentActive(receipt, "2.0.0")).toBe(false);
  });
});

describe("isEventInScope", () => {
  it("treats an 'all' scope as covering every event", () => {
    const { receipt } = grantConsent(SCHEMA, "all", "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    expect(isEventInScope(receipt, "cli_install_completed")).toBe(true);
    expect(isEventInScope(receipt, "anything_else")).toBe(true);
  });

  it("restricts a named scope to its listed events", () => {
    const { receipt } = grantConsent(SCHEMA, ["cli_install_completed"], "2025-01-01T00:00:00.000Z");
    if (!receipt) throw new Error("expected a receipt");
    expect(isEventInScope(receipt, "cli_install_completed")).toBe(true);
    expect(isEventInScope(receipt, "other_event")).toBe(false);
  });
});
