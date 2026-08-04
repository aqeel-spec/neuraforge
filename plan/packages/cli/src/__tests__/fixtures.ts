/**
 * Shared test fixtures for CLI tests.
 *
 * Creates a minimal verified bundle and provides helper utilities.
 */

import { CANONICALIZATION_VERSION } from "@neuraforge/schemas";
import type { Checksum, ArtifactRef } from "@neuraforge/schemas";
import {
  canonicalizeTextBytes,
  computeSha256Digest,
  computeFileSetChecksum,
} from "@neuraforge/catalog-core";
import type { RegistryBundleReader, RegistryArtifactEntry } from "@neuraforge/registry-builder";
import type { ComponentSummaryFromBundle, NotFoundError } from "@neuraforge/registry-builder";
import type { Result } from "@neuraforge/schemas";
import type { ReadOnlyTarget, MutableTarget } from "../target.js";

// ---------------------------------------------------------------------------
// Checksum helpers
// ---------------------------------------------------------------------------

export async function makeChecksum(content: string): Promise<Checksum> {
  const bytes = canonicalizeTextBytes(content);
  const digest = await computeSha256Digest(bytes);
  return { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest };
}

export async function makeFileSetChecksum(
  files: { path: string; content: string }[],
): Promise<Checksum> {
  return computeFileSetChecksum(files);
}

// ---------------------------------------------------------------------------
// Mock component data
// ---------------------------------------------------------------------------

export const BUTTON_SOURCE = `import React from 'react';
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-500 text-white rounded">{children}</button>;
}
`;

export const BUTTON_STYLES = `.button { @apply px-4 py-2 bg-blue-500 text-white rounded; }
`;

// ---------------------------------------------------------------------------
// Create a mock RegistryArtifactEntry
// ---------------------------------------------------------------------------

export async function createMockEntry(): Promise<RegistryArtifactEntry> {
  const sourceChecksum = await makeChecksum(BUTTON_SOURCE);
  const stylesChecksum = await makeChecksum(BUTTON_STYLES);
  const artifactChecksum = await makeFileSetChecksum([
    { path: "Button.tsx", content: BUTTON_SOURCE },
    { path: "button.css", content: BUTTON_STYLES },
  ]);

  return {
    ref: { kind: "component", stableId: "button", version: "1.0.0" },
    category: "forms",
    name: "Button",
    description: "A styled button component for forms and actions",
    tags: ["button", "forms", "interactive"],
    status: "stable",
    sourceFiles: [
      {
        path: "Button.tsx",
        origin: "original",
        mediaType: "text/typescript",
        size: BUTTON_SOURCE.length,
        checksum: sourceChecksum,
        content: BUTTON_SOURCE,
      },
      {
        path: "button.css",
        origin: "original",
        mediaType: "text/css",
        size: BUTTON_STYLES.length,
        checksum: stylesChecksum,
        content: BUTTON_STYLES,
      },
    ],
    generatedFiles: [],
    dependencies: [{ name: "react", version: "19.0.0", source: "npm" }],
    peerDependencies: [],
    compatibility: [
      { targetType: "framework", name: "react", version: "19.0.0", status: "compatible" },
    ],
    installation: [
      { step: 1, description: "Copy component files to your project" },
      { step: 2, description: "Install dependencies", command: "npm install react@19.0.0" },
    ],
    checksum: artifactChecksum,
    provenance: [
      {
        name: "react",
        version: "19.0.0",
        source: "https://www.npmjs.com/package/react",
        copyright: "Copyright (c) Meta Platforms",
        spdxIdentifier: "MIT",
        licenseTextPath: "licenses/react.txt",
        attribution: "React - MIT License",
        redistributionObligations: ["include-license"],
        reviewStatus: "approved",
      },
    ],
    documentationPath: "docs/components/button.md",
    registryLocation: "registry/components/button/1.0.0",
  };
}

// ---------------------------------------------------------------------------
// Create a mock RegistryBundleReader
// ---------------------------------------------------------------------------

export async function createMockReader(): Promise<RegistryBundleReader> {
  const entry = await createMockEntry();

  const reader: RegistryBundleReader = {
    verifiedSnapshot: true,

    getSnapshot() {
      return {
        schemaVersion: "1.0.0",
        registryVersion: "1.0.0",
        releaseVersion: "1.0.0",
        status: "stable",
        createdAt: "2025-01-01T00:00:00.000Z",
        selectionRuleVersions: ["neuraforge-search-v1"],
        supportedTailwindVersions: ["3.4.17"],
        components: [entry],
        tokenArtifact: {
          schemaVersion: "1.0.0",
          releaseVersion: "1.0.0",
          tokenDocument: {
            schemaVersion: "1.0.0",
            releaseVersion: "1.0.0",
            ordering: "declaration" as const,
            tokens: {},
          },
          checksum: {
            algorithm: "sha256",
            canonicalization: CANONICALIZATION_VERSION,
            digest: "abc",
          },
          publications: {
            schemaVersions: ["1.0.0"],
            tokenReleaseVersions: ["1.0.0"],
            tailwindVersions: ["3.4.17"],
          },
          registryLocation: "registry/tokens/1.0.0",
        },
        requiredSurfaces: [],
        snapshotChecksum: {
          algorithm: "sha256",
          canonicalization: CANONICALIZATION_VERSION,
          digest: "snapshot",
        },
      };
    },

    listComponents(category?: string): readonly ComponentSummaryFromBundle[] {
      const comps = [entry];
      const filtered = category ? comps.filter((c) => c.category === category) : comps;
      return filtered.map((c) => ({
        stableId: c.ref.stableId,
        version: c.ref.version,
        name: c.name,
        description: c.description,
        category: c.category,
        tags: c.tags,
        checksum: c.checksum,
      }));
    },

    getComponent(stableId: string, version: string): Result<RegistryArtifactEntry, NotFoundError> {
      if (stableId === entry.ref.stableId && version === entry.ref.version) {
        return { ok: true, value: entry };
      }

      const alternatives: ArtifactRef[] = [];
      if (stableId === entry.ref.stableId) {
        alternatives.push(entry.ref);
      }

      return {
        ok: false,
        error: {
          code: "not_found",
          message: `Component '${stableId}@${version}' not found in this bundle`,
          alternatives,
        },
      };
    },

    getTokenArtifact() {
      return { ok: true, value: reader.getSnapshot().tokenArtifact };
    },
  };

  return reader;
}

// ---------------------------------------------------------------------------
// In-memory target (ReadOnly)
// ---------------------------------------------------------------------------

export function createMemoryReadOnlyTarget(files: Record<string, string>): ReadOnlyTarget {
  return {
    exists(path: string): Promise<boolean> {
      return Promise.resolve(path in files);
    },
    readFile(path: string): Promise<string | undefined> {
      return Promise.resolve(files[path]);
    },
    checksum(path: string): Promise<Checksum | undefined> {
      const content = files[path];
      if (content === undefined) return Promise.resolve(undefined);
      return makeChecksum(content);
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory target (Mutable)
// ---------------------------------------------------------------------------

export function createMemoryMutableTarget(
  files: Record<string, string>,
): MutableTarget & { readonly files: Record<string, string> } {
  return {
    files,
    exists(path: string): Promise<boolean> {
      return Promise.resolve(path in files);
    },
    readFile(path: string): Promise<string | undefined> {
      return Promise.resolve(files[path]);
    },
    checksum(path: string): Promise<Checksum | undefined> {
      const content = files[path];
      if (content === undefined) return Promise.resolve(undefined);
      return makeChecksum(content);
    },
    writeFile(path: string, content: string): Promise<void> {
      files[path] = content;
      return Promise.resolve();
    },
    deleteFile(path: string): Promise<void> {
      Reflect.deleteProperty(files, path);
      return Promise.resolve();
    },
    ensureDir(): Promise<void> {
      // No-op for in-memory
      return Promise.resolve();
    },
  };
}

// ---------------------------------------------------------------------------
// Throwing mutable target (for preview purity testing)
// ---------------------------------------------------------------------------

export function createThrowingMutableTarget(files: Record<string, string>): MutableTarget {
  const readOnly = createMemoryReadOnlyTarget(files);
  return {
    ...readOnly,
    writeFile(): Promise<void> {
      return Promise.reject(new Error("writeFile called during preview — MUTATION DETECTED"));
    },
    deleteFile(): Promise<void> {
      return Promise.reject(new Error("deleteFile called during preview — MUTATION DETECTED"));
    },
    ensureDir(): Promise<void> {
      return Promise.reject(new Error("ensureDir called during preview — MUTATION DETECTED"));
    },
  };
}
