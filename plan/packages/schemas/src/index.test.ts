import { describe, expect, it } from "vitest";

import { CANONICALIZATION_VERSION, COMMON_SCHEMA_VERSION, commonSchemaV1 } from "./index.js";
import type { AccessClassification, ArtifactRef, ErrorEnvelope, Result } from "./index.js";

interface SchemaNode {
  type?: string;
  pattern?: string;
  const?: unknown;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, SchemaNode>;
  additionalProperties?: boolean | SchemaNode;
  items?: SchemaNode;
  anyOf?: SchemaNode[];
}

interface CommonSchemaDocument {
  $id: string;
  definitions: Record<string, SchemaNode>;
}

const schema = commonSchemaV1 as unknown as CommonSchemaDocument;

function definition(name: string): SchemaNode {
  const value = schema.definitions[name];
  if (!value) throw new Error(`Missing schema definition: ${name}`);
  return value;
}

function property(owner: string, name: string): SchemaNode {
  const value = definition(owner).properties?.[name];
  if (!value) throw new Error(`Missing schema property: ${owner}.${name}`);
  return value;
}

function assertClosedObjects(node: SchemaNode): void {
  if (node.type === "object" && node.properties) {
    expect(node.additionalProperties).toBe(false);
  }
  for (const child of Object.values(node.properties ?? {})) assertClosedObjects(child);
  for (const child of node.anyOf ?? []) assertClosedObjects(child);
  if (node.items) assertClosedObjects(node.items);
}

describe("common schema v1", () => {
  it("publishes every common adapter contract from one versioned schema", () => {
    expect(schema.$id).toBe("urn:neuraforge:schema:common:v1");
    expect(Object.keys(schema.definitions)).toEqual(
      expect.arrayContaining([
        "ArtifactRef",
        "FileRecord",
        "Checksum",
        "LicenseProvenance",
        "DependencyInventoryItem",
        "CompatibilityConstraint",
        "CompatibilityMatrixEntry",
        "ReleaseManifest",
        "QualityGateResult",
        "PerformanceRecord",
        "FieldError",
        "ErrorEnvelope",
        "AccessClassification",
      ]),
    );
    expect(COMMON_SCHEMA_VERSION).toBe("1.0.0");
    expect(CANONICALIZATION_VERSION).toBe("neuraforge-canonical-v1");
  });

  it("closes every declared object contract against unknown fields", () => {
    for (const node of Object.values(schema.definitions)) assertClosedObjects(node);
  });

  it("constrains access classification to public entitlement-free artifacts", () => {
    const access: AccessClassification = {
      visibility: "public",
      entitlement: "none",
      paymentRequired: false,
      licenseKeyRequired: false,
      privateVariant: false,
      paidOnlyVariant: false,
    };

    expect(access).toEqual({
      visibility: property("AccessClassification", "visibility").const,
      entitlement: property("AccessClassification", "entitlement").const,
      paymentRequired: property("AccessClassification", "paymentRequired").const,
      licenseKeyRequired: property("AccessClassification", "licenseKeyRequired").const,
      privateVariant: property("AccessClassification", "privateVariant").const,
      paidOnlyVariant: property("AccessClassification", "paidOnlyVariant").const,
    });
  });

  it("requires exact versions, safe relative paths, and canonical SHA-256 digests", () => {
    const versionPattern = new RegExp(definition("SemanticVersion").pattern ?? "");
    const stableIdPattern = new RegExp(property("ArtifactRef", "stableId").pattern ?? "");
    const pathPattern = new RegExp(property("FileRecord", "path").pattern ?? "");
    const digestPattern = new RegExp(property("Checksum", "digest").pattern ?? "");

    expect(versionPattern.test("1.2.3-beta.1")).toBe(true);
    expect(versionPattern.test("latest")).toBe(false);
    expect(stableIdPattern.test("neuraforge/button")).toBe(true);
    expect(stableIdPattern.test("Button")).toBe(false);
    expect(pathPattern.test("src/button.tsx")).toBe(true);
    expect(pathPattern.test("../secret.txt")).toBe(false);
    expect(pathPattern.test("C:\\secret.txt")).toBe(false);
    expect(digestPattern.test("a".repeat(64))).toBe(true);
    expect(digestPattern.test("A".repeat(64))).toBe(false);
  });

  it("shares discriminated Result and complete field-error envelopes", () => {
    const artifact: ArtifactRef = {
      kind: "component",
      stableId: "neuraforge/button",
      version: "1.0.0",
    };
    const success: Result<ArtifactRef> = { ok: true, value: artifact };
    const envelope: ErrorEnvelope = {
      error: {
        code: "validation_failed",
        category: "validation",
        operation: "get_component",
        message: "Input validation failed",
        retryable: false,
        fields: [
          {
            code: "invalid_version",
            path: "/version",
            constraint: "must be an exact Semantic Version",
            guidance: "Use a published version such as 1.0.0",
          },
          {
            code: "invalid_stable_id",
            path: "/stableId",
            constraint: "must be a lowercase namespaced slug",
            guidance: "Use a value such as neuraforge/button",
          },
        ],
        requestId: "request-1",
      },
    };
    const failure: Result<ArtifactRef> = { ok: false, error: envelope };
    const summarize = (result: Result<ArtifactRef>): string =>
      result.ok ? result.value.stableId : result.error.error.code;

    expect(summarize(success)).toBe("neuraforge/button");
    expect(summarize(failure)).toBe("validation_failed");
    expect(envelope.error.fields).toHaveLength(2);
    expect(definition("FieldError").required).toEqual(["code", "path", "constraint", "guidance"]);
  });
});
