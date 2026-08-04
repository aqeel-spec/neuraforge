/**
 * MCP catalog provider adapter — bridges a ReleaseBundle to McpCatalogProvider.
 *
 * Implements @neuraforge/mcp-core's McpCatalogProvider interface without creating
 * a dependency cycle (mcp-core does not depend on registry-builder; registry-builder
 * depends on mcp-core).
 */

import type { ArtifactRef, Result } from "@neuraforge/schemas";
import type {
  ComponentArtifact,
  ComponentSourceFile,
  ComponentSummary,
  McpCatalogProvider,
  ProviderError,
  TokenArtifact,
} from "@neuraforge/mcp-core";
import type { ComponentCategory } from "@neuraforge/mcp-core";
import type { ReleaseBundle } from "./types.js";
import { createRegistryBundleReader } from "./reader.js";

/**
 * Creates an McpCatalogProvider backed by a verified release bundle.
 * Verifies the bundle once during creation.
 */
export async function createMcpCatalogProvider(
  bundle: ReleaseBundle,
): Promise<Result<McpCatalogProvider, { readonly code: string; readonly message: string }>> {
  const readerResult = await createRegistryBundleReader(bundle);
  if (!readerResult.ok) {
    return readerResult;
  }

  const reader = readerResult.value;

  function mapSummaries(category?: ComponentCategory): ComponentSummary[] {
    const summaries = reader.listComponents(category);
    return summaries.map((s) => ({
      stableId: s.stableId,
      version: s.version,
      name: s.name,
      description: s.description,
      category: s.category as ComponentCategory,
      tags: s.tags,
      checksum: s.checksum,
    }));
  }

  const provider: McpCatalogProvider = {
    verifiedSnapshot: true,

    listComponents(
      _registryVersion: string,
      category?: ComponentCategory,
    ): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      return Promise.resolve({ ok: true, value: mapSummaries(category) });
    },

    getComponent(
      _registryVersion: string,
      stableId: string,
      version: string,
    ): Promise<Result<ComponentArtifact, ProviderError>> {
      const result = reader.getComponent(stableId, version);
      if (!result.ok) {
        return Promise.resolve({
          ok: false,
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        });
      }

      const entry = result.value;
      const sourceFiles: ComponentSourceFile[] = entry.sourceFiles.map((f) => ({
        path: f.path,
        origin: f.origin,
        mediaType: f.mediaType,
        size: f.size,
        checksum: f.checksum,
        content: f.content,
      }));

      const artifact: ComponentArtifact = {
        stableId: entry.ref.stableId,
        version: entry.ref.version,
        name: entry.name,
        description: entry.description,
        category: entry.category as ComponentCategory,
        tags: entry.tags,
        sourceFiles,
        dependencies: entry.dependencies.map((d) => ({
          kind: "component" as const,
          stableId: d.name,
          version: d.version,
        })),
        compatibility: [...entry.compatibility],
        installation: entry.installation.map((inst) => ({
          step: String(inst.step),
          ...(inst.command ? { command: inst.command } : {}),
        })),
        checksum: entry.checksum,
        provenance: [...entry.provenance],
        registryLocation: entry.registryLocation,
      };

      return Promise.resolve({ ok: true, value: artifact });
    },

    getComponentsForSearch(
      _registryVersion: string,
      category?: ComponentCategory,
    ): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      return Promise.resolve({ ok: true, value: mapSummaries(category) });
    },

    getDesignTokens(
      _registryVersion: string,
      exactVersion: string,
    ): Promise<Result<TokenArtifact, ProviderError>> {
      const result = reader.getTokenArtifact(exactVersion);
      if (!result.ok) {
        return Promise.resolve({
          ok: false,
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        });
      }

      const token = result.value;
      return Promise.resolve({
        ok: true,
        value: {
          exactVersion: token.releaseVersion,
          tokenDocument: token.tokenDocument,
          checksum: token.checksum,
          registryLocation: token.registryLocation,
        },
      });
    },

    getPublishedTokenVersions(
      _registryVersion: string,
    ): Promise<Result<readonly string[], ProviderError>> {
      void _registryVersion;
      const snapshot = reader.getSnapshot();
      return Promise.resolve({ ok: true, value: [snapshot.tokenArtifact.releaseVersion] });
    },

    getPublishedComponentRefs(
      _registryVersion: string,
      stableId: string,
    ): Promise<Result<readonly ArtifactRef[], ProviderError>> {
      const snapshot = reader.getSnapshot();
      const refs = snapshot.components.filter((c) => c.ref.stableId === stableId).map((c) => c.ref);
      return Promise.resolve({ ok: true, value: refs });
    },
  };

  return { ok: true, value: provider };
}
