import type { Checksum, FileRecord, PerformanceRecord } from "@neuraforge-ui/schemas";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import { canonicalizeTextBytes, computeSha256Digest } from "@neuraforge-ui/catalog-core";
import type { ComponentCategory, ComponentRecord, PerformanceBudget } from "../contracts/types.js";

/**
 * Builds a FileRecord with a real SHA-256 checksum computed from source text.
 * Async because Web Crypto digest is async.
 */
export async function buildFileRecord(
  path: string,
  source: string,
  origin: "original" | "generated" = "original",
  mediaType = "text/typescript+jsx",
): Promise<FileRecord> {
  const bytes = canonicalizeTextBytes(source);
  const digest = await computeSha256Digest(bytes);
  const checksum: Checksum = {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };
  return {
    path,
    origin,
    mediaType,
    size: bytes.length,
    checksum,
  };
}

/**
 * Computes the component-level checksum from its source files' digests concatenated.
 */
export async function buildComponentChecksum(
  sourceFiles: readonly FileRecord[],
): Promise<Checksum> {
  const combined = sourceFiles.map((f) => f.checksum.digest).join("");
  const bytes = canonicalizeTextBytes(combined);
  const digest = await computeSha256Digest(bytes);
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION_VERSION,
    digest,
  };
}

/** Standard performance budget for component bundle size. */
export function bundleSizeBudget(maxKb: number): PerformanceBudget {
  return { metric: "bundle-size-gzip", threshold: maxKb, unit: "KB" };
}

/** Standard performance record for a passed bundle-size check. */
export function bundleSizeRecord(
  stableId: string,
  resultKb: number,
  thresholdKb: number,
): PerformanceRecord {
  return {
    artifact: { kind: "component", stableId, version: "1.0.0" },
    metric: "bundle-size-gzip",
    scenario: "production build, tree-shaken import",
    environment: {
      operatingSystem: "linux",
      runtime: "node 20.11.0",
      tools: { vite: "5.4.21", tailwindcss: "3.4.17" },
      prerequisites: ["npm install"],
      fixtures: [],
    },
    result: resultKb,
    threshold: thresholdKb,
    unit: "KB",
    command: "npm run build && npx bundlesize",
    status: "passed",
  };
}

/** MIT provenance for original NeuraForge source. */
export const MIT_PROVENANCE = {
  name: "@neuraforge-ui/components",
  version: "1.0.0",
  source: "https://github.com/neuraforge/ui",
  copyright: "Copyright 2024 NeuraForge Contributors",
  spdxIdentifier: "MIT",
  licenseTextPath: "LICENSE",
  attribution: "NeuraForge UI Contributors",
  redistributionObligations: ["include-license-text", "include-copyright-notice"],
  reviewStatus: "approved" as const,
};

/** Standard install instructions for a component. */
export function standardInstall(stableId: string): ComponentRecord["installation"] {
  return [
    {
      step: 1,
      description: `Install @neuraforge-ui/components`,
      command: "npm install @neuraforge-ui/components@1.0.0",
    },
    {
      step: 2,
      description: `Import ${stableId} from the package`,
      command: `import { ... } from '@neuraforge-ui/components';`,
    },
    { step: 3, description: "Ensure Tailwind CSS is configured in your project" },
  ];
}

/** Standard compatibility constraints. */
export const STANDARD_COMPATIBILITY: ComponentRecord["compatibility"] = [
  { targetType: "framework", name: "react", version: "19.0.0", status: "compatible" },
  { targetType: "tool", name: "tailwindcss", version: "3.4.17", status: "compatible" },
  { targetType: "runtime", name: "node", version: "20.11.0", status: "compatible" },
];

/** Standard peer dependencies. */
export const STANDARD_PEER_DEPS: ComponentRecord["peerDependencies"] = [
  { name: "react", version: "19.0.0", source: "https://www.npmjs.com/package/react" },
  { name: "react-dom", version: "19.0.0", source: "https://www.npmjs.com/package/react-dom" },
];

/** Standard dependency on schemas package. */
export const STANDARD_DEPS: ComponentRecord["dependencies"] = [
  { name: "@neuraforge-ui/schemas", version: "0.0.0", source: "https://github.com/neuraforge/ui" },
];

/** Creates a documentation path for a component. */
export function docPath(category: ComponentCategory, stableId: string): string {
  return `/docs/components/${category}/${stableId}`;
}
