/**
 * Search and inspect operations over a verified bundle.
 *
 * Operates read-only over the RegistryBundleReader. Never writes.
 * Search uses mcp-core's deterministic ranking rule.
 */

import type { RegistryBundleReader } from "@neuraforge-ui/registry-builder";
import { normalizeText, SEARCH_RULE_VERSION } from "@neuraforge-ui/mcp-core";
import type { InstallerResult, SearchResult, InspectResult } from "./types.js";

/**
 * Deterministic search over a verified bundle using mcp-core scoring.
 */
export function search(reader: RegistryBundleReader, query: string): InstallerResult<SearchResult> {
  if (query.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Search query must not be empty",
        fields: [{ path: "query", constraint: "non_empty", guidance: "Provide a search term" }],
      },
    };
  }

  const components = reader.listComponents();
  const normalizedQuery = normalizeText(query);
  const queryTokens = new Set(normalizedQuery.split(" ").filter((t) => t.length > 0));

  const scored: {
    stableId: string;
    version: string;
    name: string;
    description: string;
    category: string;
    score: number;
    explanations: string[];
  }[] = [];

  for (const comp of components) {
    const normStableId = normalizeText(comp.stableId);
    const normName = normalizeText(comp.name);
    const normCategory = normalizeText(comp.category);
    const normDescription = normalizeText(comp.description);

    let score = 0;
    const explanations: string[] = [];

    if (normStableId === normalizedQuery) {
      score += 100;
      explanations.push(`Exact stableId match: '${comp.stableId}'`);
    } else if (normStableId.startsWith(normalizedQuery)) {
      score += 40;
      explanations.push(`stableId prefix match: '${comp.stableId}'`);
    }

    if (normName === normalizedQuery) {
      score += 80;
      explanations.push(`Exact name match: '${comp.name}'`);
    } else if (normName.startsWith(normalizedQuery)) {
      score += 30;
      explanations.push(`Name prefix match: '${comp.name}'`);
    }

    for (const tag of comp.tags) {
      const normTag = normalizeText(tag);
      if (normTag === normalizedQuery || queryTokens.has(normTag)) {
        score += 25;
        explanations.push(`Tag match: '${tag}'`);
      }
    }

    if (normCategory === normalizedQuery || queryTokens.has(normCategory)) {
      score += 20;
      explanations.push(`Category match: '${comp.category}'`);
    }

    const descriptionTokens = new Set(normDescription.split(" ").filter((t) => t.length > 0));
    let descPoints = 0;
    for (const qt of queryTokens) {
      if (descriptionTokens.has(qt)) {
        descPoints += 10;
      }
    }
    if (descPoints > 0) {
      score += descPoints;
      explanations.push(`Description token overlap: ${String(descPoints / 10)} matching terms`);
    }

    if (score > 0) {
      scored.push({
        stableId: comp.stableId,
        version: comp.version,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        score,
        explanations,
      });
    }
  }

  // Deterministic sort: score desc, stableId asc, version asc
  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.stableId !== b.stableId) return a.stableId < b.stableId ? -1 : 1;
    if (a.version !== b.version) return a.version < b.version ? -1 : 1;
    return 0;
  });

  const results = scored.map((s) => ({
    stableId: s.stableId,
    version: s.version,
    name: s.name,
    description: s.description,
    category: s.category,
    score: s.score,
    ruleVersion: SEARCH_RULE_VERSION,
    explanations: s.explanations,
  }));

  return {
    ok: true,
    value: {
      query,
      results,
      ruleVersion: SEARCH_RULE_VERSION,
    },
  };
}

/**
 * Inspect an exact stableId+version from the verified bundle.
 * Returns full metadata. If not found, includes alternatives.
 */
export function inspect(
  reader: RegistryBundleReader,
  stableId: string,
  version: string,
): InstallerResult<InspectResult> {
  if (stableId.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "stableId must not be empty",
        fields: [{ path: "stableId", constraint: "non_empty", guidance: "Provide a stableId" }],
      },
    };
  }
  if (version.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "version must not be empty",
        fields: [
          { path: "version", constraint: "non_empty", guidance: "Provide an exact version" },
        ],
      },
    };
  }

  const result = reader.getComponent(stableId, version);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: result.error.message,
        alternatives: result.error.alternatives,
      },
    };
  }

  const entry = result.value;
  return {
    ok: true,
    value: {
      stableId: entry.ref.stableId,
      version: entry.ref.version,
      name: entry.name,
      description: entry.description,
      category: entry.category,
      tags: [...entry.tags],
      registryLocation: entry.registryLocation,
      sourceFiles: entry.sourceFiles.map((f) => ({
        path: f.path,
        checksum: f.checksum,
        size: f.size,
      })),
      artifactChecksum: entry.checksum,
      dependencies: entry.dependencies.map((d) => ({
        name: d.name,
        version: d.version,
        source: d.source,
      })),
      compatibility: [...entry.compatibility],
      provenance: [...entry.provenance],
      installation: entry.installation.map((i) => ({
        step: i.step,
        description: i.description,
        ...(i.command !== undefined ? { command: i.command } : {}),
      })),
    },
  };
}
