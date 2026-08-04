import type { ErrorEnvelope, FieldError, JsonValue, Result } from "@neuraforge/schemas";

export const tokensBoundary = {
  id: "tokens",
  responsibility: "design-token validation and Tailwind theme generation",
  publicSource: true,
} as const;

export const TOKEN_SCHEMA_VERSION = "1.0.0";
export const SUPPORTED_TAILWIND_VERSIONS = ["3.4.17"] as const;

export type TokenCategory =
  | "color"
  | "typography"
  | "spacing"
  | "sizing"
  | "elevation"
  | "border"
  | "breakpoint"
  | "motion";

export interface TokenDefinition {
  category: TokenCategory;
  type: string;
  value?: JsonValue;
  reference?: string;
}

export interface TokenDocument {
  schemaVersion: string;
  releaseVersion: string;
  ordering: "declaration" | "lexicographic";
  tokens: Record<string, TokenDefinition>;
}

export interface FontReference {
  family: string;
  source: "distributed" | "external";
  reference: string;
}

export interface BrandConfig {
  schemaVersion: string;
  tokens: Record<string, JsonValue>;
  fonts: FontReference[];
}

export interface TokenPublicationIndex {
  schemaVersions: readonly string[];
  tokenReleaseVersions: readonly string[];
  tailwindVersions: readonly string[];
}

export const DEFAULT_TOKEN_PUBLICATIONS: TokenPublicationIndex = Object.freeze({
  schemaVersions: Object.freeze([TOKEN_SCHEMA_VERSION]),
  tokenReleaseVersions: Object.freeze(["1.0.0"]),
  tailwindVersions: SUPPORTED_TAILWIND_VERSIONS,
});

export interface TailwindThemeOutput {
  tailwindVersion: string;
  schemaVersion: string;
  tokenReleaseVersion: string;
  theme: { extend: Record<string, JsonValue> };
  cssVariables: Record<string, string>;
  tokens: {
    name: string;
    category: TokenCategory;
    type: string;
    value?: JsonValue;
    reference?: string;
  }[];
  fontReferences: FontReference[];
  fontFiles: [];
}

const categories = new Set<TokenCategory>([
  "color",
  "typography",
  "spacing",
  "sizing",
  "elevation",
  "border",
  "breakpoint",
  "motion",
]);
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const tokenNamePattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function field(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

function failure(
  code: string,
  category: "validation" | "not_found",
  message: string,
  fields: FieldError[],
  requestId: string,
  details?: Record<string, JsonValue>,
): Result<never> {
  const envelope: ErrorEnvelope = {
    error: {
      code,
      category,
      message,
      retryable: false,
      fields,
      requestId,
      ...(details ? { details } : {}),
    },
  };
  return { ok: false, error: envelope };
}

function unknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): FieldError[] {
  const allowedSet = new Set(allowed);
  return Object.keys(value)
    .filter((key) => !allowedSet.has(key))
    .map((key) =>
      field(
        "unknown_field",
        `${path}/${key}`,
        "must be a declared schema field",
        `Remove '${key}' from this closed object`,
      ),
    );
}

function referenceName(reference: string): string {
  return reference.startsWith("{") && reference.endsWith("}") ? reference.slice(1, -1) : reference;
}

function expectedValue(type: string, value: unknown): boolean {
  switch (type) {
    case "color":
    case "fontSize":
    case "lineHeight":
    case "letterSpacing":
    case "dimension":
    case "shadow":
    case "border":
    case "duration":
    case "cubicBezier":
      return typeof value === "string" || (type === "duration" && typeof value === "number");
    case "fontFamily":
      return (
        typeof value === "string" ||
        (Array.isArray(value) &&
          value.length > 0 &&
          value.every((part) => typeof part === "string"))
      );
    case "fontWeight":
    case "number":
      return typeof value === "number" || (type === "fontWeight" && typeof value === "string");
    default:
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  }
}

function validateTokenValue(type: string, value: unknown, path: string): FieldError[] {
  if (expectedValue(type, value)) return [];
  return [
    field(
      "invalid_token_value",
      path,
      `must match token type '${type}'`,
      `Provide a value compatible with '${type}'`,
    ),
  ];
}

function inspectTokenDocument(input: unknown): { errors: FieldError[]; document?: TokenDocument } {
  const errors: FieldError[] = [];
  if (!isRecord(input)) {
    return {
      errors: [
        field("invalid_document", "/", "must be an object", "Provide a Token Document object"),
      ],
    };
  }
  errors.push(
    ...unknownFields(input, ["schemaVersion", "releaseVersion", "ordering", "tokens"], ""),
  );
  if (typeof input.schemaVersion !== "string" || input.schemaVersion.length === 0) {
    errors.push(
      field(
        "invalid_schema_version",
        "/schemaVersion",
        "must be a non-empty string",
        "Use a published schema version",
      ),
    );
  }
  if (typeof input.releaseVersion !== "string" || !semverPattern.test(input.releaseVersion)) {
    errors.push(
      field(
        "invalid_release_version",
        "/releaseVersion",
        "must be an exact Semantic Version",
        "Use a version such as 1.0.0",
      ),
    );
  }
  if (input.ordering !== "declaration" && input.ordering !== "lexicographic") {
    errors.push(
      field(
        "invalid_ordering",
        "/ordering",
        "must be declaration or lexicographic",
        "Choose a declared ordering semantic",
      ),
    );
  }
  if (!isRecord(input.tokens)) {
    errors.push(
      field(
        "invalid_tokens",
        "/tokens",
        "must be an object keyed by token name",
        "Provide at least one named token",
      ),
    );
    return { errors };
  }
  const definitions = new Map<string, TokenDefinition>();
  for (const [name, rawDefinition] of Object.entries(input.tokens)) {
    const tokenPath = `/tokens/${name}`;
    if (!tokenNamePattern.test(name)) {
      errors.push(
        field(
          "invalid_token_name",
          tokenPath,
          "must be a lowercase dot- or dash-separated name",
          "Use a name such as color.brand.primary",
        ),
      );
    }
    if (!isRecord(rawDefinition)) {
      errors.push(
        field(
          "invalid_token",
          tokenPath,
          "must be a token definition object",
          "Provide category, type, and value or reference",
        ),
      );
      continue;
    }
    errors.push(
      ...unknownFields(rawDefinition, ["category", "type", "value", "reference"], tokenPath),
    );
    const category = rawDefinition.category;
    const type = rawDefinition.type;
    if (typeof category !== "string" || !categories.has(category as TokenCategory)) {
      errors.push(
        field(
          "invalid_category",
          `${tokenPath}/category`,
          "must be a supported token category",
          "Use color, typography, spacing, sizing, elevation, border, breakpoint, or motion",
        ),
      );
    }
    if (typeof type !== "string" || type.length === 0) {
      errors.push(
        field(
          "invalid_type",
          `${tokenPath}/type`,
          "must be a non-empty token type",
          "Declare the token value type",
        ),
      );
    }
    const hasValue = Object.prototype.hasOwnProperty.call(rawDefinition, "value");
    const hasReference = Object.prototype.hasOwnProperty.call(rawDefinition, "reference");
    if (hasValue === hasReference) {
      errors.push(
        field(
          "invalid_token_source",
          tokenPath,
          "must declare exactly one of value or reference",
          "Remove one source or add the missing source",
        ),
      );
    }
    if (
      hasReference &&
      (typeof rawDefinition.reference !== "string" || rawDefinition.reference.length === 0)
    ) {
      errors.push(
        field(
          "invalid_reference",
          `${tokenPath}/reference`,
          "must be a non-empty token name",
          "Reference a published token name",
        ),
      );
    }
    if (hasValue && typeof type === "string") {
      errors.push(...validateTokenValue(type, rawDefinition.value, `${tokenPath}/value`));
    }
    if (
      typeof category === "string" &&
      categories.has(category as TokenCategory) &&
      typeof type === "string" &&
      type.length > 0
    ) {
      definitions.set(name, rawDefinition as unknown as TokenDefinition);
    }
  }
  for (const [name, definition] of definitions) {
    if (definition.reference === undefined || definition.reference.length === 0) continue;
    const targetName = referenceName(definition.reference);
    const target = definitions.get(targetName);
    if (!target) {
      errors.push(
        field(
          "unresolved_reference",
          `/tokens/${name}/reference`,
          "must reference a token in this document",
          `Declare '${targetName}' or update the reference`,
        ),
      );
    } else if (target.type !== definition.type) {
      errors.push(
        field(
          "incompatible_reference_type",
          `/tokens/${name}/reference`,
          `must reference type '${definition.type}'`,
          `Reference a '${definition.type}' token instead of '${target.type}'`,
        ),
      );
    }
  }
  const state = new Map<string, "visiting" | "visited">();
  const cycleMembers = new Set<string>();
  const visit = (name: string, stack: string[]): void => {
    if (state.get(name) === "visiting") {
      for (const member of stack.slice(stack.indexOf(name))) cycleMembers.add(member);
      return;
    }
    if (state.get(name) === "visited") return;
    state.set(name, "visiting");
    const reference = definitions.get(name)?.reference;
    if (reference) {
      const target = referenceName(reference);
      if (definitions.has(target)) visit(target, [...stack, name]);
    }
    state.set(name, "visited");
  };
  for (const name of definitions.keys()) visit(name, []);
  for (const name of cycleMembers) {
    errors.push(
      field(
        "cyclic_reference",
        `/tokens/${name}/reference`,
        "token references must form an acyclic graph",
        "Replace this reference with a value or a non-cyclic reference",
      ),
    );
  }
  const document: TokenDocument = {
    schemaVersion: typeof input.schemaVersion === "string" ? input.schemaVersion : "",
    releaseVersion: typeof input.releaseVersion === "string" ? input.releaseVersion : "",
    ordering: input.ordering === "lexicographic" ? "lexicographic" : "declaration",
    tokens: Object.fromEntries(definitions),
  };
  return { errors, document };
}

export function validateTokenDocument(
  input: unknown,
  requestId = "token-validation",
): Result<TokenDocument> {
  const inspected = inspectTokenDocument(input);
  return inspected.errors.length === 0 && inspected.document
    ? { ok: true, value: inspected.document }
    : failure(
        "token_validation_failed",
        "validation",
        "Token Document validation failed",
        inspected.errors,
        requestId,
      );
}

function inspectBrandConfig(
  input: unknown,
  document?: TokenDocument,
): { errors: FieldError[]; config?: BrandConfig } {
  const errors: FieldError[] = [];
  if (!isRecord(input)) {
    return {
      errors: [
        field("invalid_brand_config", "/", "must be an object", "Provide a Brand Config object"),
      ],
    };
  }
  errors.push(...unknownFields(input, ["schemaVersion", "tokens", "fonts"], ""));
  if (typeof input.schemaVersion !== "string" || input.schemaVersion.length === 0) {
    errors.push(
      field(
        "invalid_schema_version",
        "/schemaVersion",
        "must be a non-empty string",
        "Use the Token Document schema version",
      ),
    );
  } else if (document && input.schemaVersion !== document.schemaVersion) {
    errors.push(
      field(
        "schema_version_mismatch",
        "/schemaVersion",
        `must equal '${document.schemaVersion}'`,
        "Use the same schema version as the Token Document",
      ),
    );
  }
  if (!isRecord(input.tokens)) {
    errors.push(
      field(
        "invalid_brand_tokens",
        "/tokens",
        "must be an object keyed by published token name",
        "Provide token overrides as an object",
      ),
    );
  } else if (document) {
    for (const [name, value] of Object.entries(input.tokens)) {
      const definition = document.tokens[name];
      if (!definition) {
        errors.push(
          field(
            "unpublished_token",
            `/tokens/${name}`,
            "must identify a token in the selected release",
            `Use one of: ${Object.keys(document.tokens).join(", ")}`,
          ),
        );
      } else {
        errors.push(...validateTokenValue(definition.type, value, `/tokens/${name}`));
      }
    }
  }
  if (!Array.isArray(input.fonts)) {
    errors.push(
      field(
        "invalid_fonts",
        "/fonts",
        "must be an array of font references",
        "Provide an empty array when no fonts are configured",
      ),
    );
  } else {
    input.fonts.forEach((rawFont, index) => {
      const fontPath = `/fonts/${String(index)}`;
      if (!isRecord(rawFont)) {
        errors.push(
          field(
            "invalid_font",
            fontPath,
            "must be a font reference object",
            "Provide family, source, and reference",
          ),
        );
        return;
      }
      errors.push(...unknownFields(rawFont, ["family", "source", "reference"], fontPath));
      if (typeof rawFont.family !== "string" || rawFont.family.trim().length === 0) {
        errors.push(
          field(
            "invalid_font_family",
            `${fontPath}/family`,
            "must be a non-empty string",
            "Provide the CSS font family name",
          ),
        );
      }
      if (rawFont.source !== "distributed" && rawFont.source !== "external") {
        errors.push(
          field(
            "invalid_font_source",
            `${fontPath}/source`,
            "must be distributed or external",
            "Use external for user-supplied fonts",
          ),
        );
      }
      if (typeof rawFont.reference !== "string" || rawFont.reference.trim().length === 0) {
        errors.push(
          field(
            "invalid_font_reference",
            `${fontPath}/reference`,
            "must be a non-empty reference",
            "Provide the external URL/CSS reference or distributed artifact reference",
          ),
        );
      }
    });
  }
  return errors.length === 0 ? { errors, config: input as unknown as BrandConfig } : { errors };
}

export function validateBrandConfig(
  input: unknown,
  document: TokenDocument,
  requestId = "brand-validation",
): Result<BrandConfig> {
  const inspected = inspectBrandConfig(input, document);
  return inspected.config
    ? { ok: true, value: inspected.config }
    : failure(
        "brand_config_validation_failed",
        "validation",
        "Brand Config validation failed",
        inspected.errors,
        requestId,
      );
}

interface AvailabilityInspection {
  errors: FieldError[];
  details: Record<string, JsonValue>;
}

function inspectAvailability(
  document: unknown,
  brand: unknown,
  tailwindVersion: string | undefined,
  publications: TokenPublicationIndex,
): AvailabilityInspection {
  const errors: FieldError[] = [];
  const details: Record<string, JsonValue> = {};
  const schemaVersion =
    isRecord(document) && typeof document.schemaVersion === "string"
      ? document.schemaVersion
      : undefined;
  const brandSchemaVersion =
    isRecord(brand) && typeof brand.schemaVersion === "string" ? brand.schemaVersion : undefined;
  const releaseVersion =
    isRecord(document) && typeof document.releaseVersion === "string"
      ? document.releaseVersion
      : undefined;
  const supportedSchema = (version: string | undefined): boolean =>
    version === TOKEN_SCHEMA_VERSION && publications.schemaVersions.includes(version);
  if (schemaVersion && !supportedSchema(schemaVersion)) {
    errors.push(
      field(
        "unpublished_schema_version",
        "/schemaVersion",
        "must be a published Token Schema version",
        `Use one of: ${publications.schemaVersions.join(", ")}`,
      ),
    );
    details.requestedSchemaVersion = schemaVersion;
    details.publishedSchemaVersions = [...publications.schemaVersions];
  }
  if (brandSchemaVersion && !supportedSchema(brandSchemaVersion)) {
    errors.push(
      field(
        "unpublished_schema_version",
        "/brand/schemaVersion",
        "must be a published Token Schema version",
        `Use one of: ${publications.schemaVersions.join(", ")}`,
      ),
    );
    details.requestedBrandSchemaVersion = brandSchemaVersion;
    details.publishedSchemaVersions = [...publications.schemaVersions];
  }
  if (releaseVersion && !publications.tokenReleaseVersions.includes(releaseVersion)) {
    errors.push(
      field(
        "unpublished_token_release",
        "/releaseVersion",
        "must be a published Design Token release",
        `Use one of: ${publications.tokenReleaseVersions.join(", ")}`,
      ),
    );
    details.requestedTokenReleaseVersion = releaseVersion;
    details.publishedTokenReleaseVersions = [...publications.tokenReleaseVersions];
  }
  if (
    tailwindVersion &&
    (!publications.tailwindVersions.includes(tailwindVersion) ||
      !(SUPPORTED_TAILWIND_VERSIONS as readonly string[]).includes(tailwindVersion))
  ) {
    const alternatives = publications.tailwindVersions.filter((version) =>
      (SUPPORTED_TAILWIND_VERSIONS as readonly string[]).includes(version),
    );
    errors.push(
      field(
        "unsupported_tailwind_version",
        "/tailwindVersion",
        "must be an explicitly supported Tailwind version",
        `Use one of: ${alternatives.join(", ")}`,
      ),
    );
    details.requestedTailwindVersion = tailwindVersion;
    details.supportedTailwindVersions = alternatives;
  }
  return { errors, details };
}

function orderedTokenEntries(document: TokenDocument): [string, TokenDefinition][] {
  const entries = Object.entries(document.tokens);
  return document.ordering === "lexicographic"
    ? entries.sort(([left], [right]) => left.localeCompare(right))
    : entries;
}

function serializableDefinition(definition: TokenDefinition): Record<string, JsonValue> {
  const output: Record<string, JsonValue> = {
    category: definition.category,
    type: definition.type,
  };
  if (definition.value !== undefined) output.value = definition.value;
  if (definition.reference !== undefined) output.reference = definition.reference;
  return output;
}

export function exportTokenDocument(
  input: unknown,
  publications: TokenPublicationIndex = DEFAULT_TOKEN_PUBLICATIONS,
  requestId = "token-export",
): Result<string> {
  const inspected = inspectTokenDocument(input);
  const availability = inspectAvailability(input, undefined, undefined, publications);
  const errors = [...availability.errors, ...inspected.errors];
  if (errors.length > 0 || !inspected.document) {
    return failure(
      availability.errors.length > 0 ? "unpublished_token_request" : "token_validation_failed",
      availability.errors.length > 0 ? "not_found" : "validation",
      "Token Document could not be exported",
      errors,
      requestId,
      availability.details,
    );
  }
  const tokens: Record<string, JsonValue> = {};
  for (const [name, definition] of orderedTokenEntries(inspected.document)) {
    tokens[name] = serializableDefinition(definition);
  }
  return {
    ok: true,
    value: JSON.stringify(
      {
        schemaVersion: inspected.document.schemaVersion,
        releaseVersion: inspected.document.releaseVersion,
        ordering: inspected.document.ordering,
        tokens,
      },
      undefined,
      2,
    ),
  };
}

export function importTokenDocument(
  serialized: string,
  publications: TokenPublicationIndex = DEFAULT_TOKEN_PUBLICATIONS,
  requestId = "token-import",
): Result<TokenDocument> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    return failure(
      "token_import_parse_failed",
      "validation",
      "Token Document is not valid JSON",
      [field("invalid_json", "/", "must be valid JSON", "Correct the JSON syntax and try again")],
      requestId,
    );
  }
  const inspected = inspectTokenDocument(parsed);
  const availability = inspectAvailability(parsed, undefined, undefined, publications);
  const errors = [...availability.errors, ...inspected.errors];
  if (errors.length > 0 || !inspected.document) {
    return failure(
      availability.errors.length > 0 ? "unpublished_token_request" : "token_validation_failed",
      availability.errors.length > 0 ? "not_found" : "validation",
      "Imported Token Document failed validation",
      errors,
      requestId,
      availability.details,
    );
  }
  return { ok: true, value: inspected.document };
}

function cssVariableName(name: string): string {
  return `--nf-${name.replaceAll(".", "-")}`;
}

function cssValue(value: JsonValue): string {
  // Recurses rather than calling `String(item)` on each element: `JsonValue` elements may
  // themselves be arrays or objects, and `String` would render those as "[object Object]".
  if (Array.isArray(value)) return value.map((item) => cssValue(item)).join(", ");
  return typeof value === "string" ? value : JSON.stringify(value);
}

function themeSection(definition: TokenDefinition): string {
  switch (definition.category) {
    case "color":
      return "colors";
    case "spacing":
      return "spacing";
    case "sizing":
      return "width";
    case "elevation":
      return "boxShadow";
    case "breakpoint":
      return "screens";
    case "border":
      return definition.type === "color" ? "borderColor" : "borderWidth";
    case "motion":
      return definition.type === "cubicBezier" ? "transitionTimingFunction" : "transitionDuration";
    case "typography":
      switch (definition.type) {
        case "fontFamily":
          return "fontFamily";
        case "fontWeight":
          return "fontWeight";
        case "lineHeight":
          return "lineHeight";
        case "letterSpacing":
          return "letterSpacing";
        default:
          return "fontSize";
      }
  }
}

function themeKey(name: string, category: TokenCategory): string {
  const parts = name.split(".");
  if (parts[0] === category) parts.shift();
  return parts.join("-") || name.replaceAll(".", "-");
}

export function generateTailwindTheme(
  documentInput: unknown,
  brandInput: unknown,
  tailwindVersion: string,
  publications: TokenPublicationIndex = DEFAULT_TOKEN_PUBLICATIONS,
  requestId = "theme-generation",
): Result<TailwindThemeOutput> {
  const documentInspection = inspectTokenDocument(documentInput);
  const brandInspection = inspectBrandConfig(brandInput, documentInspection.document);
  const availability = inspectAvailability(
    documentInput,
    brandInput,
    tailwindVersion,
    publications,
  );
  const errors = [...availability.errors, ...documentInspection.errors, ...brandInspection.errors];
  if (errors.length > 0 || !documentInspection.document || !brandInspection.config) {
    return failure(
      availability.errors.length > 0 ? "unpublished_token_request" : "theme_validation_failed",
      availability.errors.length > 0 ? "not_found" : "validation",
      "Tailwind theme generation failed before output was emitted",
      errors,
      requestId,
      availability.details,
    );
  }

  const document = documentInspection.document;
  const brand = brandInspection.config;
  const extend: Record<string, JsonValue> = {};
  const cssVariables: Record<string, string> = {};
  const tokenMetadata: TailwindThemeOutput["tokens"] = [];

  for (const [name, definition] of orderedTokenEntries(document)) {
    const override = brand.tokens[name];
    const hasOverride = Object.prototype.hasOwnProperty.call(brand.tokens, name);
    if (hasOverride && override !== undefined) {
      cssVariables[cssVariableName(name)] = cssValue(override);
    } else if (definition.reference !== undefined) {
      cssVariables[cssVariableName(name)] =
        `var(${cssVariableName(referenceName(definition.reference))})`;
    } else if (definition.value !== undefined) {
      cssVariables[cssVariableName(name)] = cssValue(definition.value);
    }
    const section = themeSection(definition);
    const sectionValue = isRecord(extend[section]) ? extend[section] : {};
    sectionValue[themeKey(name, definition.category)] = `var(${cssVariableName(name)})`;
    extend[section] = sectionValue as JsonValue;
    tokenMetadata.push({
      name,
      category: definition.category,
      type: definition.type,
      ...(hasOverride && override !== undefined
        ? { value: override }
        : definition.value !== undefined
          ? { value: definition.value }
          : {}),
      ...(definition.reference !== undefined ? { reference: definition.reference } : {}),
    });
  }

  for (const font of brand.fonts) {
    const sectionValue = isRecord(extend.fontFamily) ? extend.fontFamily : {};
    sectionValue[
      font.family
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "")
    ] = [font.family];
    extend.fontFamily = sectionValue as JsonValue;
  }

  return {
    ok: true,
    value: {
      tailwindVersion,
      schemaVersion: document.schemaVersion,
      tokenReleaseVersion: document.releaseVersion,
      theme: { extend },
      cssVariables,
      tokens: tokenMetadata,
      fontReferences: brand.fonts.map((font) => ({ ...font })),
      fontFiles: [],
    },
  };
}
