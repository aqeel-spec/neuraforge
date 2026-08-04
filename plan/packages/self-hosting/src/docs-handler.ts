/**
 * Small public docs handler generated from bundle metadata.
 *
 * Provides: installation, MCP operations, component index/source/docs links,
 * self-hosting/contribution/security links. No auth.
 */

import type { JsonValue } from "@neuraforge/schemas";
import type { ReleaseBundle } from "@neuraforge/registry-builder";
import { toJsonValue } from "@neuraforge/registry-builder";

export interface DocsResponse {
  readonly status: number;
  readonly contentType: string;
  readonly body: string;
}

export interface DocsHandler {
  handle(path: string): DocsResponse;
}

/**
 * Creates a docs handler from bundle metadata. Pure, no network.
 */
export function createDocsHandler(bundle: ReleaseBundle): DocsHandler {
  const snapshot = bundle.snapshot;
  const registryVersion = snapshot.registryVersion;

  // Pre-build component index
  const componentIndex = snapshot.components.map((c) => ({
    stableId: c.ref.stableId,
    version: c.ref.version,
    name: c.name,
    category: c.category,
    description: c.description,
    documentationPath: c.documentationPath,
    registryLocation: c.registryLocation,
  }));

  // Pre-build MCP operations list
  const mcpOperations = [
    {
      operation: "list_components",
      description: "Enumerate published components, filterable by category",
    },
    {
      operation: "get_component",
      description: "Fetch exact source, props, dependencies, install steps, and checksum",
    },
    {
      operation: "search_components",
      description: "Rank components by intent, with a reproducible explanation",
    },
    {
      operation: "get_design_tokens",
      description: "Read the token set so agent-written code stays visually consistent",
    },
  ];

  // Pre-build links
  const links = {
    selfHosting: "/docs/self-hosting",
    contributing: "https://github.com/neuraforge/ui/blob/main/CONTRIBUTING.md",
    security: "https://github.com/neuraforge/ui/blob/main/SECURITY.md",
    license: "MIT",
    source: "https://github.com/neuraforge/ui",
  };

  const indexPayload = toJsonValue({
    registryVersion,
    releaseVersion: snapshot.releaseVersion,
    schemaVersion: snapshot.schemaVersion,
    componentCount: componentIndex.length,
    categories: [...new Set(componentIndex.map((c) => c.category))].sort(),
    mcpOperations,
    links,
  });

  const componentsPayload = toJsonValue(componentIndex);

  const installPayload = toJsonValue({
    registryVersion,
    steps: [
      { step: 1, description: "Acquire the release bundle" },
      { step: 2, description: "Validate bundle integrity (SHA-256 checksum)" },
      { step: 3, description: "Configure self-hosting (config schema 1.0.0)" },
      { step: 4, description: "Start runtime with prepared config and bundle" },
    ],
  });

  return {
    handle(path: string): DocsResponse {
      const normalized = path.startsWith("/") ? path : `/${path}`;

      if (normalized === "/docs" || normalized === "/docs/") {
        return jsonResponse(200, indexPayload);
      }
      if (normalized === "/docs/components") {
        return jsonResponse(200, componentsPayload);
      }
      if (normalized === "/docs/installation") {
        return jsonResponse(200, installPayload);
      }
      if (normalized === "/docs/mcp") {
        return jsonResponse(200, toJsonValue(mcpOperations));
      }
      if (normalized === "/docs/self-hosting") {
        return jsonResponse(
          200,
          toJsonValue({
            configSchemaVersion: "1.0.0",
            description:
              "Self-hosted NeuraForge runtime — no account, no license, no egress required",
            links,
          }),
        );
      }

      return jsonResponse(
        404,
        toJsonValue({
          error: { code: "not_found", message: `Documentation path '${normalized}' not found` },
        }),
      );
    },
  };
}

function jsonResponse(status: number, body: JsonValue): DocsResponse {
  return {
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  };
}
