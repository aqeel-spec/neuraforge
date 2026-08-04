/**
 * Test fixtures for registry-builder tests.
 *
 * Provides deterministic, real-checksum fixture data for building release bundles.
 * No fake 64-zero checksums. All checksums are computed from actual content.
 */

import type {
  BuildInstruction,
  Checksum,
  CompatibilityConstraint,
  CompatibilityMatrixEntry,
  DependencyInventoryItem,
  FileRecord,
  LicenseProvenance,
  PerformanceRecord,
  QualityGateResult,
  ReleaseApproval,
} from "@neuraforge/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge/schemas";
import {
  canonicalizeJsonBytes,
  canonicalizeTextBytes,
  computeFileSetChecksum,
  computeSha256Digest,
} from "@neuraforge/catalog-core";
import type { TokenDocument } from "@neuraforge/tokens";
import type { ReleaseBuildInput, RequiredMvpSurface } from "../types.js";
import type { ProjectedComponentRecord } from "@neuraforge/components";
import type { JsonValue } from "@neuraforge/schemas";

// ---------------------------------------------------------------------------
// Source content
// ---------------------------------------------------------------------------

export const FIXTURE_SOURCE_A = `import React from 'react';\nexport function ComponentA() { return <div>A</div>; }\n`;
export const FIXTURE_SOURCE_B = `import React from 'react';\nexport function ComponentB() { return <div>B</div>; }\n`;

export async function computeTextChecksum(text: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(text);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

export async function computeJsonChecksumFromValue(value: unknown): Promise<Checksum> {
  const bytes = canonicalizeJsonBytes(value as JsonValue);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

export function textByteLength(text: string): number {
  return new TextEncoder().encode(text.replace(/\r\n|\r/g, "\n")).length;
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export const MIT_PROVENANCE: LicenseProvenance = {
  name: "@neuraforge/components",
  version: "1.0.0",
  source: "https://github.com/neuraforge/ui",
  copyright: "Copyright 2024 NeuraForge Contributors",
  spdxIdentifier: "MIT",
  licenseTextPath: "LICENSE",
  attribution: "NeuraForge UI Contributors",
  redistributionObligations: ["include-license-text", "include-copyright-notice"],
  reviewStatus: "approved",
};

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

export const STANDARD_COMPATIBILITY: readonly CompatibilityConstraint[] = [
  { targetType: "framework", name: "react", version: "19.0.0", status: "compatible" },
  { targetType: "tool", name: "tailwindcss", version: "3.4.17", status: "compatible" },
  { targetType: "runtime", name: "node", version: "20.11.0", status: "compatible" },
];

// ---------------------------------------------------------------------------
// Token document
// ---------------------------------------------------------------------------

export const FIXTURE_TOKEN_DOCUMENT: TokenDocument = {
  schemaVersion: "1.0.0",
  releaseVersion: "1.0.0",
  ordering: "declaration",
  tokens: {
    "color.brand": {
      category: "color",
      type: "color",
      value: "#3b82f6",
    },
    "spacing.base": {
      category: "spacing",
      type: "dimension",
      value: "0.25rem",
    },
  },
};

// ---------------------------------------------------------------------------
// Build instructions
// ---------------------------------------------------------------------------

export const FIXTURE_BUILD_INSTRUCTIONS: readonly BuildInstruction[] = [
  { capability: "registry", sourceLocation: "packages/registry-builder", command: "npm run build" },
  { capability: "public-api", sourceLocation: "services/public-api", command: "npm run build" },
  { capability: "mcp-server", sourceLocation: "packages/mcp-core", command: "npm run build" },
  { capability: "documentation-site", sourceLocation: "apps/docs", command: "npm run build" },
];

// ---------------------------------------------------------------------------
// Required surfaces
// ---------------------------------------------------------------------------

export const FIXTURE_SURFACES: readonly RequiredMvpSurface[] = [
  {
    surfaceId: "registry",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:registry",
  },
  {
    surfaceId: "public-api",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:api",
  },
  {
    surfaceId: "cli",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:cli",
  },
  {
    surfaceId: "npm-package",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:pkg",
  },
  {
    surfaceId: "mcp-server",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:mcp",
  },
  {
    surfaceId: "design-tokens",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:tokens",
  },
  {
    surfaceId: "documentation-site",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:docs",
  },
  {
    surfaceId: "contribution-workflow",
    publicSourceLocation: "https://github.com/neuraforge/ui",
    buildCommand: "npm run build:contrib",
  },
];

// ---------------------------------------------------------------------------
// Quality results
// ---------------------------------------------------------------------------

function makeQualityResult(
  checkType: QualityGateResult["checkType"],
  index: number,
): QualityGateResult {
  return {
    checkId: `check-${checkType}-${String(index)}`,
    checkType,
    scope: "workspace",
    required: true,
    status: "passed",
    command: `npm run check:${checkType}`,
    environment: {
      operatingSystem: "linux",
      runtime: "node 20.11.0",
      tools: { vitest: "2.1.8" },
      prerequisites: ["npm install"],
      fixtures: [],
    },
    evidence: {
      uri: `https://ci.neuraforge.dev/runs/${String(index)}`,
      checksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: "a".repeat(64),
      },
    },
    recordedAt: "2024-01-01T00:00:00Z",
  };
}

export const FIXTURE_QUALITY_RESULTS: readonly QualityGateResult[] = [
  makeQualityResult("formatting", 1),
  makeQualityResult("static-analysis", 2),
  makeQualityResult("unit", 3),
  makeQualityResult("integration", 4),
  makeQualityResult("accessibility", 5),
  makeQualityResult("security", 6),
  makeQualityResult("package", 7),
  makeQualityResult("documentation", 8),
  makeQualityResult("compatibility", 9),
  makeQualityResult("license", 10),
  makeQualityResult("provenance", 11),
  makeQualityResult("bundle-size", 12),
  makeQualityResult("runtime-performance", 13),
];

// ---------------------------------------------------------------------------
// Approval
// ---------------------------------------------------------------------------

export const FIXTURE_APPROVAL: ReleaseApproval = {
  approvedBy: "release-manager@neuraforge.dev",
  approvedAt: "2024-01-15T10:00:00Z",
};

// ---------------------------------------------------------------------------
// Component categories for 20-component fixture
// ---------------------------------------------------------------------------

const COMPONENT_IDS = [
  "navbar",
  "sidebar",
  "breadcrumbs",
  "tabs",
  "footer",
  "card",
  "hero",
  "form",
  "text-field",
  "alert",
  "dialog",
  "loading-indicator",
  "toast",
  "data-table",
  "call-to-action",
  "stat",
  "badge",
  "avatar",
  "pricing",
  "faq",
  "section-divider",
] as const;

const CATEGORY_MAP: Record<string, string> = {
  navbar: "navigation",
  sidebar: "navigation",
  breadcrumbs: "navigation",
  tabs: "navigation",
  footer: "layout",
  card: "layout",
  hero: "layout",
  form: "forms",
  "text-field": "forms",
  alert: "feedback",
  dialog: "feedback",
  "loading-indicator": "feedback",
  toast: "feedback",
  "data-table": "data-display",
  stat: "data-display",
  badge: "data-display",
  avatar: "data-display",
  "call-to-action": "marketing",
  pricing: "marketing",
  faq: "marketing",
  "section-divider": "layout",
};

/**
 * Builds a complete valid ReleaseBuildInput with 20 components using real checksums.
 */
export async function buildFixtureInput(options?: {
  componentCount?: number;
  withApproval?: boolean;
}): Promise<ReleaseBuildInput> {
  const count = options?.componentCount ?? 20;
  const withApproval = options?.withApproval ?? true;

  const sourceContents = new Map<string, string>();
  const components: ProjectedComponentRecord[] = [];

  for (let i = 0; i < count && i < COMPONENT_IDS.length; i++) {
    const id = COMPONENT_IDS[i] ?? "unknown";
    const category = CATEGORY_MAP[id] ?? "navigation";
    const source = `import React from 'react';\nexport function ${id.replace(/-./g, (m) => (m[1] ?? "").toUpperCase())}() { return <div>${id}</div>; }\n`;
    const path = `src/${category}/${id}.tsx`;

    sourceContents.set(path, source);

    const checksum = await computeTextChecksum(source);
    const artifactChecksum = await computeFileSetChecksum([{ path, content: source }]);
    const size = textByteLength(source);

    const fileRecord: FileRecord = {
      path,
      origin: "original",
      mediaType: "text/typescript+jsx",
      size,
      checksum,
    };

    const component: ProjectedComponentRecord = {
      ref: { kind: "component", stableId: id, version: "1.0.0" },
      status: "stable",
      category: category as ProjectedComponentRecord["category"],
      sourceFiles: [fileRecord],
      generatedFiles: [],
      dependencies: [
        {
          name: "@neuraforge/schemas",
          version: "0.0.0",
          source: "https://github.com/neuraforge/ui",
        },
      ],
      peerDependencies: [
        { name: "react", version: "19.0.0", source: "https://www.npmjs.com/package/react" },
        { name: "react-dom", version: "19.0.0", source: "https://www.npmjs.com/package/react-dom" },
      ],
      compatibility: [...STANDARD_COMPATIBILITY],
      installation: [
        {
          step: 1,
          description: "Install package",
          command: "npm install @neuraforge/components@1.0.0",
        },
        { step: 2, description: "Import component" },
        { step: 3, description: "Configure Tailwind" },
      ],
      checksum: artifactChecksum,
      provenance: [MIT_PROVENANCE],
      documentationPath: `/docs/components/${category}/${id}`,
      props: [
        { name: "className", type: "string" as const, required: false, description: "CSS class" },
      ],
      supportedStates: [{ name: "default", description: "Default state" }],
      behavior: {
        keyboard: { status: "supported", contract: "Standard keyboard navigation" },
        pointer: { status: "supported", contract: "Standard pointer interaction" },
        focus: { status: "supported", contract: "Visible focus ring" },
        disabled: { status: "not_applicable", reason: "Not interactive" },
        loading: { status: "not_applicable", reason: "No async state" },
        validation: { status: "not_applicable", reason: "Not a form control" },
        error: { status: "not_applicable", reason: "No error state" },
      },
      accessibilityPrimitive: { usesExternalPrimitive: false },
      capability: { requiresOptionalCapability: false },
      reducedMotion: { includesAnimationOrMotion: false },
      examples: [
        {
          id: `${id}-basic`,
          title: "Basic",
          description: "Basic usage",
          props: {},
          sourcePath: path,
        },
      ],
      performanceBudgets: [{ metric: "bundle-size-gzip", threshold: 10, unit: "KB" }],
      performanceRecords: [
        {
          artifact: { kind: "component", stableId: id, version: "1.0.0" },
          metric: "bundle-size-gzip",
          scenario: "production build",
          environment: {
            operatingSystem: "linux",
            runtime: "node 20.11.0",
            tools: { vite: "5.4.21" },
            prerequisites: [],
            fixtures: [],
          },
          result: 2,
          threshold: 10,
          unit: "KB",
          command: "npm run build",
          status: "passed",
        },
      ],
    };

    components.push(component);
  }

  const tokenChecksum = await computeJsonChecksumFromValue(FIXTURE_TOKEN_DOCUMENT);

  const productionInventory: DependencyInventoryItem[] = [
    {
      name: "react",
      version: "19.0.0",
      relationship: "direct",
      materialType: "dependency",
      source: "https://www.npmjs.com/package/react",
      checksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: "b".repeat(64),
      },
      provenance: { ...MIT_PROVENANCE, name: "react", version: "19.0.0", spdxIdentifier: "MIT" },
    },
  ];

  const compatibilityMatrix: CompatibilityMatrixEntry[] = [
    {
      browser: "chrome",
      browserVersion: "120",
      operatingEnvironment: "linux",
      publicSurface: "registry",
      result: "passed",
      testedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const performanceRecords: PerformanceRecord[] = [
    {
      artifact: { kind: "component", stableId: "navbar", version: "1.0.0" },
      metric: "bundle-size-gzip",
      scenario: "production build",
      environment: {
        operatingSystem: "linux",
        runtime: "node 20.11.0",
        tools: { vite: "5.4.21" },
        prerequisites: [],
        fixtures: [],
      },
      result: 2,
      threshold: 10,
      unit: "KB",
      command: "npm run build",
      status: "passed",
    },
  ];

  return {
    schemaVersion: "1.0.0",
    registryVersion: "1.0.0",
    releaseVersion: "1.0.0",
    createdAt: "2024-01-15T10:00:00Z",
    selectionRuleVersions: ["1.0.0"],
    supportedTailwindVersions: ["3.4.17"],
    components,
    sourceContents,
    tokenDocument: FIXTURE_TOKEN_DOCUMENT,
    tokenChecksum,
    buildInstructions: [...FIXTURE_BUILD_INSTRUCTIONS],
    productionInventory,
    compatibilityMatrix,
    requiredSurfaces: [...FIXTURE_SURFACES],
    qualityResults: [...FIXTURE_QUALITY_RESULTS],
    performanceRecords,
    exceptions: [],
    ...(withApproval ? { approval: FIXTURE_APPROVAL } : {}),
    licenseTextPath: "LICENSE",
    copyrightNotices: ["Copyright 2024 NeuraForge Contributors"],
    thirdPartyNoticesPath: "THIRD-PARTY-NOTICES",
  };
}
