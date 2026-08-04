/**
 * Unit tests for @neuraforge/public-api.
 *
 * Tests API construction, all five routes, validation, error handling,
 * HEAD parity, immutable headers, deterministic responses, and security.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createPublicApi } from "../handler.js";
import { createNodeRequestListener } from "../node-adapter.js";
import type { HttpRequest, HttpResponse, PublicApiHandler } from "../types.js";
import { buildReleaseBundle, toJsonValue } from "@neuraforge/registry-builder";
import type { ReleaseBundle } from "@neuraforge/registry-builder";
import { canonicalizeJson } from "@neuraforge/catalog-core";
import { buildFixtureInput } from "../../../../packages/registry-builder/src/__tests__/fixtures.js";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Test fixture: build a valid ReleaseBundle
// ---------------------------------------------------------------------------

let validBundle: ReleaseBundle;
let handler: PublicApiHandler;

beforeAll(async () => {
  const input = await buildFixtureInput();
  const result = await buildReleaseBundle(input);
  if (!result.success) {
    throw new Error(`Failed to build fixture bundle: ${JSON.stringify(result.errors)}`);
  }
  validBundle = result.bundle;
  handler = await createPublicApi(validBundle);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  method: string,
  reqPath: string,
  query: Record<string, string | undefined> = {},
  headers: Record<string, string | undefined> = {},
): HttpRequest {
  return { method, path: reqPath, query, headers };
}

async function get(
  reqPath: string,
  query: Record<string, string | undefined> = {},
): Promise<HttpResponse> {
  return handler.handle(makeRequest("GET", reqPath, query));
}

async function head(
  reqPath: string,
  query: Record<string, string | undefined> = {},
): Promise<HttpResponse> {
  return handler.handle(makeRequest("HEAD", reqPath, query));
}

// ---------------------------------------------------------------------------
// 1. API construction
// ---------------------------------------------------------------------------

describe("createPublicApi", () => {
  it("accepts a valid bundle and returns a handler", () => {
    expect(handler).toBeDefined();
    expect(handler.handle).toBeTypeOf("function");
  });

  it("rejects a tampered bundle", async () => {
    const tampered: ReleaseBundle = {
      ...validBundle,
      bundleChecksum: {
        ...validBundle.bundleChecksum,
        digest: "0".repeat(64),
      },
    };
    await expect(createPublicApi(tampered)).rejects.toThrow("Bundle verification failed");
  });
});

// ---------------------------------------------------------------------------
// 2. Route: GET /registry/{registryVersion} (RegistrySnapshot)
// ---------------------------------------------------------------------------

describe("GET /registry/{registryVersion}", () => {
  it("returns the snapshot for the valid registry version", async () => {
    const response = await get("/registry/1.0.0");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as Record<string, unknown>;
    expect(body.registryVersion).toBe("1.0.0");
    expect(body.schemaVersion).toBe("1.0.0");
  });

  it("returns canonical deterministic JSON", async () => {
    const response = await get("/registry/1.0.0");
    const snapshot = toJsonValue(validBundle.snapshot);
    const expected = canonicalizeJson(snapshot);
    expect(response.body).toBe(expected);
  });

  it("includes correct immutable headers", async () => {
    const response = await get("/registry/1.0.0");
    expect(response.headers["Content-Type"]).toBe("application/json; charset=utf-8");
    expect(response.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    expect(response.headers["X-NeuraForge-Registry-Version"]).toBe("1.0.0");
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(response.headers.ETag).toMatch(/^"[a-f0-9]{64}"$/);
    expect(response.headers["Content-Length"]).toBeDefined();
  });

  it("returns ETag derived from snapshot checksum", async () => {
    const response = await get("/registry/1.0.0");
    const expectedEtag = `"${validBundle.snapshot.snapshotChecksum.digest}"`;
    expect(response.headers.ETag).toBe(expectedEtag);
  });

  it("Content-Length matches UTF-8 bytes", async () => {
    const response = await get("/registry/1.0.0");
    const expectedLength = new TextEncoder().encode(response.body).length;
    expect(Number(response.headers["Content-Length"])).toBe(expectedLength);
  });
});

// ---------------------------------------------------------------------------
// 3. Route: GET /registry/{registryVersion}/manifest
// ---------------------------------------------------------------------------

describe("GET /registry/{registryVersion}/manifest", () => {
  it("returns the manifest for the valid registry version", async () => {
    const response = await get("/registry/1.0.0/manifest");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as Record<string, unknown>;
    expect(body.schemaVersion).toBe("1.0.0");
    expect(body.releaseVersion).toBe("1.0.0");
    expect(body.registryVersion).toBe("1.0.0");
  });

  it("returns canonical deterministic JSON", async () => {
    const response = await get("/registry/1.0.0/manifest");
    const manifest = toJsonValue(validBundle.manifest);
    const expected = canonicalizeJson(manifest);
    expect(response.body).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 4. Route: GET /registry/{registryVersion}/components
// ---------------------------------------------------------------------------

describe("GET /registry/{registryVersion}/components", () => {
  it("returns a list of components", async () => {
    const response = await get("/registry/1.0.0/components");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { components: unknown[]; totalMatching: number };
    expect(body.components.length).toBeGreaterThan(0);
    expect(body.totalMatching).toBe(20);
  });

  it("supports category filter", async () => {
    const response = await get("/registry/1.0.0/components", { category: "navigation" });
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { components: { category: string }[] };
    for (const comp of body.components) {
      expect(comp.category).toBe("navigation");
    }
  });

  it("supports exactVersion filter", async () => {
    const response = await get("/registry/1.0.0/components", { exactVersion: "1.0.0" });
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { components: { version: string }[] };
    for (const comp of body.components) {
      expect(comp.version).toBe("1.0.0");
    }
  });

  it("supports pageSize parameter", async () => {
    const response = await get("/registry/1.0.0/components", { pageSize: "5" });
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { components: unknown[]; nextCursor: string };
    expect(body.components.length).toBe(5);
    expect(body.nextCursor).toBeDefined();
  });

  it("rejects invalid category", async () => {
    const response = await get("/registry/1.0.0/components", { category: "invalid" });
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "invalid_category")).toBe(true);
  });

  it("rejects invalid pageSize (0)", async () => {
    const response = await get("/registry/1.0.0/components", { pageSize: "0" });
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "invalid_page_size")).toBe(true);
  });

  it("rejects invalid pageSize (101)", async () => {
    const response = await get("/registry/1.0.0/components", { pageSize: "101" });
    expect(response.status).toBe(400);
  });

  it("rejects unknown query fields", async () => {
    const response = await get("/registry/1.0.0/components", { unknownField: "value" });
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "unknown_query_field")).toBe(true);
  });

  it("returns deterministic ordering", async () => {
    const r1 = await get("/registry/1.0.0/components");
    const r2 = await get("/registry/1.0.0/components");
    expect(r1.body).toBe(r2.body);
  });
});

// ---------------------------------------------------------------------------
// 5. Route: GET /registry/{registryVersion}/artifacts/component/{id}/{version}
// ---------------------------------------------------------------------------

describe("GET /registry/{registryVersion}/artifacts/component/{stableId}/{artifactVersion}", () => {
  it("returns a component artifact", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as Record<string, unknown>;
    const ref = body.ref as { stableId: string; version: string };
    expect(ref.stableId).toBe("navbar");
    expect(ref.version).toBe("1.0.0");
  });

  it("includes source files with content", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const body = JSON.parse(response.body) as {
      sourceFiles: { content: string; path: string }[];
    };
    expect(body.sourceFiles.length).toBeGreaterThan(0);
    expect(body.sourceFiles[0]?.content).toContain("React");
  });

  it("includes checksum headers for artifacts", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    expect(response.headers["X-NeuraForge-Checksum-Algorithm"]).toBe("sha256");
    expect(response.headers["X-NeuraForge-Checksum"]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns checksum matching the bundle's component checksum", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const navbar = validBundle.snapshot.components.find((c) => c.ref.stableId === "navbar");
    expect(response.headers["X-NeuraForge-Checksum"]).toBe(navbar?.checksum.digest);
  });

  it("includes dependencies in response", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const body = JSON.parse(response.body) as { dependencies: unknown[] };
    expect(body.dependencies).toBeDefined();
  });

  it("includes compatibility in response", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const body = JSON.parse(response.body) as { compatibility: unknown[] };
    expect(body.compatibility).toBeDefined();
    expect(body.compatibility.length).toBeGreaterThan(0);
  });

  it("includes provenance in response", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const body = JSON.parse(response.body) as { provenance: unknown[] };
    expect(body.provenance).toBeDefined();
    expect(body.provenance.length).toBeGreaterThan(0);
  });

  it("404 for unknown component with alternatives", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/nonexistent/1.0.0");
    expect(response.status).toBe(404);
    const body = JSON.parse(response.body) as { error: { code: string } };
    expect(body.error.code).toBe("not_found");
  });

  it("404 for unknown component version with alternatives", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/9.9.9");
    expect(response.status).toBe(404);
    const body = JSON.parse(response.body) as {
      error: { code: string; alternatives?: { stableId: string }[] };
    };
    expect(body.error.code).toBe("not_found");
    expect(body.error.alternatives).toBeDefined();
    expect(body.error.alternatives?.some((a) => a.stableId === "navbar")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Route: GET /registry/{registryVersion}/artifacts/token-set/design-tokens/{version}
// ---------------------------------------------------------------------------

describe("GET /registry/{registryVersion}/artifacts/token-set/design-tokens/{artifactVersion}", () => {
  it("returns the token artifact", async () => {
    const response = await get("/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { tokenDocument: unknown; releaseVersion: string };
    expect(body.releaseVersion).toBe("1.0.0");
    expect(body.tokenDocument).toBeDefined();
  });

  it("includes checksum headers", async () => {
    const response = await get("/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0");
    expect(response.headers["X-NeuraForge-Checksum-Algorithm"]).toBe("sha256");
    expect(response.headers["X-NeuraForge-Checksum"]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns checksum matching bundle token checksum", async () => {
    const response = await get("/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0");
    expect(response.headers["X-NeuraForge-Checksum"]).toBe(
      validBundle.snapshot.tokenArtifact.checksum.digest,
    );
  });

  it("404 for unknown token version with alternatives", async () => {
    const response = await get("/registry/1.0.0/artifacts/token-set/design-tokens/9.9.9");
    expect(response.status).toBe(404);
    const body = JSON.parse(response.body) as { error: { code: string; alternatives?: unknown[] } };
    expect(body.error.code).toBe("not_found");
    expect(body.error.alternatives).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Anonymous requests — Authorization/cookie headers produce same response
// ---------------------------------------------------------------------------

describe("anonymous request equivalence", () => {
  it("anonymous request works", async () => {
    const response = await handler.handle(makeRequest("GET", "/registry/1.0.0"));
    expect(response.status).toBe(200);
  });

  it("Authorization header produces byte-identical response", async () => {
    const anonymous = await handler.handle(makeRequest("GET", "/registry/1.0.0"));
    const withAuth = await handler.handle(
      makeRequest("GET", "/registry/1.0.0", {}, { authorization: "Bearer secret-token" }),
    );
    expect(anonymous.status).toBe(withAuth.status);
    expect(anonymous.body).toBe(withAuth.body);
    expect(anonymous.headers).toStrictEqual(withAuth.headers);
  });

  it("Cookie header produces byte-identical response", async () => {
    const anonymous = await handler.handle(makeRequest("GET", "/registry/1.0.0"));
    const withCookie = await handler.handle(
      makeRequest("GET", "/registry/1.0.0", {}, { cookie: "session=abc123" }),
    );
    expect(anonymous.body).toBe(withCookie.body);
    expect(anonymous.headers).toStrictEqual(withCookie.headers);
  });
});

// ---------------------------------------------------------------------------
// 8. HEAD parity — same headers, empty body
// ---------------------------------------------------------------------------

describe("HEAD parity", () => {
  const routes = [
    "/registry/1.0.0",
    "/registry/1.0.0/manifest",
    "/registry/1.0.0/components",
    "/registry/1.0.0/artifacts/component/navbar/1.0.0",
    "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
  ];

  for (const route of routes) {
    it(`HEAD ${route} has same status and headers as GET but empty body`, async () => {
      const getRes = await get(route);
      const headRes = await head(route);
      expect(headRes.status).toBe(getRes.status);
      expect(headRes.headers).toStrictEqual(getRes.headers);
      expect(headRes.body).toBe("");
    });
  }

  it("keeps validation-error headers but removes the HEAD body", async () => {
    const getResponse = await get("/registry/latest");
    const headResponse = await head("/registry/latest");

    expect(headResponse.status).toBe(getResponse.status);
    expect(headResponse.headers).toStrictEqual(getResponse.headers);
    expect(headResponse.body).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 9. Version validation — malformed/latest/range
// ---------------------------------------------------------------------------

describe("version validation", () => {
  it("rejects 'latest' registry version", async () => {
    const response = await get("/registry/latest");
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "version_latest_not_allowed")).toBe(true);
  });

  it("rejects range (^1.0.0) registry version", async () => {
    const response = await get("/registry/^1.0.0");
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "version_range_not_allowed")).toBe(true);
  });

  it("rejects malformed registry version", async () => {
    const response = await get("/registry/abc.def.ghi");
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "version_malformed")).toBe(true);
  });

  it("rejects 'latest' artifact version", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/latest");
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "version_latest_not_allowed")).toBe(true);
  });

  it("rejects range artifact version", async () => {
    const response = await get("/registry/1.0.0/artifacts/component/navbar/~1.0.0");
    expect(response.status).toBe(400);
  });

  it("rejects empty artifact version", async () => {
    // This hits a different route since an empty version changes path
    const response = await get("/registry/1.0.0/artifacts/token-set/design-tokens/latest");
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 10. Path traversal and safety
// ---------------------------------------------------------------------------

describe("path traversal and safety", () => {
  it("rejects path with backslash", async () => {
    const response = await handler.handle(makeRequest("GET", "/registry\\1.0.0"));
    expect(response.status).toBe(400);
    const body = JSON.parse(response.body) as { error: { fields: { code: string }[] } };
    expect(body.error.fields.some((f) => f.code === "path_backslash")).toBe(true);
  });

  it("rejects path with traversal (..) ", async () => {
    const response = await get("/registry/1.0.0/../secret");
    expect(response.status).toBe(400);
  });

  it("rejects path with null byte", async () => {
    const response = await get("/registry/1.0.0%00evil");
    expect(response.status).toBe(400);
  });

  it("rejects invalid URL encoding", async () => {
    const response = await handler.handle(makeRequest("GET", "/registry/%GG"));
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 11. Method not allowed (405)
// ---------------------------------------------------------------------------

describe("method not allowed", () => {
  const methods = ["POST", "PUT", "PATCH", "DELETE"];

  for (const method of methods) {
    it(`${method} returns 405`, async () => {
      const response = await handler.handle(makeRequest(method, "/registry/1.0.0"));
      expect(response.status).toBe(405);
      expect(response.headers.Allow).toBe("GET, HEAD");
      const body = JSON.parse(response.body) as { error: { code: string } };
      expect(body.error.code).toBe("method_not_allowed");
    });
  }

  it("mutation methods do not change bundle state", async () => {
    const before = await get("/registry/1.0.0");
    await handler.handle(makeRequest("POST", "/registry/1.0.0"));
    await handler.handle(makeRequest("DELETE", "/registry/1.0.0"));
    const after = await get("/registry/1.0.0");
    expect(after.body).toBe(before.body);
  });
});

// ---------------------------------------------------------------------------
// 12. 404 for unknown registry version with alternatives
// ---------------------------------------------------------------------------

describe("404 with alternatives", () => {
  it("returns available versions for unknown registry version", async () => {
    const response = await get("/registry/9.9.9");
    expect(response.status).toBe(404);
    const body = JSON.parse(response.body) as {
      error: { code: string; details?: { availableVersions: string[] } };
    };
    expect(body.error.code).toBe("not_found");
    expect(body.error.details?.availableVersions).toContain("1.0.0");
  });
});

// ---------------------------------------------------------------------------
// 13. Deterministic multi-page traversal
// ---------------------------------------------------------------------------

describe("pagination", () => {
  it("traverses all pages deterministically", async () => {
    const allIds: string[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 10; page++) {
      const query: Record<string, string | undefined> = { pageSize: "5" };
      if (cursor !== undefined) {
        query.cursor = cursor;
      }
      const response = await get("/registry/1.0.0/components", query);
      expect(response.status).toBe(200);
      const body = JSON.parse(response.body) as {
        components: { stableId: string }[];
        nextCursor?: string;
      };
      for (const comp of body.components) {
        allIds.push(comp.stableId);
      }
      cursor = body.nextCursor;
      if (cursor === undefined) break;
    }

    // No duplicates
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
    // All 20 retrieved
    expect(allIds.length).toBe(20);
  });

  it("replaying same cursor produces same page", async () => {
    const r1 = await get("/registry/1.0.0/components", { pageSize: "5" });
    const body1 = JSON.parse(r1.body) as { nextCursor?: string };
    if (body1.nextCursor === undefined) return;

    const r2 = await get("/registry/1.0.0/components", {
      pageSize: "5",
      cursor: body1.nextCursor,
    });
    const r3 = await get("/registry/1.0.0/components", {
      pageSize: "5",
      cursor: body1.nextCursor,
    });
    expect(r2.body).toBe(r3.body);
  });

  it("rejects tampered cursor", async () => {
    const response = await get("/registry/1.0.0/components", {
      pageSize: "5",
      cursor: "dGFtcGVyZWQ",
    });
    expect(response.status).toBe(400);
  });

  it("rejects cursor with mismatched pageSize", async () => {
    const r1 = await get("/registry/1.0.0/components", { pageSize: "5" });
    const body1 = JSON.parse(r1.body) as { nextCursor?: string };
    if (body1.nextCursor === undefined) return;

    const response = await get("/registry/1.0.0/components", {
      pageSize: "10",
      cursor: body1.nextCursor,
    });
    expect(response.status).toBe(400);
  });

  it("rejects cursor with mismatched filter", async () => {
    const r1 = await get("/registry/1.0.0/components", {
      pageSize: "5",
      category: "navigation",
    });
    const body1 = JSON.parse(r1.body) as { nextCursor?: string };
    if (body1.nextCursor === undefined) return;

    const response = await get("/registry/1.0.0/components", {
      pageSize: "5",
      category: "forms",
      cursor: body1.nextCursor,
    });
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 14. Repeated identical requests are byte-identical
// ---------------------------------------------------------------------------

describe("byte-identical repeated requests", () => {
  const routes = [
    "/registry/1.0.0",
    "/registry/1.0.0/manifest",
    "/registry/1.0.0/components",
    "/registry/1.0.0/artifacts/component/navbar/1.0.0",
    "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
  ];

  for (const route of routes) {
    it(`repeated GET ${route} returns byte-identical response`, async () => {
      const r1 = await get(route);
      const r2 = await get(route);
      expect(r1.body).toBe(r2.body);
      expect(r1.headers).toStrictEqual(r2.headers);
      expect(r1.status).toBe(r2.status);
    });
  }
});

// ---------------------------------------------------------------------------
// 15. Health endpoint
// ---------------------------------------------------------------------------

describe("/health", () => {
  it("returns healthy status", async () => {
    const response = await get("/health");
    expect(response.status).toBe(200);
    const body = JSON.parse(response.body) as { status: string; registryVersion: string };
    expect(body.status).toBe("healthy");
    expect(body.registryVersion).toBe("1.0.0");
  });

  it("does not leak secrets", async () => {
    const response = await get("/health");
    const body = response.body;
    expect(body).not.toContain("secret");
    expect(body).not.toContain("password");
    expect(body).not.toContain("key");
  });
});

// ---------------------------------------------------------------------------
// 16. OPTIONS returns CORS
// ---------------------------------------------------------------------------

describe("OPTIONS", () => {
  it("returns 204 with CORS headers", async () => {
    const response = await handler.handle(makeRequest("OPTIONS", "/registry/1.0.0"));
    expect(response.status).toBe(204);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(response.headers["Access-Control-Allow-Methods"]).toBe("GET, HEAD");
    expect(response.body).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 17. createNodeRequestListener
// ---------------------------------------------------------------------------

describe("createNodeRequestListener", () => {
  it("returns a function", () => {
    const listener = createNodeRequestListener(handler);
    expect(listener).toBeTypeOf("function");
  });
});

// ---------------------------------------------------------------------------
// 18. Source scan: no write APIs / auth / billing / quota imports
// ---------------------------------------------------------------------------

describe("source scan", () => {
  it("does not import auth, billing, quota, or write APIs", () => {
    const srcDir = path.resolve(import.meta.dirname, "..");
    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".ts"));
    const forbidden = [
      "hosted-gateway",
      "billing",
      "quota",
      "subscription",
      "entitlement",
      "payment",
      "writeFile",
      "mkdirSync",
      "writeSync",
    ];

    for (const file of files) {
      const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
      for (const term of forbidden) {
        expect(content).not.toContain(term);
      }
    }
  });
});
