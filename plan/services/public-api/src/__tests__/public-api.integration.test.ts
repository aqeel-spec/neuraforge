/**
 * Integration tests for @neuraforge-ui/public-api.
 *
 * Spins up a real ephemeral Node HTTP server and tests the full request lifecycle.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { createPublicApi, createNodeRequestListener } from "../index.js";
import type { PublicApiHandler } from "../types.js";
import { buildReleaseBundle } from "@neuraforge-ui/registry-builder";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import { buildFixtureInput } from "../../../../packages/registry-builder/src/__tests__/fixtures.js";

// ---------------------------------------------------------------------------
// Setup: build bundle and start server
// ---------------------------------------------------------------------------

let validBundle: ReleaseBundle;
let handler: PublicApiHandler;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const input = await buildFixtureInput();
  const result = await buildReleaseBundle(input);
  if (!result.success) {
    throw new Error(`Failed to build fixture bundle: ${JSON.stringify(result.errors)}`);
  }
  validBundle = result.bundle;
  handler = await createPublicApi(validBundle);

  const listener = createNodeRequestListener(handler);
  server = createServer(listener);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr !== null && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${String(addr.port)}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl}${path}`, options);
}

// ---------------------------------------------------------------------------
// 1. Basic GET smoke tests
// ---------------------------------------------------------------------------

describe("Node HTTP server GET smoke", () => {
  it("GET /health returns 200", async () => {
    const res = await fetchJson("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("healthy");
  });

  it("GET /registry/1.0.0 returns 200 with snapshot", async () => {
    const res = await fetchJson("/registry/1.0.0");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { registryVersion: string };
    expect(body.registryVersion).toBe("1.0.0");
  });

  it("GET /registry/1.0.0/manifest returns 200", async () => {
    const res = await fetchJson("/registry/1.0.0/manifest");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { releaseVersion: string };
    expect(body.releaseVersion).toBe("1.0.0");
  });

  it("GET /registry/1.0.0/components returns 200 with list", async () => {
    const res = await fetchJson("/registry/1.0.0/components");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { components: unknown[]; totalMatching: number };
    expect(body.totalMatching).toBe(20);
  });

  it("GET /registry/1.0.0/artifacts/component/navbar/1.0.0 returns 200", async () => {
    const res = await fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ref: { stableId: string } };
    expect(body.ref.stableId).toBe("navbar");
  });

  it("GET /registry/1.0.0/artifacts/token-set/design-tokens/1.0.0 returns 200", async () => {
    const res = await fetchJson("/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { releaseVersion: string };
    expect(body.releaseVersion).toBe("1.0.0");
  });
});

// ---------------------------------------------------------------------------
// 2. HEAD returns same headers but no body
// ---------------------------------------------------------------------------

describe("Node HTTP server HEAD", () => {
  it("HEAD /registry/1.0.0 has same status and headers but no body", async () => {
    const getRes = await fetchJson("/registry/1.0.0");
    const headRes = await fetchJson("/registry/1.0.0", { method: "HEAD" });
    expect(headRes.status).toBe(getRes.status);
    expect(headRes.headers.get("etag")).toBe(getRes.headers.get("etag"));
    expect(headRes.headers.get("content-length")).toBe(getRes.headers.get("content-length"));
    expect(headRes.headers.get("cache-control")).toBe(getRes.headers.get("cache-control"));
    const headBody = await headRes.text();
    expect(headBody).toBe("");
  });

  it("HEAD /registry/1.0.0/artifacts/component/navbar/1.0.0 has empty body", async () => {
    const headRes = await fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0", {
      method: "HEAD",
    });
    expect(headRes.status).toBe(200);
    const body = await headRes.text();
    expect(body).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. Immutable headers
// ---------------------------------------------------------------------------

describe("Node HTTP server immutable headers", () => {
  it("includes all required headers", async () => {
    const res = await fetchJson("/registry/1.0.0");
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("x-neuraforge-registry-version")).toBe("1.0.0");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/);
    expect(Number(res.headers.get("content-length"))).toBeGreaterThan(0);
  });

  it("artifact includes checksum headers", async () => {
    const res = await fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    expect(res.headers.get("x-neuraforge-checksum-algorithm")).toBe("sha256");
    expect(res.headers.get("x-neuraforge-checksum")).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// 4. Error responses
// ---------------------------------------------------------------------------

describe("Node HTTP server error handling", () => {
  it("POST returns 405", async () => {
    const res = await fetchJson("/registry/1.0.0", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });

  it("DELETE returns 405", async () => {
    const res = await fetchJson("/registry/1.0.0", { method: "DELETE" });
    expect(res.status).toBe(405);
  });

  it("unknown registry version returns 404", async () => {
    const res = await fetchJson("/registry/9.9.9");
    expect(res.status).toBe(404);
  });

  it("'latest' returns 400", async () => {
    const res = await fetchJson("/registry/latest");
    expect(res.status).toBe(400);
  });

  it("unknown route returns 404", async () => {
    const res = await fetchJson("/nonexistent");
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 5. Concurrent anonymous requests
// ---------------------------------------------------------------------------

describe("concurrent anonymous requests", () => {
  it("handles concurrent requests correctly", async () => {
    const requests = Array.from({ length: 10 }, () =>
      fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0"),
    );
    const responses = await Promise.all(requests);

    // All succeed
    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    // All return same body
    const bodies = await Promise.all(responses.map(async (r) => r.text()));
    const first = bodies[0];
    for (const body of bodies) {
      expect(body).toBe(first);
    }
  });

  it("concurrent requests with mixed routes all succeed", async () => {
    const routes = [
      "/registry/1.0.0",
      "/registry/1.0.0/manifest",
      "/registry/1.0.0/components",
      "/registry/1.0.0/artifacts/component/navbar/1.0.0",
      "/registry/1.0.0/artifacts/token-set/design-tokens/1.0.0",
    ];
    const requests = routes.map((route) => fetchJson(route));
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Anonymous requests with auth headers produce same result
// ---------------------------------------------------------------------------

describe("auth headers don't change responses", () => {
  it("Authorization header produces same response", async () => {
    const anon = await fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0");
    const withAuth = await fetchJson("/registry/1.0.0/artifacts/component/navbar/1.0.0", {
      headers: { Authorization: "Bearer secret-token-12345" },
    });
    expect(withAuth.status).toBe(anon.status);
    const anonBody = await anon.text();
    const authBody = await withAuth.text();
    expect(authBody).toBe(anonBody);
  });

  it("Cookie header produces same response", async () => {
    const anon = await fetchJson("/registry/1.0.0");
    const withCookie = await fetchJson("/registry/1.0.0", {
      headers: { Cookie: "session=abc123; token=xyz" },
    });
    const anonBody = await anon.text();
    const cookieBody = await withCookie.text();
    expect(cookieBody).toBe(anonBody);
  });
});
