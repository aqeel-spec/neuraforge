/**
 * Registry-builder tests: input validation and error accumulation.
 */

import { describe, it, expect } from "vitest";
import { buildReleaseBundle } from "../builder.js";
import { buildFixtureInput, computeTextChecksum, textByteLength } from "./fixtures.js";
import type { ReleaseBuildInput } from "../types.js";
import type { ProjectedComponentRecord } from "@neuraforge/components";

function getComponent(
  components: readonly ProjectedComponentRecord[],
  index: number,
): ProjectedComponentRecord {
  const c = components[index];
  if (!c) throw new Error(`No component at index ${String(index)}`);
  return c;
}

describe("validation: path confinement", () => {
  it("rejects absolute paths", async () => {
    const input = await buildFixtureInput();
    const badSource = "export const x = 1;\n";
    const badPath = "/etc/passwd";
    const badChecksum = await computeTextChecksum(badSource);
    const badSize = textByteLength(badSource);

    const modifiedContents = new Map(input.sourceContents);
    modifiedContents.set(badPath, badSource);

    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            path: badPath,
            origin: "original" as const,
            mediaType: "text/typescript+jsx",
            size: badSize,
            checksum: badChecksum,
          },
        ],
        checksum: badChecksum,
      },
    ];

    const modified: ReleaseBuildInput = {
      ...input,
      components: modifiedComponents,
      sourceContents: modifiedContents,
    };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "path_traversal")).toBe(true);
  });

  it("rejects paths with '..' segments", async () => {
    const input = await buildFixtureInput();
    const badSource = "export const x = 1;\n";
    const badPath = "src/../../../etc/shadow";
    const badChecksum = await computeTextChecksum(badSource);
    const badSize = textByteLength(badSource);

    const modifiedContents = new Map(input.sourceContents);
    modifiedContents.set(badPath, badSource);

    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            path: badPath,
            origin: "original" as const,
            mediaType: "text/typescript+jsx",
            size: badSize,
            checksum: badChecksum,
          },
        ],
        checksum: badChecksum,
      },
    ];

    const modified: ReleaseBuildInput = {
      ...input,
      components: modifiedComponents,
      sourceContents: modifiedContents,
    };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "path_traversal")).toBe(true);
  });

  it("rejects paths with backslashes", async () => {
    const input = await buildFixtureInput();
    const badSource = "export const x = 1;\n";
    const badPath = "src\\navigation\\bad.tsx";
    const badChecksum = await computeTextChecksum(badSource);
    const badSize = textByteLength(badSource);

    const modifiedContents = new Map(input.sourceContents);
    modifiedContents.set(badPath, badSource);

    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            path: badPath,
            origin: "original" as const,
            mediaType: "text/typescript+jsx",
            size: badSize,
            checksum: badChecksum,
          },
        ],
        checksum: badChecksum,
      },
    ];

    const modified: ReleaseBuildInput = {
      ...input,
      components: modifiedComponents,
      sourceContents: modifiedContents,
    };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "path_traversal")).toBe(true);
  });

  it("rejects drive-letter paths", async () => {
    const input = await buildFixtureInput();
    const badSource = "export const x = 1;\n";
    const badPath = "C:/Users/file.tsx";
    const badChecksum = await computeTextChecksum(badSource);
    const badSize = textByteLength(badSource);

    const modifiedContents = new Map(input.sourceContents);
    modifiedContents.set(badPath, badSource);

    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            path: badPath,
            origin: "original" as const,
            mediaType: "text/typescript+jsx",
            size: badSize,
            checksum: badChecksum,
          },
        ],
        checksum: badChecksum,
      },
    ];

    const modified: ReleaseBuildInput = {
      ...input,
      components: modifiedComponents,
      sourceContents: modifiedContents,
    };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "path_traversal")).toBe(true);
  });
});

describe("validation: duplicate refs/paths", () => {
  it("rejects duplicate stable IDs", async () => {
    const input = await buildFixtureInput();
    const first = getComponent(input.components, 0);
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      { ...last, ref: { ...last.ref, stableId: first.ref.stableId } },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "duplicate_stable_id")).toBe(true);
  });

  it("rejects duplicate source path entries within one component", async () => {
    const input = await buildFixtureInput();
    const first = getComponent(input.components, 0);
    const firstFile = first.sourceFiles[0];
    if (!firstFile) throw new Error("fixture requires a source file");
    const modifiedComponents = [
      { ...first, sourceFiles: [{ ...firstFile }, { ...firstFile }] },
      ...input.components.slice(1),
    ];

    const result = await buildReleaseBundle({ ...input, components: modifiedComponents });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((error) => error.code === "duplicate_path")).toBe(true);
  });

  it("rejects conflicting declarations for a shared source path", async () => {
    const input = await buildFixtureInput();
    const first = getComponent(input.components, 0);
    const last = getComponent(input.components, 19);
    const sharedPath = first.sourceFiles[0]?.path ?? "";
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            ...(last.sourceFiles[0] ??
              first.sourceFiles[0] ?? {
                path: "",
                origin: "original" as const,
                mediaType: "",
                size: 0,
                checksum: first.checksum,
              }),
            path: sharedPath,
          },
        ],
      },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "conflicting_path_declaration")).toBe(true);
  });

  it("accepts an identical source module shared by multiple component artifacts", async () => {
    const input = await buildFixtureInput();
    const first = getComponent(input.components, 0);
    const firstFile = first.sourceFiles[0];
    if (!firstFile) throw new Error("fixture requires a source file");
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      { ...last, sourceFiles: [{ ...firstFile }], checksum: { ...first.checksum } },
    ];

    const result = await buildReleaseBundle({ ...input, components: modifiedComponents });
    expect(result.success).toBe(true);
  });
});

describe("validation: checksum mismatches", () => {
  it("rejects mismatched source file checksum (mutated byte proves fail-closed)", async () => {
    const input = await buildFixtureInput();
    const firstPath = [...input.sourceContents.keys()][0] ?? "";
    const modifiedContents = new Map(input.sourceContents);
    // Mutate one byte
    modifiedContents.set(firstPath, (modifiedContents.get(firstPath) ?? "") + "X");

    const modified: ReleaseBuildInput = { ...input, sourceContents: modifiedContents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.errors.some((e) => e.code === "checksum_mismatch" || e.code === "size_mismatch"),
    ).toBe(true);
  });

  it("rejects a component checksum that does not match its canonical source file set", async () => {
    const input = await buildFixtureInput();
    const first = getComponent(input.components, 0);
    const modifiedComponents = [
      {
        ...first,
        checksum: { ...first.checksum, digest: "f".repeat(64) },
      },
      ...input.components.slice(1),
    ];

    const result = await buildReleaseBundle({ ...input, components: modifiedComponents });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((error) => error.code === "artifact_checksum_mismatch")).toBe(true);
  });

  it("rejects fake checksum (all zeros)", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const lastFile = last.sourceFiles[0] ?? {
      path: "",
      origin: "original" as const,
      mediaType: "",
      size: 0,
      checksum: last.checksum,
    };
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        sourceFiles: [
          {
            ...lastFile,
            checksum: {
              algorithm: "sha256" as const,
              canonicalization: "neuraforge-canonical-v1" as const,
              digest: "0".repeat(64),
            },
          },
        ],
        checksum: {
          algorithm: "sha256" as const,
          canonicalization: "neuraforge-canonical-v1" as const,
          digest: "0".repeat(64),
        },
      },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "checksum_mismatch")).toBe(true);
  });

  it("rejects missing source content for declared path", async () => {
    const input = await buildFixtureInput();
    const modifiedContents = new Map(input.sourceContents);
    const firstPath = [...modifiedContents.keys()][0] ?? "";
    modifiedContents.delete(firstPath);

    const modified: ReleaseBuildInput = { ...input, sourceContents: modifiedContents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "missing_source_content")).toBe(true);
  });
});

describe("validation: dependencies", () => {
  it("rejects version ranges in dependencies", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        dependencies: [{ name: "bad-dep", version: "^1.0.0", source: "https://npm.org" }],
      },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "version_range_forbidden")).toBe(true);
  });

  it("rejects 'latest' in peer dependencies", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        peerDependencies: [{ name: "react", version: "latest", source: "https://npm.org" }],
      },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "version_range_forbidden")).toBe(true);
  });
});

describe("validation: provenance and license", () => {
  it("rejects missing provenance", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const modifiedComponents = [...input.components.slice(0, 19), { ...last, provenance: [] }];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "missing_provenance")).toBe(true);
  });

  it("rejects unapproved license review", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const lastProv = last.provenance[0];
    if (!lastProv) throw new Error("missing provenance");
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      { ...last, provenance: [{ ...lastProv, reviewStatus: "pending" as const }] },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "unapproved_license")).toBe(true);
  });
});

describe("validation: docs and install steps", () => {
  it("rejects missing documentation path", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      { ...last, documentationPath: "" },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "missing_documentation_path")).toBe(true);
  });

  it("rejects unordered install steps", async () => {
    const input = await buildFixtureInput();
    const last = getComponent(input.components, 19);
    const modifiedComponents = [
      ...input.components.slice(0, 19),
      {
        ...last,
        installation: [
          { step: 3, description: "Third" },
          { step: 1, description: "First" },
          { step: 2, description: "Second" },
        ],
      },
    ];

    const modified: ReleaseBuildInput = { ...input, components: modifiedComponents };
    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.some((e) => e.code === "unordered_install_steps")).toBe(true);
  });
});

describe("validation: accumulates independent errors", () => {
  it("accumulates multiple independent errors", async () => {
    const input = await buildFixtureInput();
    const modified: ReleaseBuildInput = {
      ...input,
      registryVersion: "bad",
      releaseVersion: "also-bad",
      createdAt: "",
      licenseTextPath: "",
      copyrightNotices: [],
      thirdPartyNoticesPath: "",
    };

    const result = await buildReleaseBundle(modified);
    expect(result.success).toBe(false);
    if (result.success) return;
    // Should have multiple errors, not just the first
    expect(result.errors.length).toBeGreaterThan(3);
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("invalid_registry_version");
    expect(codes).toContain("invalid_release_version");
    expect(codes).toContain("invalid_created_at");
    expect(codes).toContain("missing_license_path");
    expect(codes).toContain("missing_copyright_notices");
    expect(codes).toContain("missing_third_party_notices");
  });
});
