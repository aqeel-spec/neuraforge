/**
 * Default conformance adapters created from an exact verified bundle.
 *
 * These bridge the real registry-builder reader, public-api handler, and mcp-core
 * dispatcher to the transport-neutral adapter interface used by conformance cases.
 */

import type { JsonValue } from "@neuraforge-ui/schemas";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import {
  createRegistryBundleReader,
  createMcpCatalogProvider,
  toJsonValue,
} from "@neuraforge-ui/registry-builder";
import { createPublicApi } from "@neuraforge-ui/public-api";
import { createMcpDispatcher } from "@neuraforge-ui/mcp-core";
import type {
  ConformanceAdapters,
  McpAdapter,
  PublicApiAdapter,
  RegistryAdapter,
} from "./types.js";

/**
 * Creates default conformance adapters from a verified bundle.
 * Throws if bundle verification fails — never returns partial adapters.
 */
export async function createDefaultAdapters(bundle: ReleaseBundle): Promise<ConformanceAdapters> {
  // Create registry reader
  const readerResult = await createRegistryBundleReader(bundle);
  if (!readerResult.ok) {
    throw new Error(`Registry reader creation failed: ${readerResult.error.message}`);
  }
  const reader = readerResult.value;

  // Create public API handler
  const publicApiHandler = await createPublicApi(bundle);

  // Create MCP dispatcher from provider
  const providerResult = await createMcpCatalogProvider(bundle);
  if (!providerResult.ok) {
    throw new Error(`MCP provider creation failed: ${providerResult.error.message}`);
  }
  const dispatcher = createMcpDispatcher(providerResult.value);

  const registry: RegistryAdapter = {
    getSnapshot(): Promise<JsonValue> {
      return Promise.resolve(toJsonValue(reader.getSnapshot()));
    },
    listComponents(category?: string): Promise<JsonValue> {
      return Promise.resolve(toJsonValue(reader.listComponents(category)));
    },
    getComponent(stableId: string, version: string): Promise<JsonValue> {
      const result = reader.getComponent(stableId, version);
      return Promise.resolve(toJsonValue(result));
    },
    getTokenArtifact(version: string): Promise<JsonValue> {
      const result = reader.getTokenArtifact(version);
      return Promise.resolve(toJsonValue(result));
    },
  };

  const publicApi: PublicApiAdapter = {
    async handle(
      method: string,
      path: string,
      query?: Record<string, string>,
    ): Promise<{ readonly status: number; readonly body: JsonValue }> {
      const response = await publicApiHandler.handle({
        method,
        path,
        query: query ?? {},
        headers: {},
      });
      let body: JsonValue = null;
      if (response.body.length > 0) {
        try {
          body = JSON.parse(response.body) as JsonValue;
        } catch {
          body = response.body;
        }
      }
      return { status: response.status, body };
    },
  };

  const mcp: McpAdapter = {
    async dispatch(operation: string, input: JsonValue, context: JsonValue): Promise<JsonValue> {
      const result = await dispatcher.dispatch(
        operation as
          | "list_components"
          | "get_component"
          | "search_components"
          | "get_design_tokens",
        input,
        context,
      );
      return toJsonValue(result);
    },
  };

  return { registry, publicApi, mcp };
}
