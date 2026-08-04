/**
 * Build input validation — treats all input as untrusted.
 *
 * Accumulates all independent FieldErrors rather than failing fast.
 */

import type { BuildInstruction, FieldError } from "@neuraforge-ui/schemas";
import type { ProjectedComponentRecord } from "@neuraforge-ui/components";
import type { ReleaseBuildInput, RequiredMvpSurface } from "./types.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const STABLE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const VERSION_RANGE_INDICATORS = /[\^~*xX]|>=?|<=?|\blatest\b|\bnext\b/;

function field(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

function isConfinedPath(path: string): boolean {
  if (path.startsWith("/") || path.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(path)) return false;
  if (path.includes("\\")) return false;
  const segments = path.split("/");
  return !segments.some((s) => s === "..");
}

export function validateBuildInput(input: ReleaseBuildInput): readonly FieldError[] {
  const errors: FieldError[] = [];

  if (!SEMVER_PATTERN.test(input.registryVersion)) {
    errors.push(
      field(
        "invalid_registry_version",
        "/registryVersion",
        "must be an exact Semantic Version",
        "Use a version such as 1.0.0",
      ),
    );
  }

  if (!SEMVER_PATTERN.test(input.releaseVersion)) {
    errors.push(
      field(
        "invalid_release_version",
        "/releaseVersion",
        "must be an exact Semantic Version",
        "Use a version such as 1.0.0",
      ),
    );
  }

  if (input.createdAt.length === 0) {
    errors.push(
      field(
        "invalid_created_at",
        "/createdAt",
        "must be a non-empty ISO 8601 timestamp",
        "Supply an explicit timestamp",
      ),
    );
  }

  if (input.selectionRuleVersions.length === 0) {
    errors.push(
      field(
        "missing_selection_rules",
        "/selectionRuleVersions",
        "must include at least one selection rule version",
        "Add the search scoring rule version",
      ),
    );
  }

  if (input.supportedTailwindVersions.length === 0) {
    errors.push(
      field(
        "missing_tailwind_versions",
        "/supportedTailwindVersions",
        "must include at least one Tailwind version",
        "Add supported Tailwind CSS versions",
      ),
    );
  }

  validateComponents(input, errors);
  validateTokenInput(input, errors);
  validateBuildInstructions(input.buildInstructions, errors);
  validateSurfaces(input.requiredSurfaces, errors);

  if (input.licenseTextPath.length === 0) {
    errors.push(
      field(
        "missing_license_path",
        "/licenseTextPath",
        "must be a non-empty path to the MIT license",
        "Provide the license file path",
      ),
    );
  }

  if (input.copyrightNotices.length === 0) {
    errors.push(
      field(
        "missing_copyright_notices",
        "/copyrightNotices",
        "must include at least one copyright notice",
        "Add copyright notice strings",
      ),
    );
  }

  if (input.thirdPartyNoticesPath.length === 0) {
    errors.push(
      field(
        "missing_third_party_notices",
        "/thirdPartyNoticesPath",
        "must be a non-empty path",
        "Provide the third-party notices file path",
      ),
    );
  }

  validateProductionInventory(input, errors);

  return errors;
}

function validateComponents(input: ReleaseBuildInput, errors: FieldError[]): void {
  const seenIds = new Set<string>();
  const declaredPaths = new Map<string, string>();

  for (const [i, component] of input.components.entries()) {
    const prefix = `/components[${String(i)}]`;
    const stableId = component.ref.stableId;

    if (!STABLE_ID_PATTERN.test(stableId)) {
      errors.push(
        field(
          "invalid_stable_id",
          `${prefix}/ref/stableId`,
          "must be lowercase kebab-case",
          "Use a stable ID like 'my-component'",
        ),
      );
    } else if (seenIds.has(stableId)) {
      errors.push(
        field(
          "duplicate_stable_id",
          `${prefix}/ref/stableId`,
          "must be unique across all components",
          `Remove duplicate '${stableId}'`,
        ),
      );
    } else {
      seenIds.add(stableId);
    }

    if (!SEMVER_PATTERN.test(component.ref.version)) {
      errors.push(
        field(
          "invalid_component_version",
          `${prefix}/ref/version`,
          "must be an exact Semantic Version",
          "Use a version like 1.0.0",
        ),
      );
    }

    validateSourceFiles(component, prefix, input.sourceContents, declaredPaths, errors);
    validateDependencies(component, prefix, errors);
    validateProvenance(component, prefix, errors);

    if (component.documentationPath.length === 0) {
      errors.push(
        field(
          "missing_documentation_path",
          `${prefix}/documentationPath`,
          "must be a non-empty path",
          "Provide component documentation path",
        ),
      );
    }

    validateInstallSteps(component, prefix, errors);
  }
}

function validateSourceFiles(
  component: ProjectedComponentRecord,
  prefix: string,
  sourceContents: ReadonlyMap<string, string>,
  declaredPaths: Map<string, string>,
  errors: FieldError[],
): void {
  if (component.sourceFiles.length === 0) {
    errors.push(
      field(
        "missing_source_files",
        `${prefix}/sourceFiles`,
        "must have at least one source file",
        "Add source file records",
      ),
    );
    return;
  }

  const componentPaths = new Set<string>();
  for (const [j, file] of component.sourceFiles.entries()) {
    const filePath = `${prefix}/sourceFiles[${String(j)}]`;

    if (!isConfinedPath(file.path)) {
      errors.push(
        field(
          "path_traversal",
          `${filePath}/path`,
          "must be a confined relative path without .., backslash, or drive letter",
          "Use a relative forward-slash path",
        ),
      );
    }

    if (componentPaths.has(file.path)) {
      errors.push(
        field(
          "duplicate_path",
          `${filePath}/path`,
          "a component must declare each source path once",
          `Remove the duplicate '${file.path}' entry from this component`,
        ),
      );
    }
    componentPaths.add(file.path);

    // Multiple components may intentionally share one editable module (for example the data
    // display exports). The shared path is valid only when every declaration is byte-identical.
    const declaration = `${String(file.size)}:${file.checksum.algorithm}:${file.checksum.canonicalization}:${file.checksum.digest}`;
    const priorDeclaration = declaredPaths.get(file.path);
    if (priorDeclaration !== undefined && priorDeclaration !== declaration) {
      errors.push(
        field(
          "conflicting_path_declaration",
          `${filePath}/path`,
          "shared source paths must have identical size and checksum declarations",
          `Make every declaration of '${file.path}' identical or split the source files`,
        ),
      );
    } else {
      declaredPaths.set(file.path, declaration);
    }

    const content = sourceContents.get(file.path);
    if (content === undefined) {
      errors.push(
        field(
          "missing_source_content",
          `${filePath}/path`,
          "source content must exist for declared path",
          `Provide content for '${file.path}'`,
        ),
      );
    } else {
      const bytes = new TextEncoder().encode(content.replace(/\r\n|\r/g, "\n"));
      if (bytes.length !== file.size) {
        errors.push(
          field(
            "size_mismatch",
            `${filePath}/size`,
            "declared size must match actual content byte length",
            `Expected ${String(file.size)} but content is ${String(bytes.length)} bytes`,
          ),
        );
      }
    }
  }
}

function validateDependencies(
  component: ProjectedComponentRecord,
  prefix: string,
  errors: FieldError[],
): void {
  for (const [i, dep] of component.dependencies.entries()) {
    const path = `${prefix}/dependencies[${String(i)}]`;
    if (dep.version.length === 0) {
      errors.push(
        field(
          "missing_dependency_version",
          `${path}/version`,
          "must specify an exact version",
          "Use an exact version string",
        ),
      );
    } else if (VERSION_RANGE_INDICATORS.test(dep.version)) {
      errors.push(
        field(
          "version_range_forbidden",
          `${path}/version`,
          "must be an exact version, not a range",
          `Replace '${dep.version}' with an exact version`,
        ),
      );
    }
  }

  for (const [i, dep] of component.peerDependencies.entries()) {
    const path = `${prefix}/peerDependencies[${String(i)}]`;
    if (dep.version.length === 0) {
      errors.push(
        field(
          "missing_dependency_version",
          `${path}/version`,
          "must specify an exact version",
          "Use an exact version string",
        ),
      );
    } else if (VERSION_RANGE_INDICATORS.test(dep.version)) {
      errors.push(
        field(
          "version_range_forbidden",
          `${path}/version`,
          "must be an exact version, not a range",
          `Replace '${dep.version}' with an exact version`,
        ),
      );
    }
  }
}

function validateProvenance(
  component: ProjectedComponentRecord,
  prefix: string,
  errors: FieldError[],
): void {
  if (component.provenance.length === 0) {
    errors.push(
      field(
        "missing_provenance",
        `${prefix}/provenance`,
        "must have at least one provenance record",
        "Add license provenance",
      ),
    );
    return;
  }

  for (const [k, prov] of component.provenance.entries()) {
    const provPath = `${prefix}/provenance[${String(k)}]`;
    if (prov.licenseTextPath.length === 0) {
      errors.push(
        field(
          "missing_license_text_path",
          `${provPath}/licenseTextPath`,
          "must include a license text path",
          "Add the license file path",
        ),
      );
    }
    if (prov.reviewStatus !== "approved") {
      errors.push(
        field(
          "unapproved_license",
          `${provPath}/reviewStatus`,
          "must be 'approved' for release",
          "Complete license review before building",
        ),
      );
    }
  }
}

function validateInstallSteps(
  component: ProjectedComponentRecord,
  prefix: string,
  errors: FieldError[],
): void {
  if (component.installation.length === 0) {
    errors.push(
      field(
        "missing_installation",
        `${prefix}/installation`,
        "must have at least one install step",
        "Add install instructions",
      ),
    );
    return;
  }

  for (let k = 1; k < component.installation.length; k++) {
    const prev = component.installation[k - 1];
    const curr = component.installation[k];
    if (prev && curr && curr.step <= prev.step) {
      errors.push(
        field(
          "unordered_install_steps",
          `${prefix}/installation[${String(k)}]`,
          "install steps must be strictly ordered",
          "Ensure step numbers are ascending",
        ),
      );
    }
  }
}

function validateTokenInput(input: ReleaseBuildInput, errors: FieldError[]): void {
  if (input.tokenChecksum.digest.length !== 64) {
    errors.push(
      field(
        "invalid_token_checksum_digest",
        "/tokenChecksum/digest",
        "must be a 64-character hex string",
        "Provide a valid SHA-256 digest",
      ),
    );
  }
}

function validateBuildInstructions(
  instructions: readonly BuildInstruction[],
  errors: FieldError[],
): void {
  const requiredCapabilities = [
    "registry",
    "public-api",
    "mcp-server",
    "documentation-site",
  ] as const;
  const seen = new Set<string>();

  for (const cap of requiredCapabilities) {
    const found = instructions.find((instr) => instr.capability === cap);
    if (!found) {
      errors.push(
        field(
          "missing_build_instruction",
          `/buildInstructions/${cap}`,
          `must include build instruction for '${cap}'`,
          `Add a BuildInstruction with capability '${cap}'`,
        ),
      );
    }
  }

  for (const [i, instr] of instructions.entries()) {
    const instrPath = `/buildInstructions[${String(i)}]`;
    if (seen.has(instr.capability)) {
      errors.push(
        field(
          "duplicate_build_instruction",
          instrPath,
          "each capability must appear exactly once",
          `Remove duplicate '${instr.capability}' instruction`,
        ),
      );
    }
    seen.add(instr.capability);

    if (instr.sourceLocation.length === 0) {
      errors.push(
        field(
          "missing_source_location",
          `${instrPath}/sourceLocation`,
          "must include a source location",
          "Add the source directory path",
        ),
      );
    }
    if (instr.command.length === 0) {
      errors.push(
        field(
          "missing_build_command",
          `${instrPath}/command`,
          "must include a build command",
          "Add the deterministic build command",
        ),
      );
    }
  }
}

function validateSurfaces(surfaces: readonly RequiredMvpSurface[], errors: FieldError[]): void {
  const seen = new Set<string>();

  for (const [i, surface] of surfaces.entries()) {
    const surfacePath = `/requiredSurfaces[${String(i)}]`;

    if (surface.surfaceId.length === 0) {
      errors.push(
        field(
          "missing_surface_id",
          `${surfacePath}/surfaceId`,
          "must have a surface ID",
          "Provide a surface identifier",
        ),
      );
    } else if (seen.has(surface.surfaceId)) {
      errors.push(
        field(
          "duplicate_surface",
          `${surfacePath}/surfaceId`,
          "each surface must appear exactly once",
          `Remove duplicate '${surface.surfaceId}'`,
        ),
      );
    } else {
      seen.add(surface.surfaceId);
    }

    if (surface.publicSourceLocation.length === 0) {
      errors.push(
        field(
          "missing_surface_source",
          `${surfacePath}/publicSourceLocation`,
          "must have a public source location",
          "Add the source repository URL or path",
        ),
      );
    }
    if (surface.buildCommand.length === 0) {
      errors.push(
        field(
          "missing_surface_build_command",
          `${surfacePath}/buildCommand`,
          "must have a deterministic build command",
          "Add the build command",
        ),
      );
    }
  }
}

function validateProductionInventory(input: ReleaseBuildInput, errors: FieldError[]): void {
  for (const [i, item] of input.productionInventory.entries()) {
    const itemPath = `/productionInventory[${String(i)}]`;

    if (item.name.length === 0) {
      errors.push(
        field(
          "missing_inventory_name",
          `${itemPath}/name`,
          "must have a name",
          "Provide dependency name",
        ),
      );
    }
    if (item.version.length === 0) {
      errors.push(
        field(
          "missing_inventory_version",
          `${itemPath}/version`,
          "must have an exact version",
          "Provide an exact version",
        ),
      );
    } else if (VERSION_RANGE_INDICATORS.test(item.version)) {
      errors.push(
        field(
          "version_range_in_inventory",
          `${itemPath}/version`,
          "must be an exact version, not a range",
          `Replace '${item.version}' with an exact version`,
        ),
      );
    }
    if (item.provenance.reviewStatus !== "approved") {
      errors.push(
        field(
          "unapproved_inventory_license",
          `${itemPath}/provenance/reviewStatus`,
          "must be 'approved'",
          "Complete license review",
        ),
      );
    }
  }
}
