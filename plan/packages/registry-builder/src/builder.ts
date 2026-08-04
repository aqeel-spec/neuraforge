/**
 * Release bundle builder — the core deterministic build function.
 *
 * buildReleaseBundle(input) validates input, constructs the snapshot and manifest,
 * computes all checksums/addresses, deep-freezes, and returns success or accumulated errors.
 */

import type { ArtifactReleaseEntry, FieldError, ReleaseManifest } from "@neuraforge-ui/schemas";
import {
  canonicalizeJsonBytes,
  canonicalizeTextBytes,
  computeFileSetChecksum,
  computeSha256Digest,
} from "@neuraforge-ui/catalog-core";
import type { TokenPublicationIndex } from "@neuraforge-ui/tokens";
import { TOKEN_SCHEMA_VERSION, SUPPORTED_TAILWIND_VERSIONS } from "@neuraforge-ui/tokens";
import type {
  BuildValidationResult,
  QualityClassificationResult,
  RegistryArtifactEntry,
  RegistrySnapshot,
  RegistryTokenArtifact,
  ReleaseBuildInput,
  ReleaseBundle,
  SourceFileWithContent,
} from "./types.js";
import { validateBuildInput } from "./validation.js";
import { classifyReleaseQuality } from "./quality.js";
import {
  computeBundleAddress,
  computeBundleChecksum,
  computeSnapshotChecksum,
} from "./content-address.js";
import { validateMvpInventory } from "./inventory.js";
import { toJsonValue } from "./json.js";
import { deepClone, deepFreeze } from "./freeze.js";

const RELEASE_INPUT_FIELDS = new Set([
  "schemaVersion",
  "registryVersion",
  "releaseVersion",
  "createdAt",
  "selectionRuleVersions",
  "supportedTailwindVersions",
  "components",
  "sourceContents",
  "tokenDocument",
  "tokenChecksum",
  "buildInstructions",
  "productionInventory",
  "compatibilityMatrix",
  "requiredSurfaces",
  "qualityResults",
  "performanceRecords",
  "exceptions",
  "approval",
  "publishedAt",
  "licenseTextPath",
  "copyrightNotices",
  "thirdPartyNoticesPath",
]);

const ARRAY_INPUT_FIELDS = [
  "selectionRuleVersions",
  "supportedTailwindVersions",
  "components",
  "buildInstructions",
  "productionInventory",
  "compatibilityMatrix",
  "requiredSurfaces",
  "qualityResults",
  "performanceRecords",
  "exceptions",
  "copyrightNotices",
] as const;

const STRING_INPUT_FIELDS = [
  "registryVersion",
  "releaseVersion",
  "createdAt",
  "licenseTextPath",
  "thirdPartyNoticesPath",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inputFieldError(code: string, path: string, constraint: string): FieldError {
  return {
    code,
    path,
    constraint,
    guidance: `Provide ${path} in the declared release input shape`,
  };
}

function validateReleaseInputShape(value: unknown): readonly FieldError[] {
  if (!isRecord(value)) {
    return [inputFieldError("invalid_release_input", "/", "must be an object")];
  }

  const errors: FieldError[] = [];
  for (const key of Object.keys(value)) {
    if (!RELEASE_INPUT_FIELDS.has(key)) {
      errors.push(
        inputFieldError("unknown_release_input_field", `/${key}`, "must be a declared field"),
      );
    }
  }
  if (value.schemaVersion !== "1.0.0") {
    errors.push(inputFieldError("invalid_schema_version", "/schemaVersion", "must equal 1.0.0"));
  }
  for (const key of STRING_INPUT_FIELDS) {
    if (typeof value[key] !== "string") {
      errors.push(inputFieldError("invalid_release_input_field", `/${key}`, "must be a string"));
    }
  }
  for (const key of ARRAY_INPUT_FIELDS) {
    if (!Array.isArray(value[key])) {
      errors.push(inputFieldError("invalid_release_input_field", `/${key}`, "must be an array"));
    }
  }
  if (!(value.sourceContents instanceof Map)) {
    errors.push(
      inputFieldError(
        "invalid_release_input_field",
        "/sourceContents",
        "must be a Map of confined paths to source text",
      ),
    );
  }
  if (!isRecord(value.tokenDocument)) {
    errors.push(
      inputFieldError("invalid_release_input_field", "/tokenDocument", "must be an object"),
    );
  }
  if (!isRecord(value.tokenChecksum)) {
    errors.push(
      inputFieldError("invalid_release_input_field", "/tokenChecksum", "must be an object"),
    );
  }
  if (value.approval !== undefined && !isRecord(value.approval)) {
    errors.push(inputFieldError("invalid_release_input_field", "/approval", "must be an object"));
  }
  if (value.publishedAt !== undefined && typeof value.publishedAt !== "string") {
    errors.push(inputFieldError("invalid_release_input_field", "/publishedAt", "must be a string"));
  }
  return errors;
}

function hasReleaseBuildInputShape(value: unknown): value is ReleaseBuildInput {
  return validateReleaseInputShape(value).length === 0;
}

/**
 * Public untrusted-data boundary. Structural faults are accumulated before any nested field is
 * read; unexpected malformed nested data is converted to a validation result rather than thrown.
 */
export async function buildReleaseBundle(input: unknown): Promise<BuildValidationResult> {
  const shapeErrors = validateReleaseInputShape(input);
  if (shapeErrors.length > 0) return { success: false, errors: shapeErrors };
  if (!hasReleaseBuildInputShape(input)) {
    return {
      success: false,
      errors: [inputFieldError("invalid_release_input", "/", "must match ReleaseBuildInput")],
    };
  }

  try {
    return await buildValidatedReleaseBundle(input);
  } catch {
    return {
      success: false,
      errors: [
        inputFieldError(
          "malformed_nested_release_input",
          "/",
          "nested records must match their closed public schemas",
        ),
      ],
    };
  }
}

/**
 * Builds a deterministic, immutable, content-addressed release bundle.
 *
 * The input is treated as untrusted — all fields are validated and all errors accumulated.
 * On success, the entire bundle is deep-frozen and content-addressed.
 */
async function buildValidatedReleaseBundle(
  input: ReleaseBuildInput,
): Promise<BuildValidationResult> {
  // Validate input — accumulate all errors
  const validationErrors = validateBuildInput(input);
  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  // Verify source file checksums match declared values
  const checksumErrors = await verifySourceChecksums(input);
  if (checksumErrors.length > 0) {
    return { success: false, errors: checksumErrors };
  }

  // Verify token checksum
  const tokenChecksumErrors = await verifyTokenChecksum(input);
  if (tokenChecksumErrors.length > 0) {
    return { success: false, errors: tokenChecksumErrors };
  }

  // Classify quality
  const qualityResult = classifyReleaseQuality({
    qualityResults: input.qualityResults,
    performanceRecords: input.performanceRecords,
    exceptions: input.exceptions,
    approval: input.approval,
  });

  // Determine release status from classification
  const status = mapClassificationToStatus(qualityResult, input.approval);

  // Build artifact entries with source content
  const components = buildArtifactEntries(input);

  // MVP inventory is a release gate, not an optional reporting helper. Invalid bounds,
  // category coverage, or required surfaces cannot reach an approved/stable bundle.
  const inventory = validateMvpInventory(components, input.requiredSurfaces);
  if (!inventory.valid) {
    return { success: false, errors: inventory.errors };
  }

  // Build token artifact
  const tokenArtifact = buildTokenArtifact(input);

  // Build snapshot (without checksum first)
  const snapshotWithoutChecksum = {
    schemaVersion: "1.0.0" as const,
    registryVersion: input.registryVersion,
    releaseVersion: input.releaseVersion,
    status,
    createdAt: input.createdAt,
    selectionRuleVersions: deepClone([...input.selectionRuleVersions]),
    supportedTailwindVersions: deepClone([...input.supportedTailwindVersions]),
    components,
    tokenArtifact,
    requiredSurfaces: deepClone([...input.requiredSurfaces]),
  };

  // Compute snapshot checksum
  const snapshotChecksum = await computeSnapshotChecksum(snapshotWithoutChecksum);

  const snapshot: RegistrySnapshot = {
    ...snapshotWithoutChecksum,
    snapshotChecksum,
  };

  // Build manifest
  const manifest = buildManifest(input, snapshot);

  // Compute bundle checksum and address
  const bundleChecksum = await computeBundleChecksum(manifest, snapshot);
  const bundleAddress = computeBundleAddress(bundleChecksum);

  const bundle: ReleaseBundle = {
    manifest,
    snapshot,
    bundleChecksum,
    bundleAddress,
  };

  // Deep-freeze the entire bundle
  deepFreeze(bundle);

  return { success: true, bundle };
}

function mapClassificationToStatus(
  result: QualityClassificationResult,
  approval: ReleaseBuildInput["approval"],
): RegistrySnapshot["status"] {
  switch (result.classification) {
    case "stable":
      return approval ? "stable" : "candidate";
    case "experimental":
      return "experimental";
    case "rejected":
      return "rejected";
  }
}

async function verifySourceChecksums(input: ReleaseBuildInput): Promise<readonly FieldError[]> {
  const errors: FieldError[] = [];

  for (let i = 0; i < input.components.length; i++) {
    const component = input.components[i];
    if (!component) continue;
    const prefix = `/components[${String(i)}]`;
    const artifactFiles: { path: string; content: string }[] = [];

    for (let j = 0; j < component.sourceFiles.length; j++) {
      const file = component.sourceFiles[j];
      if (!file) continue;
      const filePath = `${prefix}/sourceFiles[${String(j)}]`;
      const content = input.sourceContents.get(file.path);

      if (content !== undefined) {
        artifactFiles.push({ path: file.path, content });
        const bytes = canonicalizeTextBytes(content);
        const digest = await computeSha256Digest(bytes);

        if (digest !== file.checksum.digest) {
          errors.push({
            code: "checksum_mismatch",
            path: `${filePath}/checksum`,
            constraint: "declared checksum must match actual content",
            guidance: `File '${file.path}' declared digest ${file.checksum.digest} but content hashes to ${digest}`,
          });
        }
      }
    }

    if (artifactFiles.length === component.sourceFiles.length) {
      const observed = await computeFileSetChecksum(artifactFiles);
      if (observed.digest !== component.checksum.digest) {
        errors.push({
          code: "artifact_checksum_mismatch",
          path: `${prefix}/checksum`,
          constraint: "component checksum must match the canonical source file set",
          guidance: `Component '${component.ref.stableId}' declared digest ${component.checksum.digest} but its source file set hashes to ${observed.digest}`,
        });
      }
    }
  }

  return errors;
}

async function verifyTokenChecksum(input: ReleaseBuildInput): Promise<readonly FieldError[]> {
  const errors: FieldError[] = [];
  const canonical = canonicalizeJsonBytes(toJsonValue(input.tokenDocument));
  const digest = await computeSha256Digest(canonical);

  if (digest !== input.tokenChecksum.digest) {
    errors.push({
      code: "token_checksum_mismatch",
      path: "/tokenChecksum",
      constraint: "token checksum must match canonical JSON of token document",
      guidance: `Expected ${input.tokenChecksum.digest} but computed ${digest}`,
    });
  }

  return errors;
}

function buildArtifactEntries(input: ReleaseBuildInput): readonly RegistryArtifactEntry[] {
  const entries: RegistryArtifactEntry[] = [];

  for (const component of input.components) {
    const sourceFiles: SourceFileWithContent[] = [];

    for (const file of component.sourceFiles) {
      const content = input.sourceContents.get(file.path) ?? "";
      sourceFiles.push({
        path: file.path,
        origin: file.origin,
        mediaType: file.mediaType,
        size: file.size,
        checksum: deepClone(file.checksum),
        content,
      });
    }

    // Sort source files by path for deterministic ordering
    sourceFiles.sort((a, b) => a.path.localeCompare(b.path));

    // Build a deterministic name/description from stableId
    const name = component.ref.stableId
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

    const entry: RegistryArtifactEntry = {
      ref: deepClone(component.ref),
      category: component.category,
      name,
      description: `${name} component`,
      tags: [component.category, component.ref.stableId],
      status: component.status,
      sourceFiles,
      generatedFiles: deepClone([...component.generatedFiles]),
      dependencies: deepClone([...component.dependencies]),
      peerDependencies: deepClone([...component.peerDependencies]),
      compatibility: deepClone([...component.compatibility]),
      installation: deepClone([...component.installation]),
      checksum: deepClone(component.checksum),
      provenance: deepClone([...component.provenance]),
      documentationPath: component.documentationPath,
      registryLocation: `/components/${component.category}/${component.ref.stableId}@${component.ref.version}`,
    };

    entries.push(entry);
  }

  // Sort by stableId for deterministic ordering
  entries.sort((a, b) => a.ref.stableId.localeCompare(b.ref.stableId));

  return entries;
}

function buildTokenArtifact(input: ReleaseBuildInput): RegistryTokenArtifact {
  const publications: TokenPublicationIndex = {
    schemaVersions: [TOKEN_SCHEMA_VERSION],
    tokenReleaseVersions: [input.tokenDocument.releaseVersion],
    tailwindVersions: [...SUPPORTED_TAILWIND_VERSIONS],
  };

  return {
    schemaVersion: TOKEN_SCHEMA_VERSION,
    releaseVersion: input.tokenDocument.releaseVersion,
    tokenDocument: deepClone(input.tokenDocument),
    checksum: deepClone(input.tokenChecksum),
    publications,
    registryLocation: `/tokens/${input.tokenDocument.releaseVersion}`,
  };
}

function buildManifest(input: ReleaseBuildInput, snapshot: RegistrySnapshot): ReleaseManifest {
  const artifacts: ArtifactReleaseEntry[] = snapshot.components.map((c) => ({
    ref: deepClone(c.ref),
    checksum: deepClone(c.checksum),
    access: {
      visibility: "public" as const,
      entitlement: "none" as const,
      paymentRequired: false as const,
      licenseKeyRequired: false as const,
      privateVariant: false as const,
      paidOnlyVariant: false as const,
    },
  }));

  const manifest: ReleaseManifest = {
    schemaVersion: "1.0.0",
    releaseVersion: input.releaseVersion,
    status: snapshot.status,
    registryVersion: input.registryVersion,
    licenseTextPath: input.licenseTextPath,
    copyrightNotices: [...input.copyrightNotices],
    thirdPartyNoticesPath: input.thirdPartyNoticesPath,
    buildInstructions: deepClone([...input.buildInstructions]),
    artifacts,
    productionInventory: deepClone([...input.productionInventory]),
    qualityEvidenceRefs: input.qualityResults.map((r) => r.evidence.uri),
    compatibilityMatrix: deepClone([...input.compatibilityMatrix]),
    ...(input.approval ? { approval: deepClone(input.approval) } : {}),
    ...(input.publishedAt && snapshot.status === "stable"
      ? { publishedAt: input.publishedAt }
      : {}),
  };

  return manifest;
}
