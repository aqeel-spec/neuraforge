import type { FieldError } from "@neuraforge/schemas";

import type {
  TelemetryEventDefinition,
  TelemetryFieldDefinition,
  TelemetrySchema,
  TelemetrySurface,
} from "./types.js";

/**
 * Telemetry Schema validation and the excluded-category denylist.
 *
 * Requirement 15.5 requires the Telemetry Schema itself to exclude source code, prompts,
 * Brand Config values, file paths, secrets, credentials, and Personal Data. Because event
 * and field names are open (the schema author names them), the schema validator enforces
 * the exclusion with a keyword denylist over field/event names rather than a closed field
 * list, so any candidate schema that tries to declare a forbidden field is rejected before
 * it can reach consent disclosure, collection, or transmission.
 */

const MIN_RETENTION_DAYS = 0;
const MAX_RETENTION_DAYS = 30;

/**
 * The closed set of surfaces a Telemetry Schema may govern (Requirement 15.1). Kept here as
 * a runtime value because `TelemetrySurface` is a compile-time-only union and the validator
 * must reject unknown surfaces arriving from untrusted JSON.
 */
export const TELEMETRY_SURFACES: ReadonlySet<TelemetrySurface> = new Set<TelemetrySurface>([
  "cli",
  "mcp_server",
  "public_documentation_site",
  "self_hosted_deployment",
]);

/**
 * Substrings and tokens that identify a forbidden category.
 *
 * Two match modes exist because a single raw-substring rule is unusable for short keywords:
 * `"ip"` as a substring also rejects `recipient`, `description`, and `script`, and `"dir"`
 * also rejects `direction`. Those keywords are therefore matched against name *tokens*
 * (split on camelCase and separators), while longer, distinctive keywords keep substring
 * matching so embedded forms such as `srcPathPrefix` or `userSecretKeyRef` are still caught.
 *
 * Ambiguity resolves toward rejection: `"token"` is token-matched even though this project
 * also uses "token" for design tokens, because an auth-credential false negative is far more
 * costly than making a publisher rename a telemetry field.
 */
const FORBIDDEN_NAME_RULES: readonly {
  keyword: string;
  category: string;
  match: "substring" | "token";
}[] = [
  { keyword: "source", category: "source_code", match: "substring" },
  { keyword: "prompt", category: "prompt", match: "substring" },
  { keyword: "brand", category: "brand_config", match: "substring" },
  { keyword: "path", category: "file_path", match: "substring" },
  { keyword: "dir", category: "file_path", match: "token" },
  { keyword: "directory", category: "file_path", match: "substring" },
  { keyword: "secret", category: "secret", match: "substring" },
  { keyword: "credential", category: "credential", match: "substring" },
  { keyword: "password", category: "credential", match: "substring" },
  { keyword: "token", category: "credential", match: "token" },
  { keyword: "apikey", category: "credential", match: "substring" },
  { keyword: "email", category: "personal_data", match: "substring" },
  { keyword: "phone", category: "personal_data", match: "substring" },
  { keyword: "address", category: "personal_data", match: "substring" },
  { keyword: "ip", category: "personal_data", match: "token" },
  { keyword: "ipaddress", category: "personal_data", match: "substring" },
  { keyword: "device", category: "personal_data", match: "substring" },
  { keyword: "username", category: "personal_data", match: "substring" },
  { keyword: "userid", category: "personal_data", match: "substring" },
  { keyword: "name", category: "personal_data", match: "token" },
  { keyword: "fingerprint", category: "personal_data", match: "substring" },
];

export interface TelemetrySchemaValidation {
  valid: boolean;
  errors: FieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
 * Splits an event or field name into lowercase alphanumeric tokens, breaking on separators
 * (`_`, `-`, `.`, spaces) and on camelCase/PascalCase boundaries, so `sourcePath` becomes
 * `["source", "path"]` and `cli_preview_completed` becomes `["cli", "preview", "completed"]`.
 *
 * Adjacent tokens are also joined pairwise (`apiKey` -> `apikey`, `userId` -> `userid`) so a
 * multi-word keyword can be matched without a separate rule per spelling.
 */
function nameTokens(name: string): Set<string> {
  const tokens = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 0);

  const all = new Set(tokens);
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    all.add(`${String(tokens[index])}${String(tokens[index + 1])}`);
  }
  return all;
}

function matchForbiddenCategory(name: string): string | undefined {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tokens = nameTokens(name);

  for (const { keyword, category, match } of FORBIDDEN_NAME_RULES) {
    if (match === "substring" ? normalized.includes(keyword) : tokens.has(keyword)) {
      return category;
    }
  }
  return undefined;
}

const FIELD_TYPES = new Set(["string", "number", "boolean"]);

function validateFieldDefinition(candidate: unknown, path: string, errors: FieldError[]): void {
  if (!isRecord(candidate)) {
    error(
      errors,
      "telemetry_field_definition_required",
      path,
      "must be a TelemetryFieldDefinition object",
      "Publish a name and type for every event field.",
    );
    return;
  }

  const name = candidate.name;
  if (!isNonEmptyString(name)) {
    error(
      errors,
      "telemetry_field_definition_required",
      `${path}.name`,
      "must be a non-empty string",
      "Publish a name for this event field.",
    );
  } else {
    const forbiddenCategory = matchForbiddenCategory(name);
    if (forbiddenCategory) {
      error(
        errors,
        "telemetry_field_forbidden",
        `${path}.name`,
        `must not reference an excluded category ("${forbiddenCategory}")`,
        "Remove this field; the Telemetry Schema must exclude source code, prompts, Brand Config values, file paths, secrets, credentials, and Personal Data.",
      );
    }
  }

  if (typeof candidate.type !== "string" || !FIELD_TYPES.has(candidate.type)) {
    error(
      errors,
      "telemetry_field_type_invalid",
      `${path}.type`,
      'must be "string", "number", or "boolean"',
      "Publish a flat primitive type for this event field.",
    );
  }

  if (!isNonEmptyString(candidate.description)) {
    error(
      errors,
      "telemetry_field_description_required",
      `${path}.description`,
      "must be a non-empty string",
      "Publish a human-readable description so the consent disclosure can explain what this field records.",
    );
  }
}

function validateEventDefinition(
  candidate: unknown,
  path: string,
  errors: FieldError[],
  seenNames: Set<string>,
): void {
  if (!isRecord(candidate)) {
    error(
      errors,
      "telemetry_event_definition_required",
      path,
      "must be a TelemetryEventDefinition object",
      "Publish a complete event definition.",
    );
    return;
  }

  const name = candidate.name;
  if (!isNonEmptyString(name)) {
    error(
      errors,
      "telemetry_event_definition_required",
      `${path}.name`,
      "must be a non-empty string",
      "Publish a name for this event.",
    );
  } else {
    if (seenNames.has(name)) {
      error(
        errors,
        "telemetry_event_name_duplicate",
        `${path}.name`,
        "must be unique within the schema",
        "Publish a distinct event name.",
      );
    }
    seenNames.add(name);

    const forbiddenCategory = matchForbiddenCategory(name);
    if (forbiddenCategory) {
      error(
        errors,
        "telemetry_field_forbidden",
        `${path}.name`,
        `must not reference an excluded category ("${forbiddenCategory}")`,
        "Rename or remove this event; the Telemetry Schema must exclude source code, prompts, Brand Config values, file paths, secrets, credentials, and Personal Data.",
      );
    }
  }

  if (!isNonEmptyString(candidate.purpose)) {
    error(
      errors,
      "telemetry_purpose_required",
      `${path}.purpose`,
      "must be a non-empty string",
      "Publish the collection purpose for this event.",
    );
  }

  if (!isNonEmptyString(candidate.recipient)) {
    error(
      errors,
      "telemetry_recipient_required",
      `${path}.recipient`,
      "must be a non-empty string",
      "Publish the recipient for this event.",
    );
  }

  const retentionDays = candidate.retentionDays;
  if (
    typeof retentionDays !== "number" ||
    !Number.isInteger(retentionDays) ||
    retentionDays < MIN_RETENTION_DAYS ||
    retentionDays > MAX_RETENTION_DAYS
  ) {
    error(
      errors,
      "telemetry_retention_out_of_bounds",
      `${path}.retentionDays`,
      `must be an integer from ${String(MIN_RETENTION_DAYS)} through ${String(MAX_RETENTION_DAYS)} inclusive`,
      "Publish a retention period of 0 through 30 calendar days.",
    );
  }

  if (!Array.isArray(candidate.fields)) {
    error(
      errors,
      "telemetry_fields_required",
      `${path}.fields`,
      "must be an array of TelemetryFieldDefinition entries",
      "Publish the allowlisted fields for this event.",
    );
  } else {
    const seenFieldNames = new Set<string>();
    candidate.fields.forEach((field, index) => {
      validateFieldDefinition(field, `${path}.fields[${String(index)}]`, errors);
      if (isRecord(field) && isNonEmptyString(field.name)) {
        if (seenFieldNames.has(field.name)) {
          error(
            errors,
            "telemetry_field_name_duplicate",
            `${path}.fields[${String(index)}].name`,
            "must be unique within the event",
            "Publish a distinct field name.",
          );
        }
        seenFieldNames.add(field.name);
      }
    });
  }
}

/**
 * Validates a candidate Telemetry Schema: every event has a unique, non-forbidden name,
 * a purpose, a recipient, a 0-30 day retention period, and an allowlist of non-forbidden,
 * flatly-typed fields.
 *
 * Accumulates every detected violation so a publisher can see every blocking condition in
 * one pass, matching the accumulation convention used by `catalog-core`'s validators.
 */
export function validateTelemetrySchema(
  candidate: unknown,
  path = "schema",
): TelemetrySchemaValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "telemetry_schema_required",
      path,
      "must be a TelemetrySchema object",
      "Publish a versioned Telemetry Schema.",
    );
    return { valid: false, errors };
  }

  if (!isNonEmptyString(candidate.schemaVersion)) {
    error(
      errors,
      "telemetry_schema_version_required",
      `${path}.schemaVersion`,
      "must be a non-empty string",
      "Publish a schema version for this Telemetry Schema.",
    );
  }

  if (!Array.isArray(candidate.surfaces) || candidate.surfaces.length === 0) {
    error(
      errors,
      "telemetry_surfaces_required",
      `${path}.surfaces`,
      `must be a non-empty array of supported surfaces (${[...TELEMETRY_SURFACES].join(", ")})`,
      "Publish every surface this Telemetry Schema governs so each one can default collection to off.",
    );
  } else {
    candidate.surfaces.forEach((surface, index) => {
      if (typeof surface !== "string" || !TELEMETRY_SURFACES.has(surface as TelemetrySurface)) {
        error(
          errors,
          "telemetry_surface_unknown",
          `${path}.surfaces[${String(index)}]`,
          `must be one of ${[...TELEMETRY_SURFACES].join(", ")}`,
          "Remove the unknown surface, or add it to the published surface list.",
        );
      }
    });
  }

  if (!Array.isArray(candidate.events)) {
    error(
      errors,
      "telemetry_events_required",
      `${path}.events`,
      "must be an array of TelemetryEventDefinition entries",
      "Publish the allowlisted Telemetry events.",
    );
  } else {
    const seenNames = new Set<string>();
    candidate.events.forEach((event, index) => {
      validateEventDefinition(event, `${path}.events[${String(index)}]`, errors, seenNames);
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Finds a schema's event definition by name, or `undefined` if it is not permitted. */
export function findEventDefinition(
  schema: TelemetrySchema,
  eventName: string,
): TelemetryEventDefinition | undefined {
  return schema.events.find((event) => event.name === eventName);
}

/** Returns the set of field names permitted for a given event definition. */
export function allowedFieldNames(event: TelemetryEventDefinition): Set<string> {
  return new Set(event.fields.map((field: TelemetryFieldDefinition) => field.name));
}
