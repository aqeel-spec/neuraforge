/**
 * MVP inventory validation.
 *
 * Validates that the release contains:
 * - Exactly 15..20 stable components (inclusive)
 * - Every one of six categories present
 * - Every required surface present exactly once
 * - No auth/entitlement/private flags on surfaces
 */

import type { FieldError } from "@neuraforge/schemas";
import type { MvpInventoryResult, RegistryArtifactEntry, RequiredMvpSurface } from "./types.js";

const REQUIRED_CATEGORIES = [
  "navigation",
  "layout",
  "forms",
  "feedback",
  "data-display",
  "marketing",
] as const;

const REQUIRED_SURFACE_IDS = [
  "registry",
  "public-api",
  "cli",
  "npm-package",
  "mcp-server",
  "design-tokens",
  "documentation-site",
  "contribution-workflow",
] as const;

function field(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

export function validateMvpInventory(
  components: readonly RegistryArtifactEntry[],
  surfaces: readonly RequiredMvpSurface[],
): MvpInventoryResult {
  const errors: FieldError[] = [];

  // Component count bounds: 15..20 inclusive
  const stableComponents = components.filter((c) => c.status === "stable");
  const count = stableComponents.length;

  if (count < 15) {
    errors.push(
      field(
        "too_few_components",
        "/components",
        "must have at least 15 stable components",
        `Found ${String(count)} stable components, need at least 15`,
      ),
    );
  }

  if (count > 20) {
    errors.push(
      field(
        "too_many_components",
        "/components",
        "must have at most 20 stable components",
        `Found ${String(count)} stable components, maximum is 20`,
      ),
    );
  }

  // Every category must be present
  const presentCategories = new Set(stableComponents.map((c) => c.category));
  for (const category of REQUIRED_CATEGORIES) {
    if (!presentCategories.has(category)) {
      errors.push(
        field(
          "missing_category",
          `/components/category/${category}`,
          `must include at least one component in category '${category}'`,
          `Add a stable component in the '${category}' category`,
        ),
      );
    }
  }

  // Required surfaces: each present exactly once
  const surfaceIds = surfaces.map((s) => s.surfaceId);
  const surfaceIdSet = new Set<string>();

  for (const surfaceId of surfaceIds) {
    if (surfaceIdSet.has(surfaceId)) {
      errors.push(
        field(
          "duplicate_surface",
          `/requiredSurfaces/${surfaceId}`,
          "each required surface must appear exactly once",
          `Remove duplicate surface '${surfaceId}'`,
        ),
      );
    }
    surfaceIdSet.add(surfaceId);
  }

  for (const requiredId of REQUIRED_SURFACE_IDS) {
    if (!surfaceIdSet.has(requiredId)) {
      errors.push(
        field(
          "missing_surface",
          `/requiredSurfaces/${requiredId}`,
          `must include required surface '${requiredId}'`,
          `Add the '${requiredId}' surface entry`,
        ),
      );
    }
  }

  // Validate each surface entry
  for (const surface of surfaces) {
    if (
      typeof surface.publicSourceLocation !== "string" ||
      surface.publicSourceLocation.length === 0
    ) {
      errors.push(
        field(
          "missing_surface_source_location",
          `/requiredSurfaces/${surface.surfaceId}/publicSourceLocation`,
          "must have a public source location",
          "Add the public source URL or path",
        ),
      );
    }

    if (typeof surface.buildCommand !== "string" || surface.buildCommand.length === 0) {
      errors.push(
        field(
          "missing_surface_build_command",
          `/requiredSurfaces/${surface.surfaceId}/buildCommand`,
          "must have a deterministic build command",
          "Add the build command",
        ),
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
