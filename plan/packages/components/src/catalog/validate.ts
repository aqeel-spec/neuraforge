import type { FieldError } from "@neuraforge/schemas";
import { BEHAVIOR_KEYS } from "../contracts/types.js";
import type {
  BehaviorKey,
  BrowserCapabilityId,
  ComponentCategory,
  ComponentRecord,
  PropType,
} from "../contracts/types.js";

/**
 * Validates an untrusted value as a ComponentRecord.
 *
 * Accumulates ALL independent field errors rather than short-circuiting on the first.
 * Returns {valid, errors} and never throws, even on deeply malformed input.
 *
 * Validates: Requirements 3.2-3.7, 12.3, 12.6.
 */

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

const ALLOWED_CATEGORIES: readonly ComponentCategory[] = [
  "navigation",
  "layout",
  "forms",
  "feedback",
  "data-display",
  "marketing",
];

const ALLOWED_PROP_TYPES: readonly PropType[] = [
  "string",
  "number",
  "boolean",
  "enum",
  "node",
  "function",
  "array",
  "object",
];

const ALLOWED_CAPABILITY_IDS: readonly BrowserCapabilityId[] = [
  "container-queries",
  "backdrop-filter",
  "view-transitions",
  "popover",
  "dialog-element",
  "prefers-reduced-motion",
  "intersection-observer",
  "resize-observer",
  "webgl",
  "webgpu",
];

const ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "ref",
  "status",
  "category",
  "sourceFiles",
  "generatedFiles",
  "dependencies",
  "peerDependencies",
  "compatibility",
  "installation",
  "checksum",
  "provenance",
  "documentationPath",
  "blockers",
  "props",
  "supportedStates",
  "behavior",
  "accessibilityPrimitive",
  "capability",
  "reducedMotion",
  "examples",
  "performanceBudgets",
  "performanceRecords",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Safe field access on unknown objects. */
function field(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

function addError(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

function validateRef(obj: Record<string, unknown>, errors: FieldError[]): void {
  const ref = field(obj, "ref");
  if (!isObject(ref)) {
    addError(
      errors,
      "INVALID_REF",
      "ref",
      "must be object with kind, stableId, version",
      "Provide {kind:'component', stableId:string, version:string}",
    );
    return;
  }
  if (field(ref, "kind") !== "component") {
    addError(
      errors,
      "INVALID_REF_KIND",
      "ref.kind",
      "must be 'component'",
      "Set ref.kind to 'component'",
    );
  }
  const stableId = field(ref, "stableId");
  if (typeof stableId !== "string" || stableId === "") {
    addError(
      errors,
      "INVALID_REF_STABLE_ID",
      "ref.stableId",
      "must be non-empty string",
      "Provide a stable identifier slug",
    );
  }
  const version = field(ref, "version");
  if (typeof version !== "string" || version === "") {
    addError(
      errors,
      "INVALID_REF_VERSION",
      "ref.version",
      "must be non-empty semver string",
      "Provide exact version e.g. '1.0.0'",
    );
  }
}

function validateStatus(obj: Record<string, unknown>, errors: FieldError[]): void {
  const status = field(obj, "status");
  if (status !== "experimental" && status !== "stable") {
    addError(
      errors,
      "INVALID_STATUS",
      "status",
      "must be 'experimental' | 'stable'",
      "Set status to 'experimental' or 'stable'",
    );
  }
}

function validateCategory(obj: Record<string, unknown>, errors: FieldError[]): void {
  if (!ALLOWED_CATEGORIES.includes(field(obj, "category") as ComponentCategory)) {
    addError(
      errors,
      "INVALID_CATEGORY",
      "category",
      `must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
      "Set category to a valid ComponentCategory value",
    );
  }
}

function validateFileRecords(value: unknown, path: string, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_FILE_RECORDS",
      path,
      "must be an array of FileRecord",
      `Provide an array at ${path}`,
    );
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const f = value[i] as unknown;
    if (!isObject(f)) {
      addError(
        errors,
        "INVALID_FILE_RECORD",
        `${path}[${String(i)}]`,
        "must be an object",
        "Provide a valid FileRecord",
      );
      continue;
    }
    const fPath = field(f, "path");
    if (typeof fPath !== "string" || fPath === "") {
      addError(
        errors,
        "INVALID_FILE_PATH",
        `${path}[${String(i)}].path`,
        "must be non-empty string",
        "Provide the file path",
      );
    }
    const origin = field(f, "origin");
    if (origin !== "original" && origin !== "generated") {
      addError(
        errors,
        "INVALID_FILE_ORIGIN",
        `${path}[${String(i)}].origin`,
        "must be 'original' | 'generated'",
        "Set origin to 'original' or 'generated'",
      );
    }
    const mediaType = field(f, "mediaType");
    if (typeof mediaType !== "string" || mediaType === "") {
      addError(
        errors,
        "INVALID_FILE_MEDIA_TYPE",
        `${path}[${String(i)}].mediaType`,
        "must be non-empty string",
        "Provide a MIME type",
      );
    }
    const size = field(f, "size");
    if (typeof size !== "number" || size < 0) {
      addError(
        errors,
        "INVALID_FILE_SIZE",
        `${path}[${String(i)}].size`,
        "must be non-negative number",
        "Provide size in bytes",
      );
    }
    validateChecksumField(field(f, "checksum"), `${path}[${String(i)}].checksum`, errors);
  }
}

function validateChecksumField(value: unknown, path: string, errors: FieldError[]): void {
  if (!isObject(value)) {
    addError(
      errors,
      "INVALID_CHECKSUM",
      path,
      "must be {algorithm:'sha256', canonicalization:string, digest:string}",
      "Provide a valid Checksum object",
    );
    return;
  }
  if (field(value, "algorithm") !== "sha256") {
    addError(
      errors,
      "INVALID_CHECKSUM_ALGORITHM",
      `${path}.algorithm`,
      "must be 'sha256'",
      "Set algorithm to 'sha256'",
    );
  }
  const canon = field(value, "canonicalization");
  if (typeof canon !== "string" || canon === "") {
    addError(
      errors,
      "INVALID_CHECKSUM_CANONICALIZATION",
      `${path}.canonicalization`,
      "must be non-empty string",
      "Provide canonicalization version",
    );
  }
  const digest = field(value, "digest");
  if (typeof digest !== "string" || !/^[0-9a-f]{64}$/u.test(digest)) {
    addError(
      errors,
      "INVALID_CHECKSUM_DIGEST",
      `${path}.digest`,
      "must be 64-char lowercase hex string",
      "Provide a valid SHA-256 hex digest",
    );
  }
}

function validateDependencies(value: unknown, path: string, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_DEPENDENCIES",
      path,
      "must be an array",
      `Provide an array at ${path}`,
    );
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const dep = value[i] as unknown;
    if (!isObject(dep)) {
      addError(
        errors,
        "INVALID_DEPENDENCY",
        `${path}[${String(i)}]`,
        "must be {name, version, source}",
        "Provide a valid DependencyRef",
      );
      continue;
    }
    const depName = field(dep, "name");
    if (typeof depName !== "string" || depName === "") {
      addError(
        errors,
        "INVALID_DEPENDENCY_NAME",
        `${path}[${String(i)}].name`,
        "must be non-empty string",
        "Provide dependency name",
      );
    }
    const depVersion = field(dep, "version");
    if (typeof depVersion !== "string" || depVersion === "") {
      addError(
        errors,
        "INVALID_DEPENDENCY_VERSION",
        `${path}[${String(i)}].version`,
        "must be non-empty semver string",
        "Provide exact version",
      );
    }
    const depSource = field(dep, "source");
    if (typeof depSource !== "string" || depSource === "") {
      addError(
        errors,
        "INVALID_DEPENDENCY_SOURCE",
        `${path}[${String(i)}].source`,
        "must be non-empty string",
        "Provide source URL/registry",
      );
    }
  }
}

function validateCompatibility(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_COMPATIBILITY",
      "compatibility",
      "must be an array",
      "Provide an array of CompatibilityConstraint",
    );
  }
}

function validateInstallation(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_INSTALLATION",
      "installation",
      "must be an array",
      "Provide ordered InstallInstruction array",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_INSTALLATION",
      "installation",
      "must have at least one instruction",
      "Provide at least one install instruction",
    );
  }
}

function validateProvenance(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_PROVENANCE",
      "provenance",
      "must be an array",
      "Provide an array of LicenseProvenance",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_PROVENANCE",
      "provenance",
      "must have at least one provenance entry",
      "Provide at least one LicenseProvenance (e.g. MIT for original source)",
    );
  }
}

function validateDocumentationPath(value: unknown, errors: FieldError[]): void {
  if (typeof value !== "string" || value === "") {
    addError(
      errors,
      "INVALID_DOCUMENTATION_PATH",
      "documentationPath",
      "must be non-empty string",
      "Provide path to documentation",
    );
  }
}

function validateProps(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_PROPS",
      "props",
      "must be an array of PropDefinition",
      "Provide an array of prop definitions",
    );
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const prop = value[i] as unknown;
    if (!isObject(prop)) {
      addError(
        errors,
        "INVALID_PROP",
        `props[${String(i)}]`,
        "must be an object",
        "Provide a valid PropDefinition",
      );
      continue;
    }
    const propName = field(prop, "name");
    if (typeof propName !== "string" || propName === "") {
      addError(
        errors,
        "INVALID_PROP_NAME",
        `props[${String(i)}].name`,
        "must be non-empty string",
        "Provide prop name",
      );
    }
    const propType = field(prop, "type");
    if (!ALLOWED_PROP_TYPES.includes(propType as PropType)) {
      addError(
        errors,
        "INVALID_PROP_TYPE",
        `props[${String(i)}].type`,
        `must be one of: ${ALLOWED_PROP_TYPES.join(", ")}`,
        "Set type to a valid PropType",
      );
    }
    const propRequired = field(prop, "required");
    if (typeof propRequired !== "boolean") {
      addError(
        errors,
        "INVALID_PROP_REQUIRED",
        `props[${String(i)}].required`,
        "must be boolean",
        "Set required to true or false",
      );
    }
    const propDescription = field(prop, "description");
    if (typeof propDescription !== "string" || propDescription === "") {
      addError(
        errors,
        "INVALID_PROP_DESCRIPTION",
        `props[${String(i)}].description`,
        "must be non-empty string",
        "Provide a prop description",
      );
    }
    if (propType === "enum") {
      const allowedValues = field(prop, "allowedValues");
      if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
        addError(
          errors,
          "INVALID_PROP_ENUM_VALUES",
          `props[${String(i)}].allowedValues`,
          "enum props must have non-empty allowedValues array",
          "Provide the list of allowed enum values",
        );
      }
    }
  }
}

function validateStates(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_STATES",
      "supportedStates",
      "must be an array",
      "Provide an array of ComponentState",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_STATES",
      "supportedStates",
      "must have at least one state",
      "Provide at least one supported state",
    );
  }
}

function validateBehavior(value: unknown, errors: FieldError[]): void {
  if (!isObject(value)) {
    addError(
      errors,
      "INVALID_BEHAVIOR",
      "behavior",
      "must be object with all 7 BehaviorKey entries",
      "Provide a complete BehaviorMap",
    );
    return;
  }
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!BEHAVIOR_KEYS.includes(key as BehaviorKey)) {
      addError(
        errors,
        "UNKNOWN_BEHAVIOR_KEY",
        `behavior.${key}`,
        "unknown behavior key",
        `Remove unknown key '${key}'; allowed: ${BEHAVIOR_KEYS.join(", ")}`,
      );
    }
  }
  for (const key of BEHAVIOR_KEYS) {
    const entry = field(value, key);
    if (!isObject(entry)) {
      addError(
        errors,
        "MISSING_BEHAVIOR_KEY",
        `behavior.${key}`,
        "required behavior key missing or not an object",
        `Add behavior.${key} with {status:'supported',contract:string} or {status:'not_applicable',reason:string}`,
      );
      continue;
    }
    const entryStatus = field(entry, "status");
    if (entryStatus === "supported") {
      const contract = field(entry, "contract");
      if (typeof contract !== "string" || contract === "") {
        addError(
          errors,
          "INVALID_BEHAVIOR_CONTRACT",
          `behavior.${key}.contract`,
          "supported behavior must have non-empty contract",
          "Provide a contract description",
        );
      }
    } else if (entryStatus === "not_applicable") {
      const reason = field(entry, "reason");
      if (typeof reason !== "string" || reason === "") {
        addError(
          errors,
          "INVALID_BEHAVIOR_REASON",
          `behavior.${key}.reason`,
          "not_applicable behavior must have non-empty reason",
          "Provide a reason why this behavior is not applicable",
        );
      }
    } else {
      addError(
        errors,
        "INVALID_BEHAVIOR_STATUS",
        `behavior.${key}.status`,
        "must be 'supported' | 'not_applicable'",
        "Set status to 'supported' or 'not_applicable'",
      );
    }
  }
}

function validateAccessibilityPrimitive(value: unknown, errors: FieldError[]): void {
  if (!isObject(value)) {
    addError(
      errors,
      "INVALID_ACCESSIBILITY_PRIMITIVE",
      "accessibilityPrimitive",
      "must be an object",
      "Provide {usesExternalPrimitive: true, ...} or {usesExternalPrimitive: false}",
    );
    return;
  }
  const usesPrimitive = field(value, "usesExternalPrimitive");
  if (usesPrimitive === true) {
    const pName = field(value, "primitiveName");
    if (typeof pName !== "string" || pName === "") {
      addError(
        errors,
        "INVALID_PRIMITIVE_NAME",
        "accessibilityPrimitive.primitiveName",
        "must be non-empty string",
        "Provide the primitive package name",
      );
    }
    const pVersion = field(value, "primitiveVersion");
    if (typeof pVersion !== "string" || pVersion === "") {
      addError(
        errors,
        "INVALID_PRIMITIVE_VERSION",
        "accessibilityPrimitive.primitiveVersion",
        "must be non-empty string",
        "Provide the primitive version",
      );
    }
    if (!isObject(field(value, "provenance"))) {
      addError(
        errors,
        "INVALID_PRIMITIVE_PROVENANCE",
        "accessibilityPrimitive.provenance",
        "must be a LicenseProvenance object",
        "Provide provenance for the external primitive",
      );
    }
  } else if (usesPrimitive !== false) {
    addError(
      errors,
      "INVALID_PRIMITIVE_CHOICE",
      "accessibilityPrimitive.usesExternalPrimitive",
      "must be true or false",
      "Set usesExternalPrimitive to true or false",
    );
  }
}

function validateCapability(value: unknown, errors: FieldError[]): void {
  if (!isObject(value)) {
    addError(
      errors,
      "INVALID_CAPABILITY",
      "capability",
      "must be an object",
      "Provide {requiresOptionalCapability: true, ...} or {requiresOptionalCapability: false}",
    );
    return;
  }
  const requires = field(value, "requiresOptionalCapability");
  if (requires === true) {
    const capId = field(value, "capability");
    if (!ALLOWED_CAPABILITY_IDS.includes(capId as BrowserCapabilityId)) {
      addError(
        errors,
        "INVALID_CAPABILITY_ID",
        "capability.capability",
        `must be one of: ${ALLOWED_CAPABILITY_IDS.join(", ")}`,
        "Set to a valid BrowserCapabilityId",
      );
    }
    const detection = field(value, "detection");
    if (typeof detection !== "function") {
      addError(
        errors,
        "INVALID_CAPABILITY_DETECTION",
        "capability.detection",
        "must be a function",
        "Provide a CapabilityDetector function",
      );
    }
    const fb = field(value, "fallback");
    if (!isObject(fb)) {
      addError(
        errors,
        "INVALID_CAPABILITY_FALLBACK",
        "capability.fallback",
        "must be a FunctionalFallback object",
        "Provide {description, preservesContent:true, preservesPrimaryActions:true}",
      );
    } else {
      const fbDesc = field(fb, "description");
      if (typeof fbDesc !== "string" || fbDesc === "") {
        addError(
          errors,
          "INVALID_FALLBACK_DESCRIPTION",
          "capability.fallback.description",
          "must be non-empty string",
          "Describe the fallback behavior",
        );
      }
      if (field(fb, "preservesContent") !== true) {
        addError(
          errors,
          "INVALID_FALLBACK_CONTENT",
          "capability.fallback.preservesContent",
          "must be true",
          "Fallback must preserve content",
        );
      }
      if (field(fb, "preservesPrimaryActions") !== true) {
        addError(
          errors,
          "INVALID_FALLBACK_ACTIONS",
          "capability.fallback.preservesPrimaryActions",
          "must be true",
          "Fallback must preserve primary actions",
        );
      }
    }
  } else if (requires !== false) {
    addError(
      errors,
      "INVALID_CAPABILITY_CHOICE",
      "capability.requiresOptionalCapability",
      "must be true or false",
      "Set requiresOptionalCapability to true or false",
    );
  }
}

function validateReducedMotion(value: unknown, errors: FieldError[]): void {
  if (!isObject(value)) {
    addError(
      errors,
      "INVALID_REDUCED_MOTION",
      "reducedMotion",
      "must be an object",
      "Provide {includesAnimationOrMotion: true/false, ...}",
    );
    return;
  }
  const includes = field(value, "includesAnimationOrMotion");
  if (includes === true) {
    const behavior = field(value, "reducedMotionBehavior");
    if (typeof behavior !== "string" || behavior === "") {
      addError(
        errors,
        "INVALID_REDUCED_MOTION_BEHAVIOR",
        "reducedMotion.reducedMotionBehavior",
        "must be non-empty string",
        "Describe the reduced motion behavior",
      );
    }
  } else if (includes !== false) {
    addError(
      errors,
      "INVALID_REDUCED_MOTION_CHOICE",
      "reducedMotion.includesAnimationOrMotion",
      "must be true or false",
      "Set includesAnimationOrMotion to true or false",
    );
  }
}

function validateExamples(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_EXAMPLES",
      "examples",
      "must be an array",
      "Provide an array of ComponentExample",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_EXAMPLES",
      "examples",
      "must have at least one example",
      "Provide at least one usage example",
    );
  }
}

function validatePerformanceBudgets(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_PERFORMANCE_BUDGETS",
      "performanceBudgets",
      "must be an array",
      "Provide an array of PerformanceBudget",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_PERFORMANCE_BUDGETS",
      "performanceBudgets",
      "must have at least one budget",
      "Provide at least one performance budget",
    );
  }
}

function validatePerformanceRecords(value: unknown, errors: FieldError[]): void {
  if (!Array.isArray(value)) {
    addError(
      errors,
      "INVALID_PERFORMANCE_RECORDS",
      "performanceRecords",
      "must be an array",
      "Provide an array of PerformanceRecord",
    );
    return;
  }
  if (value.length === 0) {
    addError(
      errors,
      "EMPTY_PERFORMANCE_RECORDS",
      "performanceRecords",
      "must have at least one record",
      "Provide at least one performance record",
    );
  }
}

export function validateComponentRecord(candidate: unknown): ValidationResult {
  const errors: FieldError[] = [];

  if (!isObject(candidate)) {
    addError(
      errors,
      "NOT_OBJECT",
      "/",
      "candidate must be a plain object",
      "Provide a ComponentRecord object",
    );
    return { valid: false, errors };
  }

  // Check for unknown top-level fields
  for (const key of Object.keys(candidate)) {
    if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
      addError(
        errors,
        "UNKNOWN_FIELD",
        key,
        "unknown top-level field",
        `Remove unknown field '${key}'`,
      );
    }
  }

  validateRef(candidate, errors);
  validateStatus(candidate, errors);
  validateCategory(candidate, errors);
  validateFileRecords(field(candidate, "sourceFiles"), "sourceFiles", errors);
  validateFileRecords(field(candidate, "generatedFiles"), "generatedFiles", errors);
  validateDependencies(field(candidate, "dependencies"), "dependencies", errors);
  validateDependencies(field(candidate, "peerDependencies"), "peerDependencies", errors);
  validateCompatibility(field(candidate, "compatibility"), errors);
  validateInstallation(field(candidate, "installation"), errors);
  validateChecksumField(field(candidate, "checksum"), "checksum", errors);
  validateProvenance(field(candidate, "provenance"), errors);
  validateDocumentationPath(field(candidate, "documentationPath"), errors);
  validateProps(field(candidate, "props"), errors);
  validateStates(field(candidate, "supportedStates"), errors);
  validateBehavior(field(candidate, "behavior"), errors);
  validateAccessibilityPrimitive(field(candidate, "accessibilityPrimitive"), errors);
  validateCapability(field(candidate, "capability"), errors);
  validateReducedMotion(field(candidate, "reducedMotion"), errors);
  validateExamples(field(candidate, "examples"), errors);
  validatePerformanceBudgets(field(candidate, "performanceBudgets"), errors);
  validatePerformanceRecords(field(candidate, "performanceRecords"), errors);

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an array of component records and returns aggregate results.
 */
export function validateComponentCatalog(records: readonly ComponentRecord[]): ValidationResult {
  const errors: FieldError[] = [];
  for (const record of records) {
    const result = validateComponentRecord(record);
    errors.push(...result.errors);
  }
  return { valid: errors.length === 0, errors };
}
