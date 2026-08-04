import type { ConsentReceipt } from "./types.js";

/**
 * Bounded retention and receipt-based deletion (Requirement 15.6, 15.9).
 * A retained event is tied to the consent receipt that authorized its
 * collection so that a deletion request naming a receipt can locate and
 * remove every event collected under it, and so that retention expiry can
 * be evaluated per event without a separate lookup table.
 */
export interface RetainedTelemetryEvent {
  readonly receiptId: string;
  readonly name: string;
  readonly occurredAt: string;
  readonly fields: Readonly<Record<string, string | number | boolean>>;
  readonly retentionDays: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The exact instant a retained event's retention period elapses. */
export function retentionExpiresAt(event: RetainedTelemetryEvent): string {
  const occurredMs = new Date(event.occurredAt).valueOf();
  if (Number.isNaN(occurredMs)) {
    throw new RangeError("retentionExpiresAt requires a valid ISO-8601 occurredAt timestamp");
  }
  if (
    !Number.isInteger(event.retentionDays) ||
    event.retentionDays < 0 ||
    event.retentionDays > 30
  ) {
    throw new RangeError("retentionExpiresAt requires a 0-30 calendar day retentionDays value");
  }
  return new Date(occurredMs + event.retentionDays * MS_PER_DAY).toISOString();
}

/** True when `event` has passed its retention period as of `asOfIso`. */
export function isRetentionExpired(event: RetainedTelemetryEvent, asOfIso: string): boolean {
  const asOfMs = new Date(asOfIso).valueOf();
  const expiresMs = new Date(retentionExpiresAt(event)).valueOf();
  return asOfMs >= expiresMs;
}

/**
 * Returns the subset of `events` still inside their retention window as of
 * `asOfIso`; every other event has exceeded its Telemetry_Schema-declared
 * 0-30 day retention period and must not remain in a retained store
 * (Requirement 15.6).
 */
export function pruneExpiredTelemetryEvents(
  events: readonly RetainedTelemetryEvent[],
  asOfIso: string,
): RetainedTelemetryEvent[] {
  return events.filter((event) => !isRetentionExpired(event, asOfIso));
}

export type DeletionResult =
  | { readonly status: "completed"; readonly deletedCount: number }
  | { readonly status: "invalid_receipt" }
  | {
      readonly status: "retained_by_legal_requirement";
      readonly reason: string;
      readonly deletedCount: number;
    };

/**
 * Deletes every retained event associated with `receipt` and reports
 * completion, an invalid-receipt outcome, or a legally required retention
 * outcome (Requirement 15.9). `legalRetentionReason`, when supplied,
 * models a documented legal hold that prevents full deletion; events not
 * covered by the hold are still deleted.
 */
export function deleteTelemetryByReceipt(
  events: readonly RetainedTelemetryEvent[],
  receipt: ConsentReceipt,
  options?: {
    readonly legalRetentionReason?: string;
    readonly legallyRetainedNames?: readonly string[];
  },
): { readonly remaining: RetainedTelemetryEvent[]; readonly result: DeletionResult } {
  if (typeof receipt.receiptId !== "string" || receipt.receiptId.trim().length === 0) {
    return { remaining: [...events], result: { status: "invalid_receipt" } };
  }

  const legallyRetainedNames = new Set(options?.legallyRetainedNames ?? []);
  const remaining: RetainedTelemetryEvent[] = [];
  let deletedCount = 0;

  for (const event of events) {
    const matchesReceipt = event.receiptId === receipt.receiptId;
    if (!matchesReceipt) {
      remaining.push(event);
      continue;
    }
    if (options?.legalRetentionReason && legallyRetainedNames.has(event.name)) {
      remaining.push(event);
      continue;
    }
    deletedCount += 1;
  }

  if (
    options?.legalRetentionReason &&
    remaining.some((event) => event.receiptId === receipt.receiptId)
  ) {
    return {
      remaining,
      result: {
        status: "retained_by_legal_requirement",
        reason: options.legalRetentionReason,
        deletedCount,
      },
    };
  }

  return { remaining, result: { status: "completed", deletedCount } };
}
