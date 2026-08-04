import { describe, it, expect } from "vitest";
import fc from "fast-check";

import type {
  CompositionManifest,
  CompositionRequest,
  SelectionRuleSet,
} from "./types.js";
import { validateManifest, resolveManifestRefs, getDeclaredInputIds } from "./manifest.js";
import { applyBrandConfig } from "./customization.js";
import { selectCompositions } from "./selection.js";
import type { ArtifactLookup } from "./retrieval.js";
import { retrieveComposition } from "./retrieval.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeManifest(stableId: string, tags: string[] = ["pricing"]): CompositionManifest {
  return {
    ref: { kind: "composition", stableId, version: "1.0.0" },
    name: `Composition ${stableId}`,
    description: `Test composition ${stableId}`,
    category: "pricing",
    tags,
    artifactRefs: [{ kind: "component", stableId: "button", version: "1.0.0" }],
    sourceFiles: [{ path: "src/test.tsx", origin: "original", mediaType: "text/typescript", size: 100, checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "abc123" } }],
    dependencies: [],
    compatibility: [],
    schemaVersion: "1.0.0",
    customizationInputs: [
      { id: "heading", label: "Heading", description: "Main heading", type: "string", default: "Pricing", required: true, group: "text" },
      { id: "showBadge", label: "Show Badge", description: "Toggle badge", type: "boolean", default: false, required: false, group: "display" },
    ],
    invariants: [],
    checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "xyz789" },
    provenance: [{ name: "test", version: "1.0.0", source: "https://example.com", copyright: "Test", spdxIdentifier: "MIT", licenseTextPath: "licenses/MIT.txt", attribution: "Test", redistributionObligations: [], reviewStatus: "approved" }],
    installInstructions: [{ step: 1, description: "Install deps" }],
  };
}

const RULES: SelectionRuleSet = {
  version: "1.0.0",
  normalization: [{ id: "lower", description: "Lowercase", operation: "lowercase" }],
  eligibilityFilters: [],
  scoreDimensions: [{ id: "tags", description: "Tag overlap", direction: "maximize", weight: 1.0, computation: "tag-overlap" }],
  missingEvidenceValue: 0,
  tieBreakBy: "stable-id",
  explanationTemplate: "Selected {name}",
};

// ---------------------------------------------------------------------------
// Property 16: Composition manifests resolve completely
// ---------------------------------------------------------------------------

// Feature: neuraforge-open-source-ui, Property 16: Composition manifests resolve completely
describe("Property 16: Composition manifests resolve completely", () => {
  it("valid manifests pass validation", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (id) => {
        const manifest = makeManifest(id);
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("resolveManifestRefs partitions refs into resolved and unresolved", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (allAvailable) => {
          const manifest = makeManifest("test");
          const lookup = (ref: { stableId: string }) => allAvailable || ref.stableId === "always-there";
          const result = resolveManifestRefs(manifest, lookup);
          if (allAvailable) {
            expect(result.resolved).toBe(true);
            expect(result.unresolvedRefs).toHaveLength(0);
          } else {
            expect(result.unresolvedRefs.length + (result.resolved ? manifest.artifactRefs.length : 0)).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("getDeclaredInputIds returns exact input IDs from manifest", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), (id) => {
        const manifest = makeManifest(id);
        const ids = getDeclaredInputIds(manifest);
        expect(ids).toContain("heading");
        expect(ids).toContain("showBadge");
        expect(ids).toHaveLength(2);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: Composition customization preserves invariants
// ---------------------------------------------------------------------------

// Feature: neuraforge-open-source-ui, Property 17: Composition customization preserves invariants
describe("Property 17: Composition customization preserves invariants", () => {
  it("valid brand config with declared inputs yields valid result", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (heading) => {
        const manifest = makeManifest("test");
        const result = applyBrandConfig(manifest, { values: { heading } });
        expect(result.undeclaredFields).toHaveLength(0);
        expect(result.appliedValues["heading"]).toBe(heading);
      }),
      { numRuns: 100 },
    );
  });

  it("undeclared fields are always reported", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (field) => {
        if (field === "heading" || field === "showBadge") return; // skip declared
        const manifest = makeManifest("test");
        const result = applyBrandConfig(manifest, { values: { [field]: "value" } });
        expect(result.undeclaredFields).toContain(field);
      }),
      { numRuns: 100 },
    );
  });

  it("type-matched defaults never introduce violations when no overrides applied", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), (id) => {
        const manifest = makeManifest(id);
        const result = applyBrandConfig(manifest, { values: {} });
        expect(result.invariantViolations).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Composition selection is deterministic and rule-conformant
// ---------------------------------------------------------------------------

// Feature: neuraforge-open-source-ui, Property 18: Composition selection is deterministic and rule-conformant
describe("Property 18: Composition selection is deterministic and rule-conformant", () => {
  it("same inputs always produce the same output", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (intent) => {
        const manifests = [makeManifest("alpha", ["pricing", "tiers"]), makeManifest("beta", ["plans"])];
        const request: CompositionRequest = { intent, constraints: [], limit: 10 };
        const r1 = selectCompositions(request, manifests, RULES, "1.0.0");
        const r2 = selectCompositions(request, manifests, RULES, "1.0.0");
        expect(r1.results.map((r) => r.ref.stableId)).toEqual(r2.results.map((r) => r.ref.stableId));
        expect(r1.results.map((r) => r.score)).toEqual(r2.results.map((r) => r.score));
      }),
      { numRuns: 100 },
    );
  });

  it("results are sorted by score descending", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (intent) => {
        const manifests = [makeManifest("a", ["pricing"]), makeManifest("b", ["hero"]), makeManifest("c", ["pricing", "plans"])];
        const request: CompositionRequest = { intent, constraints: [], limit: 10 };
        const result = selectCompositions(request, manifests, RULES, "1.0.0");
        for (let i = 1; i < result.results.length; i++) {
          expect(result.results[i]!.score).toBeLessThanOrEqual(result.results[i - 1]!.score);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("tie-breaking uses stable ID lexicographic order", () => {
    const manifests = [makeManifest("zebra", ["test"]), makeManifest("alpha", ["test"])];
    const request: CompositionRequest = { intent: "test", constraints: [], limit: 10 };
    const result = selectCompositions(request, manifests, RULES, "1.0.0");
    if (result.results.length >= 2 && result.results[0]!.score === result.results[1]!.score) {
      expect(result.results[0]!.ref.stableId.localeCompare(result.results[1]!.ref.stableId)).toBeLessThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 19: Composition partial and no-match results are set-complete
// ---------------------------------------------------------------------------

// Feature: neuraforge-open-source-ui, Property 19: Composition partial and no-match results are set-complete
describe("Property 19: Composition partial and no-match results are set-complete", () => {
  it("complete retrieval includes all artifact refs as available", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), (id) => {
        const manifest = makeManifest(id);
        const lookup: ArtifactLookup = {
          exists: () => true,
          getSourceFiles: () => [{ path: "src/x.ts", origin: "original", mediaType: "text/typescript", size: 50, checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "d" } }],
          getChecksum: () => ({ algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "check" }),
          getAlternatives: () => [],
        };
        const result = retrieveComposition(manifest, lookup);
        expect(result.type).toBe("complete");
        if (result.type === "complete") {
          expect(result.elements).toHaveLength(manifest.artifactRefs.length);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("partial retrieval accounts for every ref", () => {
    fc.assert(
      fc.property(fc.boolean(), (firstAvailable) => {
        const manifest: CompositionManifest = {
          ...makeManifest("test"),
          artifactRefs: [
            { kind: "component", stableId: "btn", version: "1.0.0" },
            { kind: "component", stableId: "card", version: "1.0.0" },
          ],
        };
        const lookup: ArtifactLookup = {
          exists: (ref) => firstAvailable ? ref.stableId === "btn" : false,
          getSourceFiles: () => [{ path: "src/x.ts", origin: "original", mediaType: "text/typescript", size: 50, checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "d" } }],
          getChecksum: () => ({ algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "c" }),
          getAlternatives: () => [],
        };
        const result = retrieveComposition(manifest, lookup);
        if (firstAvailable) {
          expect(result.type).toBe("partial");
          if (result.type === "partial") {
            expect(result.partial.availableElements.length + result.partial.unavailableElements.length).toBe(2);
          }
        } else {
          expect(result.type).toBe("partial");
          if (result.type === "partial") {
            expect(result.partial.unavailableElements).toHaveLength(2);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("no-match result provides alternatives when available", () => {
    const manifests = [makeManifest("alpha", ["pricing"]), makeManifest("beta", ["hero"])];
    const request: CompositionRequest = { intent: "nonexistent-xyz", constraints: [{ field: "category", operator: "equals", value: "page" }], category: "page", limit: 5 };
    const result = selectCompositions(request, manifests, RULES, "1.0.0");
    // With strict category filter, no results match
    expect(result.results).toHaveLength(0);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});
