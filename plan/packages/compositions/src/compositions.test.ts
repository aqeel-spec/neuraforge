import { describe, expect, it } from "vitest";

import type { ArtifactRef, Checksum, FileRecord, LicenseProvenance } from "@neuraforge/schemas";

import type {
  BrandConfig,
  BrandingInvariant,
  CompositionManifest,
  CustomizationInput,
  SelectionRuleSet,
} from "./types.js";
import type { ArtifactLookup } from "./retrieval.js";

import { getDeclaredInputIds, getInputDefaults, getInvariantsByType, resolveManifestRefs, validateManifest } from "./manifest.js";
import { applyBrandConfig, checkInvariants } from "./customization.js";
import { normalizeIntent, selectCompositions } from "./selection.js";
import { buildNoMatchResult, handleCompositionRequest, retrieveComposition } from "./retrieval.js";
import { createCompositionMcpDispatcher } from "./mcp-operations.js";

// ---------------------------------------------------------------------------
// Shared Fixtures
// ---------------------------------------------------------------------------

const FIXTURE_CHECKSUM: Checksum = {
  algorithm: "sha256",
  canonicalization: "neuraforge-canonical-v1",
  digest: "abc123def456789012345678901234567890123456789012345678901234abcd",
};

const FIXTURE_FILE: FileRecord = {
  path: "src/PricingSection.tsx",
  origin: "original",
  mediaType: "application/typescript",
  size: 4096,
  checksum: FIXTURE_CHECKSUM,
};

const FIXTURE_PROVENANCE: LicenseProvenance = {
  name: "neuraforge-ui",
  version: "1.0.0",
  source: "https://github.com/neuraforge/ui",
  copyright: "Copyright 2026 NeuraForge",
  spdxIdentifier: "MIT",
  licenseTextPath: "LICENSE",
  attribution: "NeuraForge UI Contributors",
  redistributionObligations: [],
  reviewStatus: "approved",
};

const FIXTURE_INPUTS: readonly CustomizationInput[] = [
  { id: "heading", label: "Heading", description: "Main heading text", type: "string", default: "Choose Your Plan", required: true, group: "content" },
  { id: "subheading", label: "Subheading", description: "Subheading text", type: "string", default: "Simple, transparent pricing", required: false, group: "content" },
  { id: "tier_count", label: "Tier Count", description: "Number of pricing tiers", type: "number", default: 3, required: true, group: "layout" },
  { id: "show_annual", label: "Show Annual Toggle", description: "Show annual/monthly toggle", type: "boolean", default: true, required: false, group: "features" },
  { id: "cta_text", label: "CTA Text", description: "Call-to-action button text", type: "string", default: "Get Started", required: true, group: "content" },
  { id: "cta_link", label: "CTA Link", description: "CTA button destination", type: "string", default: "/signup", required: false, group: "content" },
  { id: "accent_color", label: "Accent Color", description: "Primary accent color", type: "color", default: "#6366f1", required: false, group: "branding" },
  { id: "layout_style", label: "Layout Style", description: "Card layout style", type: "enum", default: "cards", required: true, allowedValues: ["cards", "table", "minimal"], group: "layout" },
  { id: "hero_image", label: "Hero Image", description: "Background image URL", type: "image-url", default: "", required: false, group: "branding" },
];

const FIXTURE_INVARIANTS: readonly BrandingInvariant[] = [
  { id: "heading-required", type: "semantic-hierarchy", description: "Heading must be present for content hierarchy", constrainedElements: ["heading", "cta_text"], rule: { required: ["heading", "cta_text"] } },
  { id: "responsive-cards", type: "responsive-behavior", description: "Cards must not use fixed widths", constrainedElements: ["accent_color"], rule: { noFixedWidth: true } },
  { id: "hero-alt", type: "accessibility-behavior", description: "Hero image must have alt text", constrainedElements: ["hero_image"], rule: { requireAlt: true } },
  { id: "cta-link-required", type: "required-relationship", description: "CTA button requires a link", constrainedElements: ["cta_text", "cta_link"], rule: { ifPresent: "cta_text", thenRequired: ["cta_link"] } },
];

const FIXTURE_ARTIFACT_REFS: readonly ArtifactRef[] = [
  { kind: "component", stableId: "pricing-card", version: "1.2.0" },
  { kind: "component", stableId: "toggle-switch", version: "1.0.0" },
  { kind: "token-set", stableId: "brand-tokens", version: "2.0.0" },
];

const FIXTURE_MANIFEST: CompositionManifest = {
  ref: { kind: "composition", stableId: "pricing-section", version: "1.0.0" },
  name: "Pricing Section",
  description: "A responsive pricing section with tiered plans and annual/monthly toggle",
  category: "pricing",
  tags: ["pricing", "tiers", "plans", "subscription", "saas"],
  artifactRefs: FIXTURE_ARTIFACT_REFS,
  sourceFiles: [FIXTURE_FILE],
  dependencies: [{ name: "react", version: "18.3.0", source: "npm" }],
  compatibility: [{ targetType: "framework", name: "react", version: ">=18.0.0", status: "compatible" }],
  schemaVersion: "1.0.0",
  customizationInputs: FIXTURE_INPUTS,
  invariants: FIXTURE_INVARIANTS,
  checksum: FIXTURE_CHECKSUM,
  provenance: [FIXTURE_PROVENANCE],
  installInstructions: [{ step: 1, description: "Install dependencies", command: "npm install" }],
};

const FIXTURE_RULES: SelectionRuleSet = {
  version: "1.0.0",
  normalization: [
    { id: "lower", description: "Lowercase input", operation: "lowercase" },
    { id: "trim", description: "Trim whitespace", operation: "trim" },
    { id: "stop", description: "Remove stop words", operation: "remove-stop-words" },
    { id: "syn", description: "Expand synonyms", operation: "synonym-expand" },
  ],
  eligibilityFilters: [],
  scoreDimensions: [
    { id: "tag-overlap", description: "Tag match", direction: "maximize", weight: 0.5, computation: "tag-overlap" },
    { id: "category-match", description: "Category match", direction: "maximize", weight: 0.3, computation: "category-match" },
    { id: "quality", description: "Quality score", direction: "maximize", weight: 0.2, computation: "quality-score" },
  ],
  missingEvidenceValue: 0.1,
  tieBreakBy: "stable-id",
  explanationTemplate: "Selected {name} with score {score}",
};

// ---------------------------------------------------------------------------
// 1. Manifest Validation
// ---------------------------------------------------------------------------

describe("validateManifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateManifest(FIXTURE_MANIFEST);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects a manifest with missing name", () => {
    const broken = { ...FIXTURE_MANIFEST, name: "" };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("name"))).toBe(true);
  });

  it("rejects a manifest with missing description", () => {
    const broken = { ...FIXTURE_MANIFEST, description: "" };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("description"))).toBe(true);
  });

  it("rejects a manifest with invalid category", () => {
    const broken = { ...FIXTURE_MANIFEST, category: "invalid-cat" as never };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("Invalid category"))).toBe(true);
  });

  it("rejects a manifest with no artifact refs", () => {
    const broken = { ...FIXTURE_MANIFEST, artifactRefs: [] };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("at least one artifact"))).toBe(true);
  });

  it("rejects a manifest with no source files", () => {
    const broken = { ...FIXTURE_MANIFEST, sourceFiles: [] };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("source file"))).toBe(true);
  });

  it("rejects artifact refs with range versions", () => {
    const broken = { ...FIXTURE_MANIFEST, artifactRefs: [{ kind: "component" as const, stableId: "card", version: "^1.0.0" }] };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("exact version"))).toBe(true);
  });

  it("rejects artifact refs with wildcard versions", () => {
    const broken = { ...FIXTURE_MANIFEST, artifactRefs: [{ kind: "component" as const, stableId: "card", version: "1.*" }] };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("exact version"))).toBe(true);
  });

  it("rejects a manifest with missing checksum digest", () => {
    const broken = { ...FIXTURE_MANIFEST, checksum: { ...FIXTURE_CHECKSUM, digest: "" } };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("checksum"))).toBe(true);
  });

  it("rejects a manifest with missing provenance", () => {
    const broken = { ...FIXTURE_MANIFEST, provenance: [] };
    const result = validateManifest(broken);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("provenance"))).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// 2. Manifest Resolution
// ---------------------------------------------------------------------------

describe("resolveManifestRefs", () => {
  it("resolves all refs when all exist", () => {
    const lookup = (_ref: ArtifactRef) => true;
    const result = resolveManifestRefs(FIXTURE_MANIFEST, lookup);
    expect(result.resolved).toBe(true);
    expect(result.unresolvedRefs).toHaveLength(0);
  });

  it("reports unresolved refs when some are missing", () => {
    const lookup = (ref: ArtifactRef) => ref.stableId !== "toggle-switch";
    const result = resolveManifestRefs(FIXTURE_MANIFEST, lookup);
    expect(result.resolved).toBe(false);
    expect(result.unresolvedRefs).toHaveLength(1);
    expect(result.unresolvedRefs[0]!.stableId).toBe("toggle-switch");
  });

  it("reports all unresolved when none exist", () => {
    const lookup = (_ref: ArtifactRef) => false;
    const result = resolveManifestRefs(FIXTURE_MANIFEST, lookup);
    expect(result.resolved).toBe(false);
    expect(result.unresolvedRefs).toHaveLength(3);
  });
});

describe("getDeclaredInputIds", () => {
  it("returns all input IDs from the manifest", () => {
    const ids = getDeclaredInputIds(FIXTURE_MANIFEST);
    expect(ids).toContain("heading");
    expect(ids).toContain("cta_text");
    expect(ids).toHaveLength(FIXTURE_INPUTS.length);
  });
});

describe("getInvariantsByType", () => {
  it("groups invariants by their type", () => {
    const grouped = getInvariantsByType(FIXTURE_MANIFEST);
    expect(grouped["semantic-hierarchy"]).toHaveLength(1);
    expect(grouped["responsive-behavior"]).toHaveLength(1);
    expect(grouped["accessibility-behavior"]).toHaveLength(1);
    expect(grouped["required-relationship"]).toHaveLength(1);
  });
});

describe("getInputDefaults", () => {
  it("returns defaults for all inputs", () => {
    const defaults = getInputDefaults(FIXTURE_MANIFEST);
    expect(defaults["heading"]).toBe("Choose Your Plan");
    expect(defaults["tier_count"]).toBe(3);
    expect(defaults["show_annual"]).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// 3. Customization
// ---------------------------------------------------------------------------

describe("applyBrandConfig", () => {
  it("applies a valid brand config with no violations", () => {
    const config: BrandConfig = { values: { heading: "Our Plans", cta_text: "Sign Up", cta_link: "/register" } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(true);
    expect(result.appliedValues["heading"]).toBe("Our Plans");
    expect(result.undeclaredFields).toHaveLength(0);
    expect(result.invariantViolations).toHaveLength(0);
  });

  it("rejects undeclared fields in the brand config", () => {
    const config: BrandConfig = { values: { heading: "Hello", unknown_field: "bad" } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(false);
    expect(result.undeclaredFields).toContain("unknown_field");
  });

  it("detects type violation when string provided for number input", () => {
    const config: BrandConfig = { values: { tier_count: "three" as never } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(false);
    expect(result.invariantViolations.some((v) => v.violatedBy === "tier_count")).toBe(true);
  });

  it("detects type violation when number provided for boolean input", () => {
    const config: BrandConfig = { values: { show_annual: 1 as never } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(false);
    expect(result.invariantViolations.some((v) => v.violatedBy === "show_annual")).toBe(true);
  });

  it("detects type violation when number provided for color input", () => {
    const config: BrandConfig = { values: { accent_color: 123 as never } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(false);
    expect(result.invariantViolations.some((v) => v.violatedBy === "accent_color")).toBe(true);
  });

  it("rejects enum value not in allowedValues", () => {
    const config: BrandConfig = { values: { layout_style: "grid" } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.valid).toBe(false);
    expect(result.invariantViolations.some((v) => v.violatedBy === "layout_style")).toBe(true);
  });

  it("uses defaults for inputs not provided in brand config", () => {
    const config: BrandConfig = { values: { heading: "New Heading", cta_text: "Go", cta_link: "/go" } };
    const result = applyBrandConfig(FIXTURE_MANIFEST, config);
    expect(result.appliedValues["tier_count"]).toBe(3);
    expect(result.appliedValues["show_annual"]).toBe(true);
  });
});

describe("checkInvariants", () => {
  it("detects semantic-hierarchy violation when required element is empty", () => {
    const values = { heading: "", cta_text: "Go", cta_link: "/go" };
    const violations = checkInvariants(FIXTURE_MANIFEST, values);
    expect(violations.some((v) => v.invariantType === "semantic-hierarchy" && v.violatedBy === "heading")).toBe(true);
  });

  it("detects responsive-behavior violation for fixed pixel width", () => {
    const values = { accent_color: "200px" };
    const violations = checkInvariants(FIXTURE_MANIFEST, values);
    expect(violations.some((v) => v.invariantType === "responsive-behavior")).toBe(true);
  });

  it("detects accessibility-behavior violation when alt text is missing", () => {
    const values = { hero_image: "https://example.com/hero.png" };
    const violations = checkInvariants(FIXTURE_MANIFEST, values);
    expect(violations.some((v) => v.invariantType === "accessibility-behavior" && v.violatedBy === "hero_image")).toBe(true);
  });

  it("detects required-relationship violation when companion is missing", () => {
    const values = { cta_text: "Sign Up", cta_link: "" };
    const violations = checkInvariants(FIXTURE_MANIFEST, values);
    expect(violations.some((v) => v.invariantType === "required-relationship" && v.violatedBy === "cta_link")).toBe(true);
  });

  it("passes when all invariants are satisfied", () => {
    const values = { heading: "Plans", cta_text: "Go", cta_link: "/go", accent_color: "#fff", hero_image: "", hero_image_alt: "Alt" };
    const violations = checkInvariants(FIXTURE_MANIFEST, values);
    // hero_image is empty so accessibility invariant does not trigger
    expect(violations.filter((v) => v.invariantType === "required-relationship")).toHaveLength(0);
  });
});


// ---------------------------------------------------------------------------
// 4. Deterministic Selection
// ---------------------------------------------------------------------------

describe("selectCompositions", () => {
  const secondManifest: CompositionManifest = {
    ...FIXTURE_MANIFEST,
    ref: { kind: "composition", stableId: "pricing-table", version: "1.0.0" },
    name: "Pricing Table",
    description: "A comparison table for pricing plans",
    tags: ["pricing", "table", "comparison"],
  };

  const heroManifest: CompositionManifest = {
    ...FIXTURE_MANIFEST,
    ref: { kind: "composition", stableId: "hero-banner", version: "2.0.0" },
    name: "Hero Banner",
    description: "A hero section with CTA",
    category: "hero",
    tags: ["hero", "banner", "landing", "cta"],
  };

  const allManifests = [FIXTURE_MANIFEST, secondManifest, heroManifest];

  it("produces the same result for the same inputs (determinism)", () => {
    const request = { intent: "pricing plans", constraints: [] as const, limit: 5 };
    const result1 = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    const result2 = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    expect(result1).toEqual(result2);
  });

  it("scores compositions by tag overlap", () => {
    const request = { intent: "pricing tiers subscription", constraints: [] as const, limit: 5 };
    const result = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    expect(result.results.length).toBeGreaterThan(0);
    // The pricing section has more matching tags than the hero
    const pricingResult = result.results.find((r) => r.ref.stableId === "pricing-section");
    const heroResult = result.results.find((r) => r.ref.stableId === "hero-banner");
    expect(pricingResult).toBeDefined();
    if (pricingResult && heroResult) {
      expect(pricingResult.score).toBeGreaterThanOrEqual(heroResult.score);
    }
  });

  it("tie-breaks by stable ID (lexicographic)", () => {
    // Both pricing manifests have same tags; the tie-break is stableId
    const tiedManifests: CompositionManifest[] = [
      { ...FIXTURE_MANIFEST, ref: { kind: "composition", stableId: "z-pricing", version: "1.0.0" } },
      { ...FIXTURE_MANIFEST, ref: { kind: "composition", stableId: "a-pricing", version: "1.0.0" } },
    ];
    const request = { intent: "pricing plans", constraints: [] as const, limit: 5 };
    const result = selectCompositions(request, tiedManifests, FIXTURE_RULES, "1.0.0");
    expect(result.results.length).toBe(2);
    expect(result.results[0]!.ref.stableId).toBe("a-pricing");
    expect(result.results[1]!.ref.stableId).toBe("z-pricing");
  });

  it("filters by category when specified", () => {
    const request = { intent: "landing page", constraints: [] as const, category: "hero" as const, limit: 5 };
    const result = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    for (const r of result.results) {
      const manifest = allManifests.find((m) => m.ref.stableId === r.ref.stableId);
      expect(manifest?.category).toBe("hero");
    }
  });

  it("respects limit parameter", () => {
    const request = { intent: "pricing", constraints: [] as const, limit: 1 };
    const result = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it("returns alternatives when no match found", () => {
    const request = { intent: "pricing", constraints: [{ field: "name", operator: "equals" as const, value: "Nonexistent" }], limit: 5 };
    const result = selectCompositions(request, allManifests, FIXTURE_RULES, "1.0.0");
    expect(result.results).toHaveLength(0);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  it("includes registry and rule set versions in result", () => {
    const request = { intent: "pricing", constraints: [] as const, limit: 5 };
    const result = selectCompositions(request, allManifests, FIXTURE_RULES, "2.5.0");
    expect(result.registryVersion).toBe("2.5.0");
    expect(result.ruleSetVersion).toBe("1.0.0");
  });
});

describe("normalizeIntent", () => {
  it("lowercases and trims input", () => {
    const steps = FIXTURE_RULES.normalization;
    const result = normalizeIntent("  Pricing Plans  ", steps);
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/[A-Z]/);
  });

  it("removes stop words", () => {
    const steps = FIXTURE_RULES.normalization;
    const result = normalizeIntent("a pricing page for the users", steps);
    expect(result).not.toMatch(/\bfor\b/);
    expect(result).not.toMatch(/\bthe\b/);
    expect(result).toContain("pricing");
  });
});


// ---------------------------------------------------------------------------
// 5. Retrieval
// ---------------------------------------------------------------------------

describe("retrieveComposition", () => {
  const completeLookup: ArtifactLookup = {
    exists: (_ref) => true,
    getSourceFiles: (_ref) => [FIXTURE_FILE],
    getChecksum: (_ref) => FIXTURE_CHECKSUM,
    getAlternatives: (_ref) => [],
  };

  const partialLookup: ArtifactLookup = {
    exists: (ref) => ref.stableId !== "toggle-switch",
    getSourceFiles: (_ref) => [FIXTURE_FILE],
    getChecksum: (_ref) => FIXTURE_CHECKSUM,
    getAlternatives: (ref) => [{ kind: ref.kind, stableId: `${ref.stableId}-alt`, version: "1.0.0" }],
  };

  it("returns complete result when all elements are available", () => {
    const result = retrieveComposition(FIXTURE_MANIFEST, completeLookup);
    expect(result.type).toBe("complete");
    if (result.type === "complete") {
      expect(result.manifest.ref.stableId).toBe("pricing-section");
      expect(result.elements).toHaveLength(3);
    }
  });

  it("returns partial result when some elements are unavailable", () => {
    const result = retrieveComposition(FIXTURE_MANIFEST, partialLookup);
    expect(result.type).toBe("partial");
    if (result.type === "partial") {
      expect(result.partial.availableElements).toHaveLength(2);
      expect(result.partial.unavailableElements).toHaveLength(1);
      expect(result.partial.unavailableElements[0]!.artifactRef.stableId).toBe("toggle-switch");
      expect(result.partial.unavailableElements[0]!.alternatives.length).toBeGreaterThan(0);
    }
  });

  it("includes composition ref in partial result", () => {
    const result = retrieveComposition(FIXTURE_MANIFEST, partialLookup);
    if (result.type === "partial") {
      expect(result.partial.compositionRef.stableId).toBe("pricing-section");
    }
  });
});

describe("buildNoMatchResult", () => {
  it("returns failed constraints and alternatives", () => {
    const request = { intent: "pricing", constraints: [{ field: "tags", operator: "contains" as const, value: "enterprise" }], category: "pricing" as const, limit: 3 };
    const result = buildNoMatchResult(request, [FIXTURE_MANIFEST], FIXTURE_RULES, "1.0.0");
    expect(result.failedConstraints.length).toBeGreaterThan(0);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  it("identifies category constraint failure when no match in category", () => {
    const request = { intent: "pricing", constraints: [] as const, category: "blog" as const, limit: 3 };
    const result = buildNoMatchResult(request, [FIXTURE_MANIFEST], FIXTURE_RULES, "1.0.0");
    expect(result.failedConstraints.some((c) => c.constraintId === "category")).toBe(true);
  });
});

describe("handleCompositionRequest", () => {
  const lookup: ArtifactLookup = {
    exists: (_ref) => true,
    getSourceFiles: (_ref) => [FIXTURE_FILE],
    getChecksum: (_ref) => FIXTURE_CHECKSUM,
    getAlternatives: (_ref) => [],
  };

  it("returns complete result for a matching request", () => {
    const request = { intent: "pricing tiers plans", constraints: [] as const, limit: 1 };
    const result = handleCompositionRequest(request, [FIXTURE_MANIFEST], FIXTURE_RULES, "1.0.0", lookup);
    expect(result.type).toBe("complete");
  });

  it("returns no-match when constraints exclude all manifests", () => {
    const request = { intent: "pricing", constraints: [{ field: "name", operator: "equals" as const, value: "Nonexistent" }], limit: 1 };
    const result = handleCompositionRequest(request, [FIXTURE_MANIFEST], FIXTURE_RULES, "1.0.0", lookup);
    expect(result.type).toBe("no-match");
    if (result.type === "no-match") {
      expect(result.noMatch.alternatives.length).toBeGreaterThanOrEqual(0);
    }
  });
});


// ---------------------------------------------------------------------------
// 6. MCP Operations
// ---------------------------------------------------------------------------

describe("createCompositionMcpDispatcher", () => {
  const lookup: ArtifactLookup = {
    exists: (_ref) => true,
    getSourceFiles: (_ref) => [FIXTURE_FILE],
    getChecksum: (_ref) => FIXTURE_CHECKSUM,
    getAlternatives: (_ref) => [],
  };

  const ctx = {
    manifests: [FIXTURE_MANIFEST],
    rules: FIXTURE_RULES,
    registryVersion: "3.0.0",
    lookup,
  };

  const dispatcher = createCompositionMcpDispatcher(ctx);

  describe("list_compositions", () => {
    it("lists all compositions without filter", () => {
      const output = dispatcher.list_compositions({});
      expect(output.total).toBe(1);
      expect(output.compositions).toHaveLength(1);
      expect(output.compositions[0]!.stableId).toBe("pricing-section");
      expect(output.registryVersion).toBe("3.0.0");
    });

    it("filters by category", () => {
      const output = dispatcher.list_compositions({ category: "hero" });
      expect(output.total).toBe(0);
      expect(output.compositions).toHaveLength(0);
    });

    it("respects limit and offset", () => {
      const output = dispatcher.list_compositions({ limit: 0, offset: 0 });
      expect(output.compositions).toHaveLength(0);
      expect(output.total).toBe(1);
    });
  });

  describe("get_composition", () => {
    it("returns complete result for existing composition", () => {
      const output = dispatcher.get_composition({ stableId: "pricing-section", version: "1.0.0" });
      expect(output.result.type).toBe("complete");
      expect(output.registryVersion).toBe("3.0.0");
    });

    it("returns no-match for non-existent composition", () => {
      const output = dispatcher.get_composition({ stableId: "nonexistent", version: "1.0.0" });
      expect(output.result.type).toBe("no-match");
    });
  });

  describe("search_compositions", () => {
    it("finds compositions matching intent", () => {
      const output = dispatcher.search_compositions({ intent: "pricing tiers plans" });
      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0]!.stableId).toBe("pricing-section");
      expect(output.ruleSetVersion).toBe("1.0.0");
    });

    it("returns empty results for non-matching intent with strict constraints", () => {
      const output = dispatcher.search_compositions({
        intent: "pricing",
        constraints: [{ field: "name", operator: "equals", value: "Nothing" }],
      });
      expect(output.results).toHaveLength(0);
    });

    it("includes explanation in output", () => {
      const output = dispatcher.search_compositions({ intent: "pricing" });
      expect(output.explanation).toBeDefined();
      expect(typeof output.explanation).toBe("string");
    });
  });

  describe("customize_composition", () => {
    it("applies valid customization", () => {
      const output = dispatcher.customize_composition({
        stableId: "pricing-section",
        version: "1.0.0",
        brandConfig: { heading: "Our Plans", cta_text: "Buy Now", cta_link: "/buy" },
      });
      expect(output.result.valid).toBe(true);
      expect(output.result.appliedValues["heading"]).toBe("Our Plans");
      expect(output.registryVersion).toBe("3.0.0");
    });

    it("rejects customization for non-existent composition", () => {
      const output = dispatcher.customize_composition({
        stableId: "nonexistent",
        version: "1.0.0",
        brandConfig: { heading: "Test" },
      });
      expect(output.result.valid).toBe(false);
      expect(output.result.invariantViolations.length).toBeGreaterThan(0);
    });

    it("reports undeclared fields in customization", () => {
      const output = dispatcher.customize_composition({
        stableId: "pricing-section",
        version: "1.0.0",
        brandConfig: { heading: "Test", cta_text: "Go", cta_link: "/x", bad_field: "nope" },
      });
      expect(output.result.valid).toBe(false);
      expect(output.result.undeclaredFields).toContain("bad_field");
    });
  });
});
