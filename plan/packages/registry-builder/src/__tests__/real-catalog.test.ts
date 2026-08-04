import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { getStableComponentCatalog, projectComponentRecord } from "@neuraforge-ui/components";
import { buildReleaseBundle } from "../builder.js";
import { verifyReleaseBundle } from "../verify.js";
import { buildFixtureInput } from "./fixtures.js";

describe("actual MVP component catalog integration", () => {
  it("builds and verifies the exact 20-component catalog with shared source modules", async () => {
    const records = await getStableComponentCatalog();
    const components = records.map((record) => projectComponentRecord(record));
    const sourceContents = new Map<string, string>();

    for (const component of components) {
      for (const file of component.sourceFiles) {
        if (!sourceContents.has(file.path)) {
          sourceContents.set(
            file.path,
            await readFile(new URL(`../../../components/${file.path}`, import.meta.url), "utf8"),
          );
        }
      }
    }

    const base = await buildFixtureInput();
    const result = await buildReleaseBundle({ ...base, components, sourceContents });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.bundle.snapshot.components).toHaveLength(20);
    expect(new Set(result.bundle.snapshot.components.map((entry) => entry.category)).size).toBe(6);
    expect(await verifyReleaseBundle(result.bundle)).toEqual({ valid: true, mismatches: [] });
  });
});
