import { describe, expect, it } from "vitest";

import { allowedFieldNames, findEventDefinition, validateTelemetrySchema } from "./schema.js";
import type { TelemetrySchema } from "./types.js";

const VALID_SCHEMA: TelemetrySchema = {
  schemaVersion: "1.0.0",
  surfaces: ["cli", "mcp_server"],
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
      retentionDays: 30,
    },
  ],
};

/** Minimum surface list reused by the invalid-branch fixtures below. */
const SURFACES = { surfaces: ["cli"] } as const;

describe("validateTelemetrySchema", () => {
  it("accepts a complete, allowlisted schema", () => {
    expect(validateTelemetrySchema(VALID_SCHEMA)).toEqual({ valid: true, errors: [] });
  });

  it("rejects a non-object candidate", () => {
    const result = validateTelemetrySchema(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(["telemetry_schema_required"]);
  });

  it("rejects a retention period outside 0-30 days", () => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [{ ...VALID_SCHEMA.events[0], retentionDays: 31 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_retention_out_of_bounds")).toBe(
      true,
    );
  });

  it("accepts the retention boundary values 0 and 30", () => {
    const zero = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [{ ...VALID_SCHEMA.events[0], retentionDays: 0 }],
    });
    const thirty = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [{ ...VALID_SCHEMA.events[0], retentionDays: 30 }],
    });
    expect(zero.valid).toBe(true);
    expect(thirty.valid).toBe(true);
  });

  it("rejects a schema that declares no surface", () => {
    const result = validateTelemetrySchema({ schemaVersion: "1.0.0", events: VALID_SCHEMA.events });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_surfaces_required")).toBe(true);
  });

  it("rejects an unknown surface", () => {
    const result = validateTelemetrySchema({
      schemaVersion: "1.0.0",
      surfaces: ["analytics_warehouse"],
      events: VALID_SCHEMA.events,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_surface_unknown")).toBe(true);
  });

  it("rejects a field that omits its description", () => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [
        {
          name: "some_event",
          fields: [{ name: "count", type: "number" }],
          purpose: "p",
          recipient: "r",
          retentionDays: 1,
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.code === "telemetry_field_description_required"),
    ).toBe(true);
  });

  it.each([
    "sourcePath",
    "promptText",
    "brandColor",
    "userSecretKey",
    "authToken",
    "userEmail",
    "deviceId",
  ])("rejects a field name that references an excluded category: %s", (fieldName) => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [
        {
          name: "some_event",
          fields: [{ name: fieldName, type: "string", description: "d" }],
          purpose: "p",
          recipient: "r",
          retentionDays: 1,
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_field_forbidden")).toBe(true);
  });

  it.each(["ipAddress", "clientIp", "render_dir", "authToken", "displayName"])(
    "still rejects a short forbidden keyword at a token boundary: %s",
    (fieldName) => {
      const result = validateTelemetrySchema({
        ...SURFACES,
        schemaVersion: "1.0.0",
        events: [
          {
            name: "some_event",
            fields: [{ name: fieldName, type: "string", description: "d" }],
            purpose: "p",
            recipient: "r",
            retentionDays: 1,
          },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.code === "telemetry_field_forbidden")).toBe(true);
    },
  );

  it.each([
    "recipientCount",
    "descriptionLength",
    "scriptCount",
    "renderDirection",
    "multipleMatches",
  ])("does not reject a benign name that merely embeds a short keyword: %s", (fieldName) => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [
        {
          name: "some_event",
          fields: [{ name: fieldName, type: "number", description: "d" }],
          purpose: "p",
          recipient: "r",
          retentionDays: 1,
        },
      ],
    });
    expect(result.errors.some((error) => error.code === "telemetry_field_forbidden")).toBe(false);
  });

  it("rejects duplicate event names", () => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [VALID_SCHEMA.events[0], VALID_SCHEMA.events[0]],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_event_name_duplicate")).toBe(
      true,
    );
  });

  it("rejects an invalid field type", () => {
    const result = validateTelemetrySchema({
      ...SURFACES,
      schemaVersion: "1.0.0",
      events: [
        {
          name: "some_event",
          fields: [{ name: "count", type: "object", description: "d" }],
          purpose: "p",
          recipient: "r",
          retentionDays: 1,
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "telemetry_field_type_invalid")).toBe(true);
  });
});

describe("findEventDefinition / allowedFieldNames", () => {
  it("finds a defined event and its allowed field names", () => {
    const event = findEventDefinition(VALID_SCHEMA, "cli_install_completed");
    if (!event) throw new Error("expected event definition to exist");
    expect(allowedFieldNames(event)).toEqual(new Set(["componentCount", "succeeded"]));
  });

  it("returns undefined for an unknown event", () => {
    expect(findEventDefinition(VALID_SCHEMA, "unknown_event")).toBeUndefined();
  });
});
