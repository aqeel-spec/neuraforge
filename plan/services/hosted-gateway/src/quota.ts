import type { FieldError } from "@neuraforge/schemas";

import type { HostedPlanId } from "./pricing.js";

/**
 * Daily UTC Quota Windows and the strict Quota Accounting Data allowlist
 * (Requirement 18.12, 18.17). This module defines the window boundary math
 * and the ledger entry shape only; transactional exactly-once reservation
 * (Requirement 18.7-18.11), exhaustion rejection (Requirement 18.15,
 * 18.16), and response/inspection metadata (Requirement 18.13, 18.14) are
 * implemented alongside the hosted gateway dispatch adapter.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The half-open UTC day interval `[start, end)` a request timestamp falls into. */
export interface QuotaWindow {
  readonly start: string;
  readonly end: string;
}

function utcMidnightMs(timestampMs: number): number {
  return Math.floor(timestampMs / MS_PER_DAY) * MS_PER_DAY;
}

/**
 * Returns the half-open UTC-day Quota Window `[00:00:00, next 00:00:00)`
 * containing `timestampIso` (Requirement 18.12).
 */
export function quotaWindowForTimestamp(timestampIso: string): QuotaWindow {
  const timestampMs = new Date(timestampIso).valueOf();
  if (Number.isNaN(timestampMs)) {
    throw new RangeError("quotaWindowForTimestamp requires a valid ISO-8601 timestamp");
  }
  const startMs = utcMidnightMs(timestampMs);
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + MS_PER_DAY).toISOString(),
  };
}

/** Returns the next UTC midnight reset timestamp for `timestampIso`. */
export function nextResetForTimestamp(timestampIso: string): string {
  return quotaWindowForTimestamp(timestampIso).end;
}

/** True when `timestampIso` falls within `window` (`start` inclusive, `end` exclusive). */
export function isWithinQuotaWindow(timestampIso: string, window: QuotaWindow): boolean {
  const timestampMs = new Date(timestampIso).valueOf();
  const startMs = new Date(window.start).valueOf();
  const endMs = new Date(window.end).valueOf();
  return timestampMs >= startMs && timestampMs < endMs;
}

export type QuotaClassification = "counted" | "excluded";
export type QuotaResultClassification =
  | "pending"
  | "success"
  | "operation_error"
  | "pre_dispatch_rejection";

/**
 * Quota Accounting Data (Requirement 18.17): the strict, exhaustive field
 * allowlist for a persisted quota ledger entry. This type and
 * `QUOTA_LEDGER_ALLOWED_FIELDS` are the single source of truth other
 * modules must use to keep quota storage from ever holding payloads,
 * source, prompts, artifacts, Brand Config, paths, secrets, credentials,
 * or Personal Data.
 */
export interface QuotaLedgerEntry {
  readonly accountOrOrganizationId: string;
  readonly plan: HostedPlanId;
  readonly pricingVersion: string;
  readonly requestId: string;
  readonly operationId: string;
  readonly requestTimestamp: string;
  readonly classification: QuotaClassification;
  readonly resultClassification: QuotaResultClassification;
  readonly callsUsed: number;
  readonly callsRemaining: number;
  readonly resetAt: string;
}

/**
 * The exhaustive, ordered list of fields a Quota Ledger Entry may contain.
 * Any object with a key outside this set is not Quota Accounting Data.
 */
export const QUOTA_LEDGER_ALLOWED_FIELDS = [
  "accountOrOrganizationId",
  "plan",
  "pricingVersion",
  "requestId",
  "operationId",
  "requestTimestamp",
  "classification",
  "resultClassification",
  "callsUsed",
  "callsRemaining",
  "resetAt",
] as const satisfies readonly (keyof QuotaLedgerEntry)[];

const ALLOWED_FIELD_SET: ReadonlySet<string> = new Set(QUOTA_LEDGER_ALLOWED_FIELDS);

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && value === parsed.toISOString();
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function pushError(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

export interface QuotaLedgerEntryValidation {
  valid: boolean;
  errors: FieldError[];
}

/**
 * Validates that `input` is exactly a Quota Ledger Entry: every allowlisted
 * field is present with the correct type, and no additional field exists.
 * This is the enforcement point for the strict quota ledger allowlist
 * (Requirement 18.17); it accepts an unknown record so callers can reject
 * forbidden fields (payloads, paths, secrets, etc.) before persistence.
 */
export function validateQuotaLedgerEntry(
  input: Record<string, unknown>,
): QuotaLedgerEntryValidation {
  const errors: FieldError[] = [];

  for (const key of Object.keys(input)) {
    if (!ALLOWED_FIELD_SET.has(key)) {
      pushError(
        errors,
        "forbidden_quota_field",
        key,
        "must not appear in Quota Accounting Data",
        `Remove ${key} from the quota ledger entry; only ${QUOTA_LEDGER_ALLOWED_FIELDS.join(", ")} are permitted.`,
      );
    }
  }

  if (
    typeof input.accountOrOrganizationId !== "string" ||
    input.accountOrOrganizationId.trim().length === 0
  ) {
    pushError(
      errors,
      "required",
      "accountOrOrganizationId",
      "must be a non-empty string",
      "Identify the hosted account or organization.",
    );
  }
  if (input.plan !== "starter" && input.plan !== "pro" && input.plan !== "team") {
    pushError(
      errors,
      "invalid_plan",
      "plan",
      'must be "starter", "pro", or "team"',
      "Publish one of the three Hosted Plan identifiers.",
    );
  }
  if (typeof input.pricingVersion !== "string" || input.pricingVersion.trim().length === 0) {
    pushError(
      errors,
      "required",
      "pricingVersion",
      "must be a non-empty string",
      "Reference the exact Pricing Version applied to this request.",
    );
  }
  if (typeof input.requestId !== "string" || input.requestId.trim().length === 0) {
    pushError(
      errors,
      "required",
      "requestId",
      "must be a non-empty string",
      "Assign a unique request identifier for exactly-once accounting.",
    );
  }
  if (typeof input.operationId !== "string" || input.operationId.trim().length === 0) {
    pushError(
      errors,
      "required",
      "operationId",
      "must be a non-empty string",
      "Identify the MCP operation this request targeted.",
    );
  }
  if (!isIsoTimestamp(input.requestTimestamp)) {
    pushError(
      errors,
      "invalid_timestamp",
      "requestTimestamp",
      "must be an ISO-8601 UTC timestamp",
      "Record the exact request timestamp.",
    );
  }
  if (input.classification !== "counted" && input.classification !== "excluded") {
    pushError(
      errors,
      "invalid_classification",
      "classification",
      'must be "counted" or "excluded"',
      "Classify the request as counted or excluded.",
    );
  }
  if (
    input.resultClassification !== "pending" &&
    input.resultClassification !== "success" &&
    input.resultClassification !== "operation_error" &&
    input.resultClassification !== "pre_dispatch_rejection"
  ) {
    pushError(
      errors,
      "invalid_result_classification",
      "resultClassification",
      'must be "pending", "success", "operation_error", or "pre_dispatch_rejection"',
      "Classify the request result.",
    );
  }
  if (!isNonNegativeInteger(input.callsUsed)) {
    pushError(
      errors,
      "invalid_calls_used",
      "callsUsed",
      "must be a non-negative integer",
      "Record the calls used snapshot at accounting time.",
    );
  }
  if (!isNonNegativeInteger(input.callsRemaining)) {
    pushError(
      errors,
      "invalid_calls_remaining",
      "callsRemaining",
      "must be a non-negative integer",
      "Record the calls remaining snapshot at accounting time.",
    );
  }
  if (!isIsoTimestamp(input.resetAt)) {
    pushError(
      errors,
      "invalid_timestamp",
      "resetAt",
      "must be an ISO-8601 UTC timestamp",
      "Record the next Quota Window reset timestamp.",
    );
  }

  return { valid: errors.length === 0, errors };
}
