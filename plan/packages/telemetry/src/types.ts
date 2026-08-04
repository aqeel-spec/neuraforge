/**
 * Local (non-shared) telemetry data models.
 *
 * These types are deliberately kept inside `@neuraforge/telemetry` rather than in
 * `@neuraforge/schemas`: no other package (Registry builder, CLI, MCP core, hosted
 * gateway) needs to reference a Telemetry Schema or Consent Receipt shape, so promoting
 * them to the shared common schema would only widen that package's surface without
 * benefit.
 */

/** The surfaces Requirement 15.1 requires to default Telemetry off. */
export type TelemetrySurface =
  | "cli"
  | "mcp_server"
  | "public_documentation_site"
  | "self_hosted_deployment";

/** Allowed primitive types for a Telemetry event field. Never an object/array to keep events flat and auditable. */
export type TelemetryFieldType = "string" | "number" | "boolean";

export interface TelemetryFieldDefinition {
  name: string;
  type: TelemetryFieldType;
  description: string;
}

/**
 * One allowlisted Telemetry event definition (Requirement 15.5, 15.6): the exact fields
 * permitted on the event, its collection purpose, its recipient, and its retention period
 * in whole calendar days from 0 through 30 inclusive.
 */
export interface TelemetryEventDefinition {
  name: string;
  purpose: string;
  recipient: string;
  retentionDays: number;
  fields: TelemetryFieldDefinition[];
}

/**
 * The public, versioned, machine-readable Telemetry Schema (Requirement 15.5, 15.6, 15.7).
 * A consent receipt binds to `schemaVersion` exactly; any change to the permitted events,
 * fields, purposes, recipients, or retention periods requires a new `schemaVersion` and
 * invalidates consent granted under a prior version.
 */
export interface TelemetrySchema {
  schemaVersion: string;
  surfaces: TelemetrySurface[];
  events: TelemetryEventDefinition[];
}

/** One candidate Telemetry event instance, prior to local Telemetry Schema validation. */
export interface TelemetryEvent {
  name: string;
  occurredAt: string;
  fields: Record<string, string | number | boolean>;
}

/**
 * The set of events a consent grant authorizes: either every event the consented Telemetry
 * Schema version permits (`"all"`), or an explicit non-empty subset of permitted event
 * names (Requirement 15.3).
 */
export type TelemetryConsentScope = "all" | readonly string[];

/**
 * Everything a user must be shown before consent is requested (Requirement 15.2): the exact
 * schema version consent would bind to, every permitted event with its fields, purpose,
 * recipient, and retention period, and the procedures to disable collection and to request
 * deletion.
 */
export interface TelemetryConsentDisclosure {
  schemaVersion: string;
  events: TelemetryEventDefinition[];
  disableProcedure: string;
  deletionProcedure: string;
}

/**
 * Proof of an explicit consent grant (Requirement 15.3, 15.7, 15.8, 15.9). A receipt binds a
 * random, unlinkable receipt ID to the exact consented `schemaVersion` and `scope`, which is
 * what makes consent version-bound (a republished schema carries a new version and therefore
 * invalidates the receipt) and what makes receipt-based deletion possible without storing any
 * user identifier.
 */
export interface ConsentReceipt {
  receiptId: string;
  schemaVersion: string;
  scope: TelemetryConsentScope;
  grantedAt: string;
  status: "active" | "withdrawn";
}

/**
 * An admitted Telemetry event as held by a sink store. Adds only the two fields required to
 * enforce privacy obligations: the authorizing `receiptId` (Requirement 15.9 receipt-based
 * deletion) and the computed `retainUntil` deadline derived from the event definition's
 * 0-30 day retention period (Requirement 15.6 bounded retention).
 */
export interface StoredTelemetryEvent extends TelemetryEvent {
  receiptId: string;
  retainUntil: string;
}
