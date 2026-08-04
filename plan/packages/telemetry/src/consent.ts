import type { FieldError } from "@neuraforge/schemas";

import type {
  ConsentReceipt,
  TelemetryConsentDisclosure,
  TelemetryConsentScope,
  TelemetrySchema,
} from "./types.js";
import { validateTelemetrySchema } from "./schema.js";

/**
 * Consent disclosure, receipt issuance, and withdrawal.
 *
 * Requirement 15.1 requires Telemetry disabled by default; this module never emits an
 * active receipt except in direct response to an explicit `grantConsent` call, and
 * `disableProcedure`/`deletionProcedure` on every disclosure keep the required withdrawal
 * and deletion paths visible before consent is requested (Requirement 15.2).
 */

export interface ConsentGrantValidation {
  valid: boolean;
  errors: FieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

/**
 * Builds the disclosure a user must see before consent is requested (Requirement 15.2):
 * the exact schema version, every permitted event's fields/purpose/recipient/retention,
 * and the disable and deletion procedures.
 */
export function buildConsentDisclosure(
  schema: TelemetrySchema,
  disableProcedure: string,
  deletionProcedure: string,
): TelemetryConsentDisclosure {
  return {
    schemaVersion: schema.schemaVersion,
    events: schema.events,
    disableProcedure,
    deletionProcedure,
  };
}

function isValidScope(
  scope: unknown,
  schema: TelemetrySchema,
  errors: FieldError[],
  path: string,
): scope is TelemetryConsentScope {
  if (scope === "all") return true;

  if (!Array.isArray(scope) || scope.length === 0) {
    error(
      errors,
      "telemetry_consent_scope_invalid",
      path,
      'must be "all" or a non-empty array of permitted event names',
      'Grant consent to "all" or to a specific non-empty set of permitted event names.',
    );
    return false;
  }

  const permittedNames = new Set(schema.events.map((event) => event.name));
  let ok = true;
  scope.forEach((name, index) => {
    if (typeof name !== "string" || !permittedNames.has(name)) {
      error(
        errors,
        "telemetry_consent_scope_unknown_event",
        `${path}[${String(index)}]`,
        "must name an event permitted by the consented Telemetry Schema version",
        "Remove the unknown event name, or grant consent under a schema version that permits it.",
      );
      ok = false;
    }
  });
  return ok;
}

/**
 * Generates a receipt ID. Uses the platform CSPRNG (`crypto.randomUUID`) so receipt IDs
 * are unguessable and unlinkable to any other identifier, keeping the receipt itself free
 * of Personal Data per Requirement 15.5.
 */
function generateReceiptId(): string {
  return crypto.randomUUID();
}

/**
 * Records explicit Telemetry consent (Requirement 15.3): validates the disclosed Telemetry
 * Schema and requested scope, then issues a receipt binding a random receipt ID to the
 * exact consented schema version, scope, and grant timestamp.
 *
 * Returns validation errors instead of a receipt if the schema is invalid or the scope
 * names an event the schema does not permit; no receipt is issued in that case, so
 * collection remains disabled.
 */
export function grantConsent(
  schema: TelemetrySchema,
  scope: TelemetryConsentScope,
  grantedAt: string,
): { receipt: ConsentReceipt } | { receipt: undefined; errors: FieldError[] } {
  const errors: FieldError[] = [];

  const schemaValidation = validateTelemetrySchema(schema);
  if (!schemaValidation.valid) {
    return { receipt: undefined, errors: schemaValidation.errors };
  }

  if (!isValidScope(scope, schema, errors, "scope")) {
    return { receipt: undefined, errors };
  }

  const receipt: ConsentReceipt = {
    receiptId: generateReceiptId(),
    schemaVersion: schema.schemaVersion,
    scope,
    grantedAt,
    status: "active",
  };

  return { receipt };
}

/**
 * Withdraws consent by marking the receipt withdrawn (Requirement 15.8: transmission of
 * subsequent events must stop before the disable action is acknowledged). Callers must
 * persist the returned receipt and stop transmitting before returning any acknowledgement
 * to the user; this function performs no I/O itself so the ordering guarantee is the
 * caller's responsibility to preserve, but the receipt it returns is immediately usable to
 * gate the local `isConsentActive` check below before any acknowledgement is sent.
 */
export function withdrawConsent(receipt: ConsentReceipt): ConsentReceipt {
  return { ...receipt, status: "withdrawn" };
}

/**
 * Determines whether a receipt currently authorizes collection under the given schema
 * version. A receipt only authorizes collection while `status` is `"active"` AND its
 * `schemaVersion` matches the currently published schema version exactly (Requirement
 * 15.7: any change to the permitted events/fields/purposes/recipients/retention disables
 * emission under the changed version until new consent is granted, because the changed
 * publication carries a new `schemaVersion`).
 */
export function isConsentActive(receipt: ConsentReceipt, currentSchemaVersion: string): boolean {
  return receipt.status === "active" && receipt.schemaVersion === currentSchemaVersion;
}

/** Determines whether a receipt's scope authorizes a specific event name. */
export function isEventInScope(receipt: ConsentReceipt, eventName: string): boolean {
  if (receipt.scope === "all") return true;
  return receipt.scope.includes(eventName);
}

export function validateConsentReceiptShape(
  candidate: unknown,
  path = "receipt",
): ConsentGrantValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "consent_receipt_required",
      path,
      "must be a ConsentReceipt object",
      "Publish a complete consent receipt.",
    );
    return { valid: false, errors };
  }

  if (typeof candidate.receiptId !== "string" || candidate.receiptId.trim().length === 0) {
    error(
      errors,
      "consent_receipt_id_required",
      `${path}.receiptId`,
      "must be a non-empty string",
      "Publish a random receipt ID.",
    );
  }
  if (typeof candidate.schemaVersion !== "string" || candidate.schemaVersion.trim().length === 0) {
    error(
      errors,
      "consent_receipt_schema_version_required",
      `${path}.schemaVersion`,
      "must be a non-empty string",
      "Publish the consented schema version.",
    );
  }
  if (typeof candidate.grantedAt !== "string" || candidate.grantedAt.trim().length === 0) {
    error(
      errors,
      "consent_receipt_granted_at_required",
      `${path}.grantedAt`,
      "must be a non-empty timestamp string",
      "Publish the grant timestamp.",
    );
  }
  if (candidate.status !== "active" && candidate.status !== "withdrawn") {
    error(
      errors,
      "consent_receipt_status_invalid",
      `${path}.status`,
      'must be "active" or "withdrawn"',
      "Publish the current receipt status.",
    );
  }

  return { valid: errors.length === 0, errors };
}
