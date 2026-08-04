/**
 * Integrity tests.
 *
 * Tests: source and artifact checksum substitution rejected before mutation.
 */

import { describe, it, expect } from "vitest";
import { CANONICALIZATION_VERSION } from "@neuraforge-ui/schemas";
import type { RegistryBundleReader, RegistryArtifactEntry } from "@neuraforge-ui/registry-builder";
import type { NotFoundError } from "@neuraforge-ui/registry-builder";
import type { Result } from "@neuraforge-ui/schemas";
import { createInstaller } from "../installer.js";
import { createMemoryReadOnlyTarget, BUTTON_SOURCE, makeChecksum } from "./fixtures.js";

describe("integrity verification", () => {
  it("rejects source file with tampered content (checksum mismatch)", async () => {
    // Create a reader with a file whose content doesn't match its declared checksum
    const realChecksum = await makeChecksum(BUTTON_SOURCE);
    const tamperedContent = "// TAMPERED CONTENT";

    const entry: RegistryArtifactEntry = {
      ref: { kind: "component", stableId: "button", version: "1.0.0" },
      category: "forms",
      name: "Button",
      description: "A button",
      tags: [],
      status: "stable",
      sourceFiles: [
        {
          path: "Button.tsx",
          origin: "original",
          mediaType: "text/typescript",
          size: tamperedContent.length,
          checksum: realChecksum, // checksum of original, but content is tampered
          content: tamperedContent,
        },
      ],
      generatedFiles: [],
      dependencies: [],
      peerDependencies: [],
      compatibility: [],
      installation: [],
      checksum: { algorithm: "sha256", canonicalization: CANONICALIZATION_VERSION, digest: "fake" },
      provenance: [],
      documentationPath: "",
      registryLocation: "registry/components/button/1.0.0",
    };

    const reader: RegistryBundleReader = {
      verifiedSnapshot: true,
      getSnapshot() {
        return {} as ReturnType<RegistryBundleReader["getSnapshot"]>;
      },
      listComponents() {
        return [];
      },
      getComponent(
        stableId: string,
        version: string,
      ): Result<RegistryArtifactEntry, NotFoundError> {
        if (stableId === "button" && version === "1.0.0") {
          return { ok: true, value: entry };
        }
        return { ok: false, error: { code: "not_found", message: "not found", alternatives: [] } };
      },
      getTokenArtifact() {
        return { ok: false, error: { code: "not_found", message: "", alternatives: [] } };
      },
    };

    const installerResult = createInstaller(reader);
    expect(installerResult.ok).toBe(true);
    if (!installerResult.ok) throw new Error("unreachable");
    const installer = installerResult.value;

    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");
  });

  it("rejects artifact with tampered file-set checksum", async () => {
    // Create a reader where individual file checksums are correct but artifact checksum is wrong
    const sourceChecksum = await makeChecksum(BUTTON_SOURCE);

    const entry: RegistryArtifactEntry = {
      ref: { kind: "component", stableId: "button", version: "1.0.0" },
      category: "forms",
      name: "Button",
      description: "A button",
      tags: [],
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
      ],
      generatedFiles: [],
      dependencies: [],
      peerDependencies: [],
      compatibility: [],
      installation: [],
      checksum: {
        algorithm: "sha256",
        canonicalization: CANONICALIZATION_VERSION,
        digest: "tampered-artifact-checksum",
      },
      provenance: [],
      documentationPath: "",
      registryLocation: "registry/components/button/1.0.0",
    };

    const reader: RegistryBundleReader = {
      verifiedSnapshot: true,
      getSnapshot() {
        return {} as ReturnType<RegistryBundleReader["getSnapshot"]>;
      },
      listComponents() {
        return [];
      },
      getComponent(
        stableId: string,
        version: string,
      ): Result<RegistryArtifactEntry, NotFoundError> {
        if (stableId === "button" && version === "1.0.0") {
          return { ok: true, value: entry };
        }
        return { ok: false, error: { code: "not_found", message: "not found", alternatives: [] } };
      },
      getTokenArtifact() {
        return { ok: false, error: { code: "not_found", message: "", alternatives: [] } };
      },
    };

    const installerResult = createInstaller(reader);
    expect(installerResult.ok).toBe(true);
    if (!installerResult.ok) throw new Error("unreachable");
    const installer = installerResult.value;

    const target = createMemoryReadOnlyTarget({});
    const result = await installer.preview(
      { stableId: "button", version: "1.0.0", destination: "src/components" },
      target,
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("integrity_failed");
    expect(result.error.message).toContain("Artifact checksum mismatch");
  });
});
