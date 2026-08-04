import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface Manifest {
  name: string;
  license?: string;
  repository?: string;
  publishConfig?: { access?: string };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const boundaries = [
  "packages/schemas",
  "packages/catalog-core",
  "packages/tokens",
  "packages/components",
  "packages/registry-builder",
  "packages/cli",
  "packages/mcp-core",
  "packages/conformance",
  "packages/release-policy",
  "packages/self-hosting",
  "apps/docs",
  "services/public-api",
  "services/hosted-gateway",
] as const;

async function manifestAt(path: string): Promise<Manifest> {
  const source = await readFile(resolve(root, path, "package.json"), "utf8");
  const parsed: unknown = JSON.parse(source);
  return parsed as Manifest;
}

describe("public workspace scaffold", () => {
  it("contains every designed package boundary with public MIT metadata", async () => {
    const manifests = await Promise.all(boundaries.map(manifestAt));
    expect(manifests.map(({ name }) => name)).toHaveLength(
      new Set(manifests.map(({ name }) => name)).size,
    );
    for (const manifest of manifests) {
      expect(manifest.name).toMatch(/^@neuraforge-ui\/[a-z-]+$/u);
      expect(manifest.license).toBe("MIT");
      expect(manifest.repository).toBe("https://github.com/aqeel-spec/neuraforge.git");
      expect(manifest.publishConfig?.access).toBe("public");
      expect(manifest.name).not.toMatch(/private|premium|paid/u);
    }
  });
});
