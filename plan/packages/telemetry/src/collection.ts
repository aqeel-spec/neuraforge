import type {
  ConsentReceipt,
  StoredTelemetryEvent,
  TelemetryEvent,
  TelemetrySchema,
} from "./types.js";
import { allowedFieldNames, findEventDefinition } from "./schema.js";
import { isConsentActive, isEventInScope } from "./consent.js";

/**
 * Local event validation, retention computation, and receipt-scoped store.
 *
 * Requirement 15.4 and 15.11: only events/fields permitted by the consented schema are
 * collected, and any event that fails schema validation is discarded locally before it
 * ever reaches storage or a transmission sink. Requirement 15.6/15.9: every stored event
 * carries a bounded `retainUntil` and can be deleted by consent receipt.
 */

export type TelemetryDiscardReason =
  | "no_active_consent"
  | "event_out_of_scope"
  | "unknown_event"
  | "unknown_field"
  | "field_type_mismatch"
  | "schema_version_mismatch";

export type CollectionResult =
  | { admitted: true; event: StoredTelemetryEvent }
  | { admitted: false; reason: TelemetryDiscardReason };

function fieldTypeMatches(value: unknown, type: "string" | "number" | "boolean"): boolean {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === "boolean";
}

function addDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/**
 * Validates a candidate Telemetry event against the consented Telemetry Schema and
 * receipt, and, only if it passes, computes the stored record with its bounded retention
 * deadline. Discards (returns `admitted: false`, never throws) rather than storing or
 * forwarding anything for:
 *  - a withdrawn or version-mismatched receipt (Requirement 15.7, 15.8),
 *  - an event name outside the receipt's consented scope (Requirement 15.3),
 *  - an event name the schema does not define (Requirement 15.11),
 *  - a field name outside that event's allowlist (Requirement 15.4, 15.5), or
 *  - a field value whose runtime type does not match the schema's declared type.
 */
export function collectEvent(
  candidateEvent: TelemetryEvent,
  schema: TelemetrySchema,
  receipt: ConsentReceipt,
): CollectionResult {
  if (!isConsentActive(receipt, schema.schemaVersion)) {
    return {
      admitted: false,
      reason:
        receipt.schemaVersion !== schema.schemaVersion
          ? "schema_version_mismatch"
          : "no_active_consent",
    };
  }

  if (!isEventInScope(receipt, candidateEvent.name)) {
    return { admitted: false, reason: "event_out_of_scope" };
  }

  const definition = findEventDefinition(schema, candidateEvent.name);
  if (!definition) {
    return { admitted: false, reason: "unknown_event" };
  }

  const permittedFieldNames = allowedFieldNames(definition);
  const fieldTypeByName = new Map(
    definition.fields.map((field) => [field.name, field.type] as const),
  );

  for (const fieldName of Object.keys(candidateEvent.fields)) {
    if (!permittedFieldNames.has(fieldName)) {
      return { admitted: false, reason: "unknown_field" };
    }
    const declaredType = fieldTypeByName.get(fieldName);
    if (!declaredType || !fieldTypeMatches(candidateEvent.fields[fieldName], declaredType)) {
      return { admitted: false, reason: "field_type_mismatch" };
    }
  }

  const stored: StoredTelemetryEvent = {
    ...candidateEvent,
    receiptId: receipt.receiptId,
    retainUntil: addDays(candidateEvent.occurredAt, definition.retentionDays),
  };

  return { admitted: true, event: stored };
}

/**
 * A minimal in-memory allowlist sink store used by local validation, CLI/self-host
 * default storage, and tests. Real deployments may swap in another sink, but every sink
 * implementation must honor the same receipt-scoped deletion and retention-bound purge
 * contract exercised here.
 */
export class TelemetryStore {
  private readonly events: StoredTelemetryEvent[] = [];

  add(event: StoredTelemetryEvent): void {
    this.events.push(event);
  }

  all(): readonly StoredTelemetryEvent[] {
    return this.events;
  }

  /**
   * Deletes every stored event bound to the given consent receipt ID (Requirement 15.9).
   * Returns the count of deleted events so a caller can report completion.
   */
  deleteByReceiptId(receiptId: string): number {
    const before = this.events.length;
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      if (this.events[index]?.receiptId === receiptId) {
        this.events.splice(index, 1);
      }
    }
    return before - this.events.length;
  }

  /**
   * Removes every event whose `retainUntil` deadline is at or before `now`, enforcing the
   * 0-30 day bounded retention declared by the Telemetry Schema (Requirement 15.6).
   */
  purgeExpired(now: string): number {
    const nowMs = new Date(now).getTime();
    const before = this.events.length;
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      const event = this.events[index];
      if (event && new Date(event.retainUntil).getTime() <= nowMs) {
        this.events.splice(index, 1);
      }
    }
    return before - this.events.length;
  }
}

/**
 * A transmission sink contract. `send` must throw or reject on failure; `collectAndSend`
 * below is fail-closed and will not have stored or attempted transmission for any event
 * that failed local validation, satisfying Requirement 15.11's "discard before storage or
 * transmission" ordering.
 */
export interface TelemetrySink {
  send(event: StoredTelemetryEvent): Promise<void>;
}

/**
 * Validates a candidate event, and only for an admitted event, stores it locally and then
 * forwards it to the sink. An event that fails validation results in zero store calls and
 * zero sink calls (Property 37's fail-closed requirement).
 */
export async function collectAndSend(
  candidateEvent: TelemetryEvent,
  schema: TelemetrySchema,
  receipt: ConsentReceipt,
  store: TelemetryStore,
  sink: TelemetrySink,
): Promise<CollectionResult> {
  const result = collectEvent(candidateEvent, schema, receipt);
  if (!result.admitted) {
    return result;
  }

  store.add(result.event);
  await sink.send(result.event);
  return result;
}
