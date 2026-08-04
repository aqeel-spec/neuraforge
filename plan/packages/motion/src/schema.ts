import type { ArtifactRef, LicenseProvenance, SemanticVersion } from "@neuraforge/schemas";

import type {
  ApplicableControl,
  MotionControl,
  MotionControlName,
  MotionCustomizationSchema,
  NonApplicableControl,
  ReducedMotionBehavior,
} from "./types.js";
import { MOTION_CONTROL_NAMES } from "./types.js";

// ---------------------------------------------------------------------------
// Framer Motion version and provenance constants
// ---------------------------------------------------------------------------

/** The exact pinned Framer Motion version this package targets. */
export const FRAMER_MOTION_VERSION = "11.15.0" as const;

/**
 * Complete license provenance record for Framer Motion, satisfying Requirements 1.4–1.6.
 * This constant must be referenced in every `MotionPresetRecord` to ensure provenance
 * traceability without duplication.
 */
export const FRAMER_MOTION_PROVENANCE: LicenseProvenance = {
  name: "framer-motion",
  version: FRAMER_MOTION_VERSION,
  source: "https://github.com/framer/motion",
  copyright: "Copyright (c) 2018 Framer B.V.",
  spdxIdentifier: "MIT",
  licenseTextPath: "licenses/framer-motion-MIT.txt",
  attribution: "Framer Motion by Framer B.V.",
  redistributionObligations: ["include-license-text", "preserve-copyright-notice"],
  reviewStatus: "approved",
};

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/** Type guard: narrows a `MotionControl` to `ApplicableControl`. */
export function isApplicableControl(control: MotionControl): control is ApplicableControl {
  return control.applicability === "applicable";
}

/** Type guard: narrows a `MotionControl` to `NonApplicableControl`. */
export function isNonApplicableControl(control: MotionControl): control is NonApplicableControl {
  return control.applicability === "not_applicable";
}

// ---------------------------------------------------------------------------
// Schema completeness validation
// ---------------------------------------------------------------------------

/**
 * Result of a schema completeness check. `valid` is true only when every
 * `MotionControlName` appears exactly once in `schema.controls` with no extras.
 */
export interface SchemaCompletenessResult {
  readonly valid: boolean;
  readonly missing: MotionControlName[];
  readonly duplicates: MotionControlName[];
}

/**
 * Validates that every required `MotionControlName` appears exactly once in the schema's
 * `controls` map. Because `controls` is typed as `Record<MotionControlName, MotionControl>`,
 * TypeScript enforces completeness at compile time; this function provides a runtime
 * equivalent for dynamic schemas (e.g., loaded from JSON) and returns structured diagnostics.
 */
export function validateSchemaCompleteness(schema: MotionCustomizationSchema): SchemaCompletenessResult {
  const missing: MotionControlName[] = [];
  const duplicates: MotionControlName[] = [];
  const seen = new Set<string>();

  for (const name of MOTION_CONTROL_NAMES) {
    if (!(name in schema.controls)) {
      missing.push(name);
    } else if (seen.has(name)) {
      duplicates.push(name);
    }
    seen.add(name);
  }

  return {
    valid: missing.length === 0 && duplicates.length === 0,
    missing,
    duplicates,
  };
}

// ---------------------------------------------------------------------------
// Control filtering utilities
// ---------------------------------------------------------------------------

/**
 * Returns the names of all controls classified as `applicable` in the given schema.
 * Useful for determining which controls accept overrides.
 */
export function getApplicableControlNames(schema: MotionCustomizationSchema): MotionControlName[] {
  const result: MotionControlName[] = [];
  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (control && isApplicableControl(control)) {
      result.push(name);
    }
  }
  return result;
}

/**
 * Returns the names of all controls classified as `not_applicable` in the given schema.
 * Useful for reporting which controls are inert for a particular artifact.
 */
export function getNonApplicableControlNames(schema: MotionCustomizationSchema): MotionControlName[] {
  const result: MotionControlName[] = [];
  for (const name of MOTION_CONTROL_NAMES) {
    const control = schema.controls[name];
    if (control && isNonApplicableControl(control)) {
      result.push(name);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Schema factory
// ---------------------------------------------------------------------------

/**
 * Creates a validated `MotionCustomizationSchema`. Throws if the controls map is
 * incomplete (missing or duplicate entries). This is the only sanctioned way to
 * construct a schema at runtime when assembling preset records.
 *
 * @throws Error if the controls map does not contain every `MotionControlName` exactly once.
 */
export function createMotionCustomizationSchema(
  artifactRef: ArtifactRef,
  schemaVersion: SemanticVersion,
  controls: Readonly<Record<MotionControlName, MotionControl>>,
  reducedMotion: ReducedMotionBehavior,
): MotionCustomizationSchema {
  const schema: MotionCustomizationSchema = {
    artifactRef,
    schemaVersion,
    controls,
    reducedMotion,
  };

  const result = validateSchemaCompleteness(schema);
  if (!result.valid) {
    const parts: string[] = [];
    if (result.missing.length > 0) {
      parts.push(`missing controls: ${result.missing.join(", ")}`);
    }
    if (result.duplicates.length > 0) {
      parts.push(`duplicate controls: ${result.duplicates.join(", ")}`);
    }
    throw new Error(`Incomplete MotionCustomizationSchema: ${parts.join("; ")}`);
  }

  return schema;
}
