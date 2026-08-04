/**
 * In-memory fixture provider for mcp-core tests.
 */

import type { ArtifactRef, Checksum, JsonValue, Result } from "@neuraforge/schemas";
import {
  computeFileSetChecksum,
  computeJsonChecksum,
  computeSha256Digest,
  canonicalizeTextBytes,
} from "@neuraforge/catalog-core";
import type { TokenDocument } from "@neuraforge/tokens";
import type {
  ComponentArtifact,
  ComponentSourceFile,
  McpCatalogProvider,
  ProviderError,
  TokenArtifact,
} from "../src/index.js";
import type { ComponentCategory, ComponentSummary } from "../src/index.js";

export async function makeFileChecksum(content: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(content);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest };
}

export async function makeArtifactChecksum(
  files: readonly { path: string; content: string }[],
): Promise<Checksum> {
  return computeFileSetChecksum(files);
}

export interface FixtureComponentDef {
  stableId: string;
  version: string;
  name: string;
  description: string;
  category: ComponentCategory;
  tags: readonly string[];
  sourceContent: string;
  sourcePath: string;
}

export async function buildComponentArtifact(def: FixtureComponentDef): Promise<ComponentArtifact> {
  const fileChecksum = await makeFileChecksum(def.sourceContent);
  const artifactChecksum = await makeArtifactChecksum([
    { path: def.sourcePath, content: def.sourceContent },
  ]);
  const sourceFile: ComponentSourceFile = {
    path: def.sourcePath,
    origin: "original",
    mediaType: "text/typescript",
    size: def.sourceContent.length,
    checksum: fileChecksum,
    content: def.sourceContent,
  };
  return {
    stableId: def.stableId,
    version: def.version,
    name: def.name,
    description: def.description,
    category: def.category,
    tags: def.tags,
    sourceFiles: [sourceFile],
    dependencies: [],
    compatibility: [],
    installation: [{ step: "Install", command: "npm install" }],
    checksum: artifactChecksum,
    provenance: [],
    registryLocation: `/registry/1.0.0/artifacts/component/${def.stableId}/${def.version}`,
  };
}

export function summaryFromArtifact(artifact: ComponentArtifact): ComponentSummary {
  return {
    stableId: artifact.stableId,
    version: artifact.version,
    name: artifact.name,
    description: artifact.description,
    category: artifact.category,
    tags: artifact.tags,
    checksum: artifact.checksum,
  };
}

export const FIXTURE_DEFS: FixtureComponentDef[] = [
  {
    stableId: "button",
    version: "1.0.0",
    name: "Button",
    description: "A primary action button component",
    category: "forms",
    tags: ["button", "action", "interactive"],
    sourceContent: "export function Button() { return <button>Click</button>; }",
    sourcePath: "src/button.tsx",
  },
  {
    stableId: "button",
    version: "1.1.0",
    name: "Button",
    description: "A primary action button component with variants",
    category: "forms",
    tags: ["button", "action", "interactive", "variant"],
    sourceContent:
      "export function Button({variant}: {variant?: string}) { return <button>Click</button>; }",
    sourcePath: "src/button.tsx",
  },
  {
    stableId: "navbar",
    version: "1.0.0",
    name: "Navigation Bar",
    description: "A responsive navigation bar for site headers",
    category: "navigation",
    tags: ["nav", "header", "responsive"],
    sourceContent: "export function Navbar() { return <nav>Nav</nav>; }",
    sourcePath: "src/navbar.tsx",
  },
  {
    stableId: "pricing-table",
    version: "1.0.0",
    name: "Pricing Table",
    description: "A marketing pricing tiers comparison table",
    category: "marketing",
    tags: ["pricing", "marketing", "table", "tiers"],
    sourceContent: "export function PricingTable() { return <div>Pricing</div>; }",
    sourcePath: "src/pricing-table.tsx",
  },
  {
    stableId: "card",
    version: "1.0.0",
    name: "Card",
    description: "A layout card with optional header and footer",
    category: "layout",
    tags: ["card", "container", "layout"],
    sourceContent: "export function Card() { return <div>Card</div>; }",
    sourcePath: "src/card.tsx",
  },
  {
    stableId: "alert",
    version: "1.0.0",
    name: "Alert",
    description: "A feedback alert notification component",
    category: "feedback",
    tags: ["alert", "notification", "feedback"],
    sourceContent: "export function Alert() { return <div role='alert'>Alert</div>; }",
    sourcePath: "src/alert.tsx",
  },
  {
    stableId: "data-table",
    version: "1.0.0",
    name: "Data Table",
    description: "A data display table with sorting and filtering",
    category: "data-display",
    tags: ["table", "data", "grid", "sorting"],
    sourceContent: "export function DataTable() { return <table><tbody></tbody></table>; }",
    sourcePath: "src/data-table.tsx",
  },
];

export const FIXTURE_TOKEN_DOC: TokenDocument = {
  schemaVersion: "1.0.0",
  releaseVersion: "1.0.0",
  ordering: "declaration",
  tokens: {
    "color.brand.primary": {
      category: "color",
      type: "color",
      value: "#6366f1",
    },
    "spacing.sm": {
      category: "spacing",
      type: "dimension",
      value: "0.5rem",
    },
    "typography.body.size": {
      category: "typography",
      type: "fontSize",
      value: "1rem",
    },
  },
};

export async function createFixtureProvider(): Promise<{
  provider: McpCatalogProvider;
  artifacts: ComponentArtifact[];
  summaries: ComponentSummary[];
  tokenArtifact: TokenArtifact;
}> {
  const artifacts = await Promise.all(FIXTURE_DEFS.map(buildComponentArtifact));
  const summaries = artifacts.map(summaryFromArtifact);

  const tokenChecksum = await computeJsonChecksum(
    JSON.parse(JSON.stringify(FIXTURE_TOKEN_DOC)) as JsonValue,
  );

  const tokenArtifact: TokenArtifact = {
    exactVersion: "1.0.0",
    tokenDocument: FIXTURE_TOKEN_DOC,
    checksum: tokenChecksum,
    registryLocation: "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
  };

  const provider: McpCatalogProvider = {
    verifiedSnapshot: true,

    listComponents(
      _registryVersion: string,
      category?: ComponentCategory,
      exactVersion?: string,
    ): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      let filtered = summaries;
      if (category) filtered = filtered.filter((c) => c.category === category);
      if (exactVersion) filtered = filtered.filter((c) => c.version === exactVersion);
      return Promise.resolve({ ok: true, value: filtered });
    },

    getComponent(
      _registryVersion: string,
      stableId: string,
      version: string,
    ): Promise<Result<ComponentArtifact, ProviderError>> {
      const found = artifacts.find((a) => a.stableId === stableId && a.version === version);
      if (!found) {
        return Promise.resolve({ ok: false, error: { code: "not_found", message: "Not found" } });
      }
      return Promise.resolve({ ok: true, value: found });
    },

    getComponentsForSearch(
      _registryVersion: string,
      category?: ComponentCategory,
      exactVersion?: string,
    ): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      let filtered = summaries;
      if (category) filtered = filtered.filter((c) => c.category === category);
      if (exactVersion) filtered = filtered.filter((c) => c.version === exactVersion);
      return Promise.resolve({ ok: true, value: filtered });
    },

    getDesignTokens(
      _registryVersion: string,
      exactVersion: string,
    ): Promise<Result<TokenArtifact, ProviderError>> {
      if (exactVersion === "1.0.0") {
        return Promise.resolve({ ok: true, value: tokenArtifact });
      }
      return Promise.resolve({ ok: false, error: { code: "not_found", message: "Not found" } });
    },

    getPublishedTokenVersions(): Promise<Result<readonly string[], ProviderError>> {
      return Promise.resolve({ ok: true, value: ["1.0.0"] });
    },

    getPublishedComponentRefs(
      _registryVersion: string,
      stableId: string,
    ): Promise<Result<readonly ArtifactRef[], ProviderError>> {
      const refs = artifacts
        .filter((a) => a.stableId === stableId)
        .map((a) => ({
          kind: "component" as const,
          stableId: a.stableId,
          version: a.version,
        }));
      return Promise.resolve({ ok: true, value: refs });
    },
  };

  return { provider, artifacts, summaries, tokenArtifact };
}

/**
 * Creates a no-op provider that tracks call counts.
 * All methods return immediately without await.
 */
export function createSpyProvider(): {
  provider: McpCatalogProvider;
  callCount: () => number;
} {
  let calls = 0;
  const provider: McpCatalogProvider = {
    verifiedSnapshot: true,
    listComponents(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      calls++;
      return Promise.resolve({ ok: true, value: [] });
    },
    getComponent(): Promise<Result<ComponentArtifact, ProviderError>> {
      calls++;
      return Promise.resolve({ ok: false, error: { code: "x", message: "x" } });
    },
    getComponentsForSearch(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      calls++;
      return Promise.resolve({ ok: true, value: [] });
    },
    getDesignTokens(): Promise<Result<TokenArtifact, ProviderError>> {
      calls++;
      return Promise.resolve({ ok: false, error: { code: "x", message: "x" } });
    },
    getPublishedTokenVersions(): Promise<Result<readonly string[], ProviderError>> {
      calls++;
      return Promise.resolve({ ok: true, value: [] });
    },
    getPublishedComponentRefs(): Promise<Result<readonly ArtifactRef[], ProviderError>> {
      calls++;
      return Promise.resolve({ ok: true, value: [] });
    },
  };
  return { provider, callCount: () => calls };
}

/**
 * Creates a provider that throws on all calls.
 */
export function createThrowingProvider(): McpCatalogProvider {
  return {
    verifiedSnapshot: true,
    listComponents(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
    getComponent(): Promise<Result<ComponentArtifact, ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
    getComponentsForSearch(): Promise<Result<readonly ComponentSummary[], ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
    getDesignTokens(): Promise<Result<TokenArtifact, ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
    getPublishedTokenVersions(): Promise<Result<readonly string[], ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
    getPublishedComponentRefs(): Promise<Result<readonly ArtifactRef[], ProviderError>> {
      return Promise.reject(new Error("connection failed"));
    },
  };
}
