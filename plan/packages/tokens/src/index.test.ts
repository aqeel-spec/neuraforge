import { describe, expect, it } from "vitest";

import {
  exportTokenDocument,
  generateTailwindTheme,
  importTokenDocument,
  validateBrandConfig,
  validateTokenDocument,
} from "./index.js";
import type { BrandConfig, TokenDocument } from "./index.js";

const document: TokenDocument = {
  schemaVersion: "1.0.0",
  releaseVersion: "1.0.0",
  ordering: "declaration",
  tokens: {
    "color.brand.primary": { category: "color", type: "color", value: "#123456" },
    "color.brand.accent": {
      category: "color",
      type: "color",
      reference: "{color.brand.primary}",
    },
    "spacing.md": { category: "spacing", type: "dimension", value: "1rem" },
    "typography.sans": {
      category: "typography",
      type: "fontFamily",
      value: ["Inter", "sans-serif"],
    },
  },
};

const brand: BrandConfig = {
  schemaVersion: "1.0.0",
  tokens: { "color.brand.primary": "#abcdef" },
  fonts: [
    {
      family: "Customer Sans",
      source: "external",
      reference: "https://fonts.example/customer-sans.css",
    },
  ],
};

function fieldPaths(result: ReturnType<typeof generateTailwindTheme>): string[] {
  if (result.ok) return [];
  return result.error.error.fields?.map((entry) => entry.path) ?? [];
}

describe("token validation", () => {
  it("accepts a valid document and matching Brand Config", () => {
    expect(validateTokenDocument(document)).toEqual({ ok: true, value: document });
    expect(validateBrandConfig(brand, document)).toEqual({ ok: true, value: brand });
  });

  it("accumulates independent field and reference errors before emitting output", () => {
    const invalidDocument = {
      ...document,
      tokens: {
        "color.one": { category: "color", type: "color", reference: "color.two" },
        "color.two": { category: "color", type: "color", reference: "color.one" },
        "color.bad": { category: "color", type: "color", value: 42 },
        "spacing.missing": { category: "spacing", type: "dimension", reference: "spacing.none" },
      },
    };
    const invalidBrand = {
      schemaVersion: "1.0.0",
      tokens: { "color.bad": false, "unknown.token": "value" },
      fonts: [{ family: "", source: "remote", reference: "" }],
    };

    const result = generateTailwindTheme(invalidDocument, invalidBrand, "3.4.17");

    expect(result.ok).toBe(false);
    expect(fieldPaths(result)).toEqual(
      expect.arrayContaining([
        "/tokens/color.one/reference",
        "/tokens/color.two/reference",
        "/tokens/color.bad/value",
        "/tokens/spacing.missing/reference",
        "/tokens/color.bad",
        "/tokens/unknown.token",
        "/fonts/0/family",
        "/fonts/0/source",
        "/fonts/0/reference",
      ]),
    );
    if (!result.ok) expect(result.error.error.fields?.length).toBeGreaterThanOrEqual(9);
  });
});

describe("token import and export", () => {
  it("preserves token meaning and declaration ordering for the same schema version", () => {
    const exported = exportTokenDocument(document);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    expect(exported.value.indexOf("color.brand.primary")).toBeLessThan(
      exported.value.indexOf("spacing.md"),
    );
    const imported = importTokenDocument(exported.value);
    expect(imported).toEqual({ ok: true, value: document });
  });

  it("applies lexicographic ordering without changing declared semantics", () => {
    const spacingMd = document.tokens["spacing.md"];
    if (!spacingMd) throw new Error("expected spacing.md token to exist");
    const colorPrimary = document.tokens["color.brand.primary"];
    if (!colorPrimary) throw new Error("expected color.brand.primary token to exist");
    const lexicographic: TokenDocument = {
      ...document,
      ordering: "lexicographic",
      tokens: {
        "spacing.md": spacingMd,
        "color.brand.primary": colorPrimary,
      },
    };
    const exported = exportTokenDocument(lexicographic);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.value.indexOf("color.brand.primary")).toBeLessThan(
      exported.value.indexOf("spacing.md"),
    );
  });

  it("returns a field error for malformed JSON", () => {
    const result = importTokenDocument("{not-json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.error.fields?.[0]?.code).toBe("invalid_json");
  });
});
