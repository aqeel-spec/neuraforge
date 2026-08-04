/**
 * prepareSelfHostedRuntime — validates config and bundle before creating interfaces.
 *
 * MUST validate config and verify bundle before creating/exposing any interface.
 * Returns Result with all errors. No bind/listen inside prepare.
 */

import type { FieldError, Result } from "@neuraforge-ui/schemas";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import {
  createRegistryBundleReader,
  createMcpCatalogProvider,
  verifyReleaseBundle,
} from "@neuraforge-ui/registry-builder";
import type { RegistryBundleReader } from "@neuraforge-ui/registry-builder";
import { createPublicApi } from "@neuraforge-ui/public-api";
import type { PublicApiHandler } from "@neuraforge-ui/public-api";
import { createMcpDispatcher } from "@neuraforge-ui/mcp-core";
import type { McpDispatcher } from "@neuraforge-ui/mcp-core";
import { validateSelfHostConfig } from "./validate-config.js";
import type { SelfHostConfig, EnabledInterface } from "./config-types.js";
import { createDocsHandler } from "./docs-handler.js";
import type { DocsHandler } from "./docs-handler.js";

/** The prepared self-hosted runtime — not yet listening. */
export interface PreparedRuntime {
  readonly config: SelfHostConfig;
  readonly bundle: ReleaseBundle;
  readonly reader: RegistryBundleReader;
  readonly publicApi: PublicApiHandler | null;
  readonly mcpDispatcher: McpDispatcher | null;
  readonly docsHandler: DocsHandler | null;
  readonly enabledInterfaces: readonly EnabledInterface[];
}

export interface PrepareError {
  readonly code: string;
  readonly message: string;
  readonly errors: readonly FieldError[];
}

/**
 * Validates config and verifies bundle. On success, composes interfaces.
 * Does NOT bind or listen. Does NOT require external network.
 */
export async function prepareSelfHostedRuntime(
  configUnknown: unknown,
  bundle: ReleaseBundle,
): Promise<Result<PreparedRuntime, PrepareError>> {
  const allErrors: FieldError[] = [];

  // 1. Validate config
  const configResult = validateSelfHostConfig(configUnknown);
  if (!configResult.valid || !configResult.config) {
    allErrors.push(...configResult.errors);
  }

  // 2. Verify bundle integrity
  const verification = await verifyReleaseBundle(bundle);
  if (!verification.valid) {
    for (const m of verification.mismatches) {
      allErrors.push({
        code: "bundle_integrity",
        path: m.path,
        constraint: `expected ${m.expected}`,
        guidance: `Bundle mismatch at ${m.path}: got ${m.actual}`,
      });
    }
  }

  if (allErrors.length > 0) {
    return {
      ok: false,
      error: {
        code: "preparation_failed",
        message: `Self-hosted runtime preparation failed with ${String(allErrors.length)} error(s)`,
        errors: allErrors,
      },
    };
  }

  // Config is guaranteed defined here since valid=true requires it
  if (!configResult.config) {
    return {
      ok: false,
      error: {
        code: "config_undefined",
        message: "Config validation passed but config is undefined",
        errors: [],
      },
    };
  }
  const config = configResult.config;

  // 3. Create registry reader
  const readerResult = await createRegistryBundleReader(bundle);
  if (!readerResult.ok) {
    return {
      ok: false,
      error: {
        code: "reader_creation_failed",
        message: readerResult.error.message,
        errors: [],
      },
    };
  }
  const reader = readerResult.value;

  // 4. Compose enabled interfaces
  let publicApi: PublicApiHandler | null = null;
  let mcpDispatcher: McpDispatcher | null = null;
  let docsHandler: DocsHandler | null = null;

  if (
    config.enabledInterfaces.includes("public-api") ||
    config.enabledInterfaces.includes("registry")
  ) {
    publicApi = await createPublicApi(bundle);
  }

  if (config.enabledInterfaces.includes("mcp")) {
    const providerResult = await createMcpCatalogProvider(bundle);
    if (!providerResult.ok) {
      return {
        ok: false,
        error: {
          code: "mcp_provider_failed",
          message: providerResult.error.message,
          errors: [],
        },
      };
    }
    mcpDispatcher = createMcpDispatcher(providerResult.value);
  }

  if (config.enabledInterfaces.includes("docs")) {
    docsHandler = createDocsHandler(bundle);
  }

  return {
    ok: true,
    value: {
      config,
      bundle,
      reader,
      publicApi,
      mcpDispatcher,
      docsHandler,
      enabledInterfaces: config.enabledInterfaces,
    },
  };
}
