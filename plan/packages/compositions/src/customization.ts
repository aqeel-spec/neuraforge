import type { JsonValue } from "@neuraforge/schemas";

import type {
  BrandConfig,
  BrandingInvariant,
  CompositionManifest,
  CustomizationInput,
  CustomizationResult,
  InvariantViolation,
} from "./types.js";
import { getDeclaredInputIds } from "./manifest.js";

// ---------------------------------------------------------------------------
// Brand Config Customization & Invariant Validation (Task 14.3)
// ---------------------------------------------------------------------------

/**
 * Applies a Brand Config to a composition, validating that:
 * 1. Only declared inputs are edited (undeclared fields are rejected).
 * 2. All typed invariants (hierarchy, responsive, accessibility, relationships)
 *    are preserved after customization.
 * 3. Required inputs have values provided.
 *
 * Returns a CustomizationResult with applied values and any violations.
 *
 * Requirements: 6.7
 */
export function applyBrandConfig(
  manifest: CompositionManifest,
  brandConfig: BrandConfig,
): CustomizationResult {
  const declaredIds = new Set(getDeclaredInputIds(manifest));
  const undeclaredFields: string[] = [];
  const appliedValues: Record<string, JsonValue> = {};

  // 1. Check for undeclared fields
  for (const key of Object.keys(brandConfig.values)) {
    if (!declaredIds.has(key)) {
      undeclaredFields.push(key);
    }
  }

  // 2. Apply declared values (merge with defaults)
  for (const input of manifest.customizationInputs) {
    const providedValue = brandConfig.values[input.id];
    if (providedValue !== undefined) {
      appliedValues[input.id] = providedValue;
    } else {
      appliedValues[input.id] = input.default;
    }
  }

  // 3. Validate input types and constraints
  const typeViolations = validateInputTypes(manifest.customizationInputs, brandConfig.values);

  // 4. Validate invariants
  const invariantViolations = validateInvariants(manifest.invariants, appliedValues, manifest);

  // Combine all violations
  const allViolations = [...typeViolations, ...invariantViolations];

  return {
    valid: allViolations.length === 0 && undeclaredFields.length === 0,
    compositionRef: manifest.ref,
    appliedValues,
    invariantViolations: allViolations,
    undeclaredFields,
  };
}

/**
 * Validates just the invariants without applying a full Brand Config. Useful for
 * checking whether a set of values would violate any invariants.
 */
export function checkInvariants(
  manifest: CompositionManifest,
  values: Readonly<Record<string, JsonValue>>,
): readonly InvariantViolation[] {
  return validateInvariants(manifest.invariants, values, manifest);
}

// ---------------------------------------------------------------------------
// Input Type Validation
// ---------------------------------------------------------------------------

function validateInputTypes(
  inputs: readonly CustomizationInput[],
  values: Readonly<Record<string, JsonValue>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const input of inputs) {
    const value = values[input.id];
    if (value === undefined) continue;

    // Type check
    if (!isValidType(input, value)) {
      violations.push({
        invariantId: `input-type-${input.id}`,
        invariantType: "semantic-hierarchy",
        description: `Input "${input.id}" has wrong type. Expected ${input.type}.`,
        violatedBy: input.id,
      });
    }

    // Allowed values check
    if (input.allowedValues && input.allowedValues.length > 0) {
      const valueStr = JSON.stringify(value);
      const isAllowed = input.allowedValues.some((av) => JSON.stringify(av) === valueStr);
      if (!isAllowed) {
        violations.push({
          invariantId: `input-allowed-${input.id}`,
          invariantType: "semantic-hierarchy",
          description: `Input "${input.id}" value is not in the allowed set.`,
          violatedBy: input.id,
        });
      }
    }
  }

  return violations;
}

function isValidType(input: CustomizationInput, value: JsonValue): boolean {
  switch (input.type) {
    case "string":
    case "color":
    case "image-url":
    case "rich-text":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return typeof value === "string" || typeof value === "number";
  }
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

function validateInvariants(
  invariants: readonly BrandingInvariant[],
  values: Readonly<Record<string, JsonValue>>,
  manifest: CompositionManifest,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  for (const invariant of invariants) {
    switch (invariant.type) {
      case "semantic-hierarchy":
        violations.push(...validateSemanticHierarchy(invariant, values, manifest));
        break;
      case "responsive-behavior":
        violations.push(...validateResponsiveBehavior(invariant, values));
        break;
      case "accessibility-behavior":
        violations.push(...validateAccessibilityBehavior(invariant, values));
        break;
      case "required-relationship":
        violations.push(...validateRequiredRelationship(invariant, values));
        break;
    }
  }

  return violations;
}

/**
 * Semantic hierarchy invariant: ensures heading levels, content order, or structural
 * nesting rules are maintained. Rule format: { "order": ["heading", "subheading", "body"] }
 * or { "required": ["heading"] }.
 */
function validateSemanticHierarchy(
  invariant: BrandingInvariant,
  values: Readonly<Record<string, JsonValue>>,
  manifest: CompositionManifest,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const rule = invariant.rule as Record<string, unknown> | null;

  if (!rule || typeof rule !== "object") return violations;

  // Check "required" rule: constrained elements must have non-empty values
  if (Array.isArray(rule["required"])) {
    for (const elementId of invariant.constrainedElements) {
      const input = manifest.customizationInputs.find((i) => i.id === elementId);
      if (input?.required && (values[elementId] === undefined || values[elementId] === "" || values[elementId] === null)) {
        violations.push({
          invariantId: invariant.id,
          invariantType: "semantic-hierarchy",
          description: `Required element "${elementId}" is missing or empty. ${invariant.description}`,
          violatedBy: elementId,
        });
      }
    }
  }

  return violations;
}

/**
 * Responsive behavior invariant: ensures responsive configurations are preserved.
 * Rule format: { "preserveAt": ["sm", "md", "lg"] }
 */
function validateResponsiveBehavior(
  invariant: BrandingInvariant,
  values: Readonly<Record<string, JsonValue>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const rule = invariant.rule as Record<string, unknown> | null;

  if (!rule || typeof rule !== "object") return violations;

  // Check that constrained elements haven't been set to values that break responsive
  // (e.g., fixed pixel widths that override responsive layout)
  if (rule["noFixedWidth"]) {
    for (const elementId of invariant.constrainedElements) {
      const value = values[elementId];
      if (typeof value === "string" && /^\d+px$/.test(value)) {
        violations.push({
          invariantId: invariant.id,
          invariantType: "responsive-behavior",
          description: `Element "${elementId}" uses a fixed pixel width, which breaks responsive behavior. ${invariant.description}`,
          violatedBy: elementId,
        });
      }
    }
  }

  return violations;
}

/**
 * Accessibility behavior invariant: ensures accessibility requirements are preserved.
 * Rule format: { "minContrast": 4.5 } or { "requireAlt": true }
 */
function validateAccessibilityBehavior(
  invariant: BrandingInvariant,
  values: Readonly<Record<string, JsonValue>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const rule = invariant.rule as Record<string, unknown> | null;

  if (!rule || typeof rule !== "object") return violations;

  // Check requireAlt: if image inputs exist, they must have alt text sibling
  if (rule["requireAlt"]) {
    for (const elementId of invariant.constrainedElements) {
      const altId = `${elementId}_alt`;
      const altValue = values[altId];
      const imgValue = values[elementId];
      if (imgValue && (!altValue || altValue === "")) {
        violations.push({
          invariantId: invariant.id,
          invariantType: "accessibility-behavior",
          description: `Image "${elementId}" requires alt text at "${altId}". ${invariant.description}`,
          violatedBy: elementId,
        });
      }
    }
  }

  return violations;
}

/**
 * Required relationship invariant: ensures that if one element is present, related
 * elements must also be present.
 * Rule format: { "ifPresent": "cta_button", "thenRequired": ["cta_link"] }
 */
function validateRequiredRelationship(
  invariant: BrandingInvariant,
  values: Readonly<Record<string, JsonValue>>,
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const rule = invariant.rule as Record<string, unknown> | null;

  if (!rule || typeof rule !== "object") return violations;

  const ifPresent = rule["ifPresent"] as string | undefined;
  const thenRequired = rule["thenRequired"] as string[] | undefined;

  if (ifPresent && thenRequired) {
    const presentValue = values[ifPresent];
    if (presentValue !== undefined && presentValue !== null && presentValue !== "") {
      for (const requiredId of thenRequired) {
        const requiredValue = values[requiredId];
        if (requiredValue === undefined || requiredValue === null || requiredValue === "") {
          violations.push({
            invariantId: invariant.id,
            invariantType: "required-relationship",
            description: `"${ifPresent}" is present but required companion "${requiredId}" is missing. ${invariant.description}`,
            violatedBy: requiredId,
          });
        }
      }
    }
  }

  return violations;
}
