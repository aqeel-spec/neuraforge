import type { FieldError } from "@neuraforge-ui/schemas";

import { HOSTED_PLAN_IDS, type HostedPlanId } from "./pricing.js";

/**
 * Quota Ledger model: the strict, data-minimized projection used for Hosted_MCP_Service
 * quota counting and usage metadata (Requirement 18.17, design.md "Quota Ledger Entry").
 *
 * `QUOTA_LEDGER_ALLOWED_FIELDS` is the closed allowlist of persistable columns. It
 * intentionally excludes request/response payloads, source code, prompts, artifact
 * content, Brand Config values, file paths, secrets, credentials, and any other
 * Personal Data field, per the `Quota_Accounting_Data` glossary definition and Property
 * 46. `validateQuotaLedgerEntry` rejects any candidate record carrying a field outside
 * this allowlist, so a persistence adapter cannot silently widen the stored shape.
 */

export type QuotaRequestClassification = "counted" | "excluded";
export type QuotaResultClassification =
  | "pending"
  | "success"
  | "operation_error"
  | "pre_dispatch_rejection";

export interface QuotaLedgerEntry {
  accountOrOrganizationId: string;
  plan: HostedPlanId;
  pricingVersion: string;
  requestId: string;
  operationId: string;
  /** ISO-8601 UTC request timestamp. */
  requestTimestamp: string;
  classification: QuotaRequestClassification;
  resultClassification: QuotaResultClassification;
  callsUsed: number;
  callsRemaining: number;
  /** ISO-8601 UTC timestamp of the next Quota_Window reset. */
  resetAt: string;
}

/** The exact closed set of columns `QuotaLedgerEntry` (and only it) may contain. */
export const QUOTA_LEDGER_ALLOWED_FIELDS: ReadonlySet<keyof QuotaLedgerEntry> = new Set([
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
]);

/**
 * Forbidden field names that must never appear on a Quota Ledger Entry, per the
 * Quota_Accounting_Data exclusion list. Used to give a precise, actionable error when a
 * candidate record smuggles one of these fields in under an unexpected key.
 */
const FORBIDDEN_FIELD_NAMES = new Set([
  "payload",
  "requestPayload",
  "responsePayload",
  "sourceCode",
  "source",
  "prompt",
  "prompts",
  "artifactContent",
  "brandConfig",
  "filePath",
  "path",
  "paths",
  "secret",
  "secrets",
  "credential",
  "credentials",
  "ipAddress",
  "ip",
  "email",
  "personalData",
  "userAgent",
]);

export interface QuotaLedgerValidation {
  valid: boolean;
  errors: FieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).valueOf());
}

function error(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

const REQUEST_CLASSIFICATIONS = new Set<QuotaRequestClassification>(["counted", "excluded"]);
const RESULT_CLASSIFICATIONS = new Set<QuotaResultClassification>([
  "pending",
  "success",
  "operation_error",
  "pre_dispatch_rejection",
]);

/**
 * Validates that a candidate quota-ledger record is a strict, data-minimized
 * `QuotaLedgerEntry`: only allowlisted fields, no forbidden field name under any key,
 * and well-formed values for every required field. Accumulates every violation.
 */
export function validateQuotaLedgerEntry(
  candidate: unknown,
  path = "quotaLedgerEntry",
): QuotaLedgerValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "quota_ledger_entry_required",
      path,
      "must be a QuotaLedgerEntry object",
      "Publish a complete, data-minimized quota ledger entry.",
    );
    return { valid: false, errors };
  }

  for (const key of Object.keys(candidate)) {
    if (!QUOTA_LEDGER_ALLOWED_FIELDS.has(key as keyof QuotaLedgerEntry)) {
      const forbidden = FORBIDDEN_FIELD_NAMES.has(key.toLowerCase());
      error(
        errors,
        forbidden ? "forbidden_quota_field" : "unexpected_quota_field",
        `${path}.${key}`,
        "must not declare fields outside the closed Quota_Accounting_Data allowlist",
        forbidden
          ? "Remove this field. Quota_Accounting_Data must never store payloads, source, prompts, artifact content, Brand Config values, paths, secrets, credentials, or Personal Data."
          : "Remove the field; only the documented Quota_Accounting_Data columns may be persisted.",
      );
    }
  }

  if (!isNonEmptyString(candidate.accountOrOrganizationId)) {
    error(
      errors,
      "required",
      `${path}.accountOrOrganizationId`,
      "must be a non-empty string",
      "Identify the account or organization for this quota entry.",
    );
  }
  if (!HOSTED_PLAN_IDS.includes(candidate.plan as HostedPlanId)) {
    error(
      errors,
      "invalid_plan",
      `${path}.plan`,
      'must be "starter", "pro", or "team"',
      "Record the exact Hosted Plan active for this request.",
    );
  }
  if (!isNonEmptyString(candidate.pricingVersion)) {
    error(
      errors,
      "required",
      `${path}.pricingVersion`,
      "must be a non-empty string",
      "Record the exact Pricing Version applied to this request.",
    );
  }
  if (!isNonEmptyString(candidate.requestId)) {
    error(
      errors,
      "required",
      `${path}.requestId`,
      "must be a non-empty string",
      "Record the unique request identifier used for exactly-once accounting.",
    );
  }
  if (!isNonEmptyString(candidate.operationId)) {
    error(
      errors,
      "required",
      `${path}.operationId`,
      "must be a non-empty string",
      "Record the MCP operation identifier for this request.",
    );
  }
  if (!isTimestamp(candidate.requestTimestamp)) {
    error(
      errors,
      "invalid_timestamp",
      `${path}.requestTimestamp`,
      "must be a valid ISO-8601 UTC timestamp",
      "Record the request's UTC timestamp.",
    );
  }
  if (!REQUEST_CLASSIFICATIONS.has(candidate.classification as QuotaRequestClassification)) {
    error(
      errors,
      "invalid_classification",
      `${path}.classification`,
      'must be "counted" or "excluded"',
      "Classify whether this request counts toward the daily quota.",
    );
  }
  if (!RESULT_CLASSIFICATIONS.has(candidate.resultClassification as QuotaResultClassification)) {
    error(
      errors,
      "invalid_result_classification",
      `${path}.resultClassification`,
      'must be "pending", "success", "operation_error", or "pre_dispatch_rejection"',
      "Classify the dispatch result for this request.",
    );
  }
  if (!Number.isInteger(candidate.callsUsed) || (candidate.callsUsed as number) < 0) {
    error(
      errors,
      "invalid_calls_used",
      `${path}.callsUsed`,
      "must be a non-negative integer",
      "Record the calls used snapshot at the time of this entry.",
    );
  }
  if (!Number.isInteger(candidate.callsRemaining) || (candidate.callsRemaining as number) < 0) {
    error(
      errors,
      "invalid_calls_remaining",
      `${path}.callsRemaining`,
      "must be a non-negative integer",
      "Record the calls remaining snapshot at the time of this entry.",
    );
  }
  if (!isTimestamp(candidate.resetAt)) {
    error(
      errors,
      "invalid_timestamp",
      `${path}.resetAt`,
      "must be a valid ISO-8601 UTC timestamp",
      "Record the next Quota_Window reset timestamp.",
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Constructs a well-formed `QuotaLedgerEntry` from exactly its allowlisted fields.
 * Using this factory (rather than spreading an arbitrary object) is the primary defense
 * against a caller accidentally widening the persisted shape with a forbidden field.
 */
export function createQuotaLedgerEntry(fields: QuotaLedgerEntry): QuotaLedgerEntry {
  return {
    accountOrOrganizationId: fields.accountOrOrganizationId,
    plan: fields.plan,
    pricingVersion: fields.pricingVersion,
    requestId: fields.requestId,
    operationId: fields.operationId,
    requestTimestamp: fields.requestTimestamp,
    classification: fields.classification,
    resultClassification: fields.resultClassification,
    callsUsed: fields.callsUsed,
    callsRemaining: fields.callsRemaining,
    resetAt: fields.resetAt,
  };
}
