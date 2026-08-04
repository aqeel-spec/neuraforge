import type { ErrorEnvelope, FieldError, Result } from "@neuraforge-ui/schemas";

/**
 * Default-off, consent-gated telemetry for the CLI, MCP Server, Public
 * Documentation Site, and Self-Hosted Deployment surfaces.
 *
 * Validates: Requirements 15.1-15.11
 */

export type TelemetrySurface =
  | "cli"
  | "mcp_server"
  | "public_documentation_site"
  | "self_hosted_deployment";

export type TelemetryFieldType = "string" | "number" | "boolean";

export interface TelemetryFieldDefinition {
  name: string;
  type: TelemetryFieldType;
  description: string;
}

export interface TelemetryEventDefinition {
  name: string;
  purpose: string;
  recipient: string;
  /** Inclusive retention period in whole calendar days, 0 through 30. */
  retentionDays: number;
  fields: TelemetryFieldDefinition[];
}

export interface TelemetrySchema {
  schemaVersion: string;
  surfaces: TelemetrySurface[];
  events: TelemetryEventDefinition[];
}

export interface TelemetryValidation {
  valid: boolean;
  errors: FieldError[];
}

// ---------------------------------------------------------------------------
// Requirement 15.5: forbidden field categories
// ---------------------------------------------------------------------------

export type ForbiddenFieldCategory =
  | "source_code"
  | "prompts"
  | "brand_config"
  | "file_paths"
  | "secrets"
  | "credentials"
  | "personal_data";

const FORBIDDEN_KEYWORDS: Record<ForbiddenFieldCategory, string[]> = {
  source_code: ["sourcecode", "sourcefile", "codesnippet", "sourcetext", "filecontents"],
  prompts: ["prompt", "completion", "aiinput", "modeloutput", "modelresponse", "chatmessage"],
  brand_config: ["brandconfig", "brandvalue", "tokenvalue", "themevalue", "brandtoken"],
  file_paths: [
    "filepath",
    "directory",
    "cwd",
    "workingdirectory",
    "absolutepath",
    "relativepath",
    "foldername",
  ],
  secrets: ["secret", "apikey", "privatekey", "clientsecret", "signingkey", "encryptionkey"],
  credentials: [
    "credential",
    "password",
    "passwd",
    "authtoken",
    "bearer",
    "sessiontoken",
    "cookie",
    "accesstoken",
    "refreshtoken",
  ],
  personal_data: [
    "email",
    "ipaddress",
    "username",
    "phonenumber",
    "fullname",
    "personname",
    "displayname",
    "accountname",
    "ssn",
    "socialsecurity",
    "deviceid",
    "postaladdress",
    "homeaddress",
    "birthdate",
    "dateofbirth",
    "geolocation",
    "latitude",
    "longitude",
  ],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function detectForbiddenFieldCategories(
  fieldName: string,
  description: string,
): ForbiddenFieldCategory[] {
  const haystack = normalize(`${fieldName} ${description}`);
  const categories: ForbiddenFieldCategory[] = [];
  for (const [category, keywords] of Object.entries(FORBIDDEN_KEYWORDS) as [
    ForbiddenFieldCategory,
    string[],
  ][]) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      categories.push(category);
    }
  }
  return categories;
}

// ---------------------------------------------------------------------------
// Shared validation helpers
// ---------------------------------------------------------------------------

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function pushError(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

/**
 * Requirements 15.5, 15.6: the Telemetry Schema is a closed allowlist that
 * excludes source code, prompts, Brand Config values, file paths, secrets,
 * credentials, and Personal Data, and every retained event has a 0-30
 * calendar-day retention period.
 */
export function validateTelemetrySchema(schema: TelemetrySchema): TelemetryValidation {
  const errors: FieldError[] = [];
  if (!text(schema.schemaVersion)) {
    pushError(
      errors,
      "schema_version_required",
      "schemaVersion",
      "must be a non-empty string",
      "Publish a Telemetry Schema version.",
    );
  }
  if (!Array.isArray(schema.surfaces) || schema.surfaces.length === 0) {
    pushError(
      errors,
      "surfaces_required",
      "surfaces",
      "must list at least one telemetry surface",
      "Declare which surfaces this schema version applies to.",
    );
  }
  if (!Array.isArray(schema.events)) {
    pushError(
      errors,
      "events_required",
      "events",
      "must be an array",
      "Publish the allowlisted telemetry events.",
    );
    return { valid: false, errors };
  }

  const seenEventNames = new Set<string>();
  schema.events.forEach((eventDef, eventIndex) => {
    const prefix = `events[${String(eventIndex)}]`;
    if (!text(eventDef.name)) {
      pushError(
        errors,
        "event_name_required",
        `${prefix}.name`,
        "must be a non-empty string",
        "Name every allowlisted event.",
      );
    } else if (seenEventNames.has(eventDef.name)) {
      pushError(
        errors,
        "duplicate_event_name",
        `${prefix}.name`,
        "must be unique",
        "Use a unique event name per Telemetry Schema version.",
      );
    } else {
      seenEventNames.add(eventDef.name);
    }
    if (!text(eventDef.purpose)) {
      pushError(
        errors,
        "purpose_required",
        `${prefix}.purpose`,
        "must be a non-empty string",
        "Publish the collection purpose for this event.",
      );
    }
    if (!text(eventDef.recipient)) {
      pushError(
        errors,
        "recipient_required",
        `${prefix}.recipient`,
        "must be a non-empty string",
        "Publish the recipient for this event.",
      );
    }
    if (
      !Number.isInteger(eventDef.retentionDays) ||
      eventDef.retentionDays < 0 ||
      eventDef.retentionDays > 30
    ) {
      pushError(
        errors,
        "invalid_retention_period",
        `${prefix}.retentionDays`,
        "must be an integer from 0 through 30",
        "Assign a retention period from 0 through 30 calendar days.",
      );
    }
    if (!Array.isArray(eventDef.fields)) {
      pushError(
        errors,
        "fields_required",
        `${prefix}.fields`,
        "must be an array",
        "Publish the allowlisted fields for this event.",
      );
      return;
    }
    const seenFieldNames = new Set<string>();
    eventDef.fields.forEach((field, fieldIndex) => {
      const fieldPath = `${prefix}.fields[${String(fieldIndex)}]`;
      if (!text(field.name)) {
        pushError(
          errors,
          "field_name_required",
          `${fieldPath}.name`,
          "must be a non-empty string",
          "Name every allowlisted field.",
        );
      } else if (seenFieldNames.has(field.name)) {
        pushError(
          errors,
          "duplicate_field_name",
          `${fieldPath}.name`,
          "must be unique",
          "Use a unique field name per event.",
        );
      } else {
        seenFieldNames.add(field.name);
      }
      const forbidden = detectForbiddenFieldCategories(field.name, field.description);
      if (forbidden.length > 0) {
        pushError(
          errors,
          "forbidden_field_category",
          `${fieldPath}.name`,
          `must not resemble ${forbidden.join(", ")}`,
          "Remove or rename this field. The Telemetry Schema excludes source code, prompts, Brand Config values, file paths, secrets, credentials, and Personal Data.",
        );
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Requirement 15.2: disclosure before consent
// ---------------------------------------------------------------------------

export interface TelemetryDisclosure {
  schemaVersion: string;
  events: {
    name: string;
    purpose: string;
    recipient: string;
    retentionDays: number;
    fields: { name: string; type: TelemetryFieldType; description: string }[];
  }[];
  disableProcedure: string;
  deletionProcedure: string;
}

function invalidSchemaEnvelope(requestId: string, errors: FieldError[]): ErrorEnvelope {
  return {
    error: {
      code: "invalid_telemetry_schema",
      category: "validation",
      operation: "build_telemetry_disclosure",
      message: "The Telemetry Schema failed validation and cannot be disclosed or consented to.",
      retryable: false,
      fields: errors,
      requestId,
    },
  };
}

/**
 * Requirement 15.2: present the schema version, event fields, purposes,
 * retention period, recipient, disable procedure, and deletion procedure
 * before requesting explicit consent.
 */
export function buildTelemetryDisclosure(
  schema: TelemetrySchema,
  disableProcedure: string,
  deletionProcedure: string,
  requestId: string,
): Result<TelemetryDisclosure> {
  const validation = validateTelemetrySchema(schema);
  if (!validation.valid) {
    return { ok: false, error: invalidSchemaEnvelope(requestId, validation.errors) };
  }
  if (!text(disableProcedure) || !text(deletionProcedure)) {
    return {
      ok: false,
      error: invalidSchemaEnvelope(requestId, [
        {
          code: "procedure_required",
          path: !text(disableProcedure) ? "disableProcedure" : "deletionProcedure",
          constraint: "must be a non-empty string",
          guidance: "Publish the disable and deletion procedures alongside the disclosure.",
        },
      ]),
    };
  }
  return {
    ok: true,
    value: {
      schemaVersion: schema.schemaVersion,
      events: schema.events.map((eventDef) => ({
        name: eventDef.name,
        purpose: eventDef.purpose,
        recipient: eventDef.recipient,
        retentionDays: eventDef.retentionDays,
        fields: eventDef.fields.map((field) => ({
          name: field.name,
          type: field.type,
          description: field.description,
        })),
      })),
      disableProcedure,
      deletionProcedure,
    },
  };
}

// ---------------------------------------------------------------------------
// Requirements 15.1, 15.3, 15.7, 15.8: consent lifecycle
// ---------------------------------------------------------------------------

export interface ConsentReceipt {
  receiptId: string;
  schemaVersion: string;
  scope: string[];
  grantedAt: string;
  deletionProcedure: string;
}

export type TelemetryConsentState =
  | { status: "disabled" }
  | { status: "enabled"; receipt: ConsentReceipt };

/** Requirement 15.1: every surface starts with telemetry disabled. */
export function defaultTelemetryConsentState(): Record<TelemetrySurface, TelemetryConsentState> {
  return {
    cli: { status: "disabled" },
    mcp_server: { status: "disabled" },
    public_documentation_site: { status: "disabled" },
    self_hosted_deployment: { status: "disabled" },
  };
}

function grantEnvelope(
  requestId: string,
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): ErrorEnvelope {
  return {
    error: {
      code,
      category: "validation",
      operation: "grant_telemetry_consent",
      message: "Telemetry consent was not granted.",
      retryable: false,
      fields: [{ code, path, constraint, guidance }],
      requestId,
    },
  };
}

/**
 * Requirement 15.3: grants consent only after disclosure, records the
 * consented schema version, and returns a consent receipt.
 */
export function grantTelemetryConsent(
  disclosure: TelemetryDisclosure,
  scope: string[],
  now: string,
  generateReceiptId: () => string,
  requestId: string,
): Result<{ state: TelemetryConsentState; receipt: ConsentReceipt }> {
  if (!Array.isArray(scope) || scope.length === 0) {
    return {
      ok: false,
      error: grantEnvelope(
        requestId,
        "scope_required",
        "scope",
        "must list at least one disclosed event",
        "Consent must name every event it covers.",
      ),
    };
  }
  const disclosedNames = new Set(disclosure.events.map((eventDef) => eventDef.name));
  const unknown = scope.find((eventName) => !disclosedNames.has(eventName));
  if (unknown) {
    return {
      ok: false,
      error: grantEnvelope(
        requestId,
        "undisclosed_event_scope",
        "scope",
        "must only include disclosed events",
        `Remove "${unknown}"; it was not part of the disclosure presented before consent.`,
      ),
    };
  }
  const receipt: ConsentReceipt = {
    receiptId: generateReceiptId(),
    schemaVersion: disclosure.schemaVersion,
    scope: [...scope],
    grantedAt: now,
    deletionProcedure: disclosure.deletionProcedure,
  };
  return { ok: true, value: { state: { status: "enabled", receipt }, receipt } };
}

export interface TelemetryDisableResult {
  state: TelemetryConsentState;
  acknowledgement: { disabledAt: string; message: string };
}

/**
 * Requirement 15.8: stop transmitting subsequent telemetry events before
 * acknowledging the disable action. `stopTransmitting` must synchronously
 * (or awaitably) halt the sink before this function returns the
 * acknowledgement.
 */
export async function withdrawTelemetryConsent(
  stopTransmitting: () => void | Promise<void>,
  now: string,
): Promise<TelemetryDisableResult> {
  await stopTransmitting();
  return {
    state: { status: "disabled" },
    acknowledgement: {
      disabledAt: now,
      message: "Telemetry is disabled. No further events will be transmitted.",
    },
  };
}

/**
 * Requirement 15.7: a schema-version change (permitted events, fields,
 * purposes, recipients, or retention periods) disables collection under the
 * new version until the user grants new consent.
 */
export function reconcileConsentOnSchemaChange(
  state: TelemetryConsentState,
  currentSchemaVersion: string,
): TelemetryConsentState {
  if (state.status === "enabled" && state.receipt.schemaVersion !== currentSchemaVersion) {
    return { status: "disabled" };
  }
  return state;
}

// ---------------------------------------------------------------------------
// Requirements 15.4, 15.11: local validation before storage or transmission
// ---------------------------------------------------------------------------

export interface TelemetryEvent {
  name: string;
  occurredAt: string;
  fields: Record<string, string | number | boolean>;
}

function eventEnvelope(
  requestId: string,
  code: string,
  message: string,
  fields?: FieldError[],
): ErrorEnvelope {
  return {
    error: {
      code,
      category: "validation",
      operation: "validate_telemetry_event",
      message,
      retryable: false,
      ...(fields ? { fields } : {}),
      requestId,
    },
  };
}

/**
 * Requirements 15.4, 15.11: discard any event that is not permitted by the
 * currently consented Telemetry Schema version before it reaches storage or
 * a transmission sink.
 */
export function validateTelemetryEvent(
  schema: TelemetrySchema,
  consent: TelemetryConsentState,
  event: TelemetryEvent,
  requestId: string,
): Result<{
  event: TelemetryEvent;
  eventDefinition: TelemetryEventDefinition;
  receipt: ConsentReceipt;
}> {
  if (consent.status !== "enabled") {
    return {
      ok: false,
      error: eventEnvelope(
        requestId,
        "telemetry_disabled",
        "Telemetry is disabled; the event was discarded.",
      ),
    };
  }
  if (consent.receipt.schemaVersion !== schema.schemaVersion) {
    return {
      ok: false,
      error: eventEnvelope(
        requestId,
        "schema_version_mismatch",
        "The Telemetry Schema version changed; the event was discarded pending re-consent.",
      ),
    };
  }
  if (!consent.receipt.scope.includes(event.name)) {
    return {
      ok: false,
      error: eventEnvelope(
        requestId,
        "event_out_of_scope",
        "The event is outside the consented scope; the event was discarded.",
      ),
    };
  }
  const eventDefinition = schema.events.find((candidate) => candidate.name === event.name);
  if (!eventDefinition) {
    return {
      ok: false,
      error: eventEnvelope(
        requestId,
        "unknown_event",
        "The event is not part of the Telemetry Schema; the event was discarded.",
      ),
    };
  }

  const errors: FieldError[] = [];
  const allowedFields = new Map(eventDefinition.fields.map((field) => [field.name, field.type]));
  for (const [fieldName, value] of Object.entries(event.fields)) {
    const expectedType = allowedFields.get(fieldName);
    if (!expectedType) {
      pushError(
        errors,
        "unknown_field",
        `fields.${fieldName}`,
        "must be a field allowlisted by the Telemetry Schema",
        "Remove this field; it is not part of the consented schema.",
      );
      continue;
    }
    if (typeof value !== expectedType) {
      pushError(
        errors,
        "invalid_field_type",
        `fields.${fieldName}`,
        `must be of type "${expectedType}"`,
        "Send only the allowlisted primitive type for this field.",
      );
    }
  }
  if (errors.length > 0) {
    return {
      ok: false,
      error: eventEnvelope(
        requestId,
        "invalid_telemetry_event",
        "The event failed Telemetry Schema validation and was discarded.",
        errors,
      ),
    };
  }

  return { ok: true, value: { event, eventDefinition, receipt: consent.receipt } };
}

// ---------------------------------------------------------------------------
// Bounded local retention and receipt-based deletion
// ---------------------------------------------------------------------------

export interface RetainedTelemetryEvent {
  event: TelemetryEvent;
  receiptId: string;
  retainedAt: string;
  retentionDays: number;
  legalHold?: { reason: string; retainUntil: string };
}

export interface TelemetryStore {
  events: RetainedTelemetryEvent[];
}

export function createTelemetryStore(): TelemetryStore {
  return { events: [] };
}

function addDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/**
 * Requirements 15.4, 15.6, 15.11: only retain events permitted by the
 * consented schema, and never retain an event past its declared 0-30 day
 * retention period.
 */
export function retainTelemetryEvent(
  store: TelemetryStore,
  schema: TelemetrySchema,
  consent: TelemetryConsentState,
  event: TelemetryEvent,
  now: string,
  requestId: string,
): Result<TelemetryStore> {
  const validated = validateTelemetryEvent(schema, consent, event, requestId);
  if (!validated.ok) return validated;
  const retained: RetainedTelemetryEvent = {
    event,
    receiptId: validated.value.receipt.receiptId,
    retainedAt: now,
    retentionDays: validated.value.eventDefinition.retentionDays,
  };
  return { ok: true, value: { events: [...store.events, retained] } };
}

/** Prunes events whose bounded retention period has elapsed as of `now`. */
export function pruneExpiredTelemetryEvents(store: TelemetryStore, now: string): TelemetryStore {
  const nowMs = new Date(now).getTime();
  return {
    events: store.events.filter(
      (retained) =>
        new Date(addDays(retained.retainedAt, retained.retentionDays)).getTime() > nowMs,
    ),
  };
}

export interface TelemetryDeletionReport {
  receiptId: string;
  completedAt: string;
  deletedCount: number;
  retainedUnderLegalHold: RetainedTelemetryEvent[];
}

/**
 * Requirement 15.9: delete retained telemetry associated with a valid
 * consent receipt and report completion or any legally required retention.
 */
export function deleteTelemetryByReceipt(
  store: TelemetryStore,
  receipt: ConsentReceipt,
  now: string,
): { store: TelemetryStore; report: TelemetryDeletionReport } {
  const matching = store.events.filter((retained) => retained.receiptId === receipt.receiptId);
  const retainedUnderLegalHold = matching.filter(
    (retained) =>
      retained.legalHold &&
      new Date(retained.legalHold.retainUntil).getTime() > new Date(now).getTime(),
  );
  const legalHoldIds = new Set(retainedUnderLegalHold);
  const remaining = store.events.filter(
    (retained) => retained.receiptId !== receipt.receiptId || legalHoldIds.has(retained),
  );
  return {
    store: { events: remaining },
    report: {
      receiptId: receipt.receiptId,
      completedAt: now,
      deletedCount: matching.length - retainedUnderLegalHold.length,
      retainedUnderLegalHold,
    },
  };
}

// ---------------------------------------------------------------------------
// Allowlist transmission sink
// ---------------------------------------------------------------------------

export type TelemetryTransmitter = (
  event: TelemetryEvent,
  receipt: ConsentReceipt,
  recipient: string,
) => void | Promise<void>;

/**
 * Requirements 15.4, 15.11: validates an event against the consented
 * Telemetry Schema before invoking the transmission sink, and only ever
 * forwards the event to the recipient declared by the schema (an allowlist
 * sink cannot receive an unvalidated event or a different recipient).
 */
export async function dispatchTelemetryEvent(
  schema: TelemetrySchema,
  consent: TelemetryConsentState,
  event: TelemetryEvent,
  transmit: TelemetryTransmitter,
  requestId: string,
): Promise<Result<{ recipient: string }>> {
  const validated = validateTelemetryEvent(schema, consent, event, requestId);
  if (!validated.ok) return validated;
  await transmit(
    validated.value.event,
    validated.value.receipt,
    validated.value.eventDefinition.recipient,
  );
  return { ok: true, value: { recipient: validated.value.eventDefinition.recipient } };
}
