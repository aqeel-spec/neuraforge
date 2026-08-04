import type { ConsentReceipt } from "./types.js";
import type { TelemetryStore } from "./collection.js";

/**
 * Receipt-based deletion (Requirement 15.9): a user who presents a valid consent receipt
 * can have every Telemetry event bound to that receipt deleted, and the caller receives a
 * report of completion or of any legally required retention that prevented full deletion.
 */

export interface DeletionReport {
  receiptId: string;
  deletedCount: number;
  /** Present only when one or more events could not be deleted due to a legally required retention obligation. */
  legallyRequiredRetention?: string;
}

/**
 * Deletes every stored Telemetry event bound to `receipt.receiptId`.
 *
 * `legalRetentionReason`, when supplied, models a legally required retention obligation
 * (e.g. an active audit or regulatory hold) that overrides deletion for this receipt; in
 * that case no events are deleted and the report identifies the reason instead of a
 * deleted count, per Requirement 15.9's "or any legally required retention" branch.
 */
export function deleteByConsentReceipt(
  receipt: ConsentReceipt,
  store: TelemetryStore,
  legalRetentionReason?: string,
): DeletionReport {
  if (legalRetentionReason) {
    return {
      receiptId: receipt.receiptId,
      deletedCount: 0,
      legallyRequiredRetention: legalRetentionReason,
    };
  }

  const deletedCount = store.deleteByReceiptId(receipt.receiptId);
  return { receiptId: receipt.receiptId, deletedCount };
}
