/**
 * @neuraforge-ui/docs — Public documentation site generator.
 *
 * Generates static pages from the Registry snapshot for:
 * - Component catalog (20 components across 6 categories)
 * - Design tokens and Tailwind theme configuration
 * - Motion presets and animated components
 * - 3D components with fallback documentation
 * - Curated compositions with customization guides
 * - MCP operation reference
 * - CLI usage guide
 * - Self-hosting guide
 * - API reference
 *
 * Built with Astro for static generation. Pages are versioned with the release.
 */

export const docsBoundary = {
  id: "docs",
  responsibility: "versioned public documentation site",
  publicSource: true,
} as const;

/** Page categories for documentation navigation. */
export type DocPageCategory =
  | "components"
  | "tokens"
  | "motion"
  | "three-d"
  | "compositions"
  | "api"
  | "cli"
  | "mcp"
  | "self-hosting"
  | "guides";

export const DOC_PAGE_CATEGORIES: readonly DocPageCategory[] = [
  "components",
  "tokens",
  "motion",
  "three-d",
  "compositions",
  "api",
  "cli",
  "mcp",
  "self-hosting",
  "guides",
] as const;

/** A generated documentation page entry. */
export interface DocPage {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: DocPageCategory;
  readonly version: string;
  readonly lastUpdated: string;
  readonly sourceLink: string;
}

/** Navigation structure for the docs site. */
export interface DocNavigation {
  readonly categories: readonly {
    readonly id: DocPageCategory;
    readonly label: string;
    readonly pages: readonly DocPage[];
  }[];
}

/** Generates the documentation navigation from registry data. */
export function generateNavigation(pages: readonly DocPage[]): DocNavigation {
  const categoryLabels: Record<DocPageCategory, string> = {
    components: "Components",
    tokens: "Design Tokens",
    motion: "Motion",
    "three-d": "3D Components",
    compositions: "Compositions",
    api: "API Reference",
    cli: "CLI",
    mcp: "MCP Operations",
    "self-hosting": "Self-Hosting",
    guides: "Guides",
  };

  return {
    categories: DOC_PAGE_CATEGORIES.map((id) => ({
      id,
      label: categoryLabels[id],
      pages: pages.filter((p) => p.category === id),
    })),
  };
}

/** Generates component documentation pages from the catalog. */
export function generateComponentPages(
  components: readonly {
    stableId: string;
    version: string;
    name: string;
    category: string;
    description: string;
  }[],
  releaseVersion: string,
): DocPage[] {
  return components.map((c) => ({
    slug: `components/${c.stableId}`,
    title: c.name,
    description: c.description,
    category: "components" as DocPageCategory,
    version: releaseVersion,
    lastUpdated: new Date().toISOString().split("T")[0]!,
    sourceLink: `packages/components/src/${c.category}/${c.stableId}.tsx`,
  }));
}

/** Generates motion preset documentation pages. */
export function generateMotionPages(
  presets: readonly { stableId: string; version: string; name: string; description: string }[],
  releaseVersion: string,
): DocPage[] {
  return presets.map((p) => ({
    slug: `motion/${p.stableId}`,
    title: p.name,
    description: p.description,
    category: "motion" as DocPageCategory,
    version: releaseVersion,
    lastUpdated: new Date().toISOString().split("T")[0]!,
    sourceLink: `packages/motion/src/presets/${p.stableId}.ts`,
  }));
}

/** Generates 3D component documentation pages. */
export function generateThreeDPages(
  components: readonly { stableId: string; version: string; name: string; description: string }[],
  releaseVersion: string,
): DocPage[] {
  return components.map((c) => ({
    slug: `three-d/${c.stableId}`,
    title: c.name,
    description: c.description,
    category: "three-d" as DocPageCategory,
    version: releaseVersion,
    lastUpdated: new Date().toISOString().split("T")[0]!,
    sourceLink: `packages/three-d/src/components/${c.stableId}.tsx`,
  }));
}

/** Generates composition documentation pages. */
export function generateCompositionPages(
  compositions: readonly {
    stableId: string;
    version: string;
    name: string;
    description: string;
    category: string;
  }[],
  releaseVersion: string,
): DocPage[] {
  return compositions.map((c) => ({
    slug: `compositions/${c.stableId}`,
    title: c.name,
    description: c.description,
    category: "compositions" as DocPageCategory,
    version: releaseVersion,
    lastUpdated: new Date().toISOString().split("T")[0]!,
    sourceLink: `packages/compositions/src/manifests/${c.stableId}.ts`,
  }));
}

/** Static pages that don't come from the registry. */
export function generateStaticPages(releaseVersion: string): DocPage[] {
  const today = new Date().toISOString().split("T")[0]!;
  return [
    {
      slug: "api/overview",
      title: "API Overview",
      description: "Public REST API reference",
      category: "api",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "services/public-api/src/router.ts",
    },
    {
      slug: "cli/getting-started",
      title: "CLI Getting Started",
      description: "Install, search, preview, and apply components",
      category: "cli",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "packages/cli/src/cli.ts",
    },
    {
      slug: "mcp/operations",
      title: "MCP Operations",
      description: "list_components, get_component, search_components, get_design_tokens",
      category: "mcp",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "packages/mcp-core/src/dispatcher.ts",
    },
    {
      slug: "self-hosting/setup",
      title: "Self-Hosting Setup",
      description: "Run the full stack yourself, offline",
      category: "self-hosting",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "packages/self-hosting/src/start.ts",
    },
    {
      slug: "tokens/overview",
      title: "Design Tokens",
      description: "Color, typography, spacing, and Tailwind theme generation",
      category: "tokens",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "packages/tokens/src/index.ts",
    },
    {
      slug: "guides/contributing",
      title: "Contributing",
      description: "How to contribute to NeuraForge UI",
      category: "guides",
      version: releaseVersion,
      lastUpdated: today,
      sourceLink: "CONTRIBUTING.md",
    },
  ];
}
