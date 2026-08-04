/**
 * Runtime preparation and start tests.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { buildReleaseBundle } from "@neuraforge-ui/registry-builder";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import { buildFixtureInput } from "@neuraforge-ui/registry-builder/testing";
import { prepareSelfHostedRuntime } from "../prepare.js";
import { startSelfHostedRuntime } from "../start.js";
import type { BindRequest } from "../start.js";

function validConfig(): Record<string, unknown> {
  return {
    configSchemaVersion: "1.0.0",
    serviceVersion: "0.1.0",
    enabledInterfaces: ["registry", "public-api", "mcp", "docs"],
    endpoints: {
      registry: { host: "localhost", port: 8080, basePath: "/registry" },
      "public-api": { host: "localhost", port: 8080, basePath: "/api" },
      mcp: { host: "localhost", port: 8081, basePath: "/mcp" },
      docs: { host: "localhost", port: 8080, basePath: "/docs" },
    },
    storage: { type: "local", root: "/data/neuraforge" },
    backupStorage: { type: "local", root: "/backups/neuraforge" },
    retentionDays: 30,
    resourceLimits: { memoryMB: 512, maxConcurrentRequests: 100, mcpCallsPerMinute: 60 },
    tls: { enabled: false },
    proxy: { enabled: false },
    telemetry: false,
  };
}

async function buildValidBundle(): Promise<ReleaseBundle> {
  const input = await buildFixtureInput({ componentCount: 20, withApproval: true });
  const result = await buildReleaseBundle(input);
  if (!result.success) {
    throw new Error(`Fixture build failed: ${result.errors.map((e) => e.guidance).join(", ")}`);
  }
  return result.bundle;
}

function tamperBundle(bundle: ReleaseBundle): ReleaseBundle {
  const tampered = JSON.parse(JSON.stringify(bundle)) as typeof bundle;
  const firstComponent = tampered.snapshot.components[0];
  if (firstComponent) {
    const firstFile = firstComponent.sourceFiles[0];
    if (firstFile) {
      (firstFile as { content: string }).content = "// tampered\n";
    }
  }
  return tampered;
}

describe("prepareSelfHostedRuntime", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildValidBundle();
  }, 30_000);

  it("succeeds with valid config and valid bundle", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.publicApi).not.toBeNull();
      expect(result.value.mcpDispatcher).not.toBeNull();
      expect(result.value.docsHandler).not.toBeNull();
      expect(result.value.enabledInterfaces).toHaveLength(4);
    }
  }, 30_000);

  it("fails with invalid config", async () => {
    const result = await prepareSelfHostedRuntime({ invalid: true }, validBundle);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("fails with tampered bundle", async () => {
    const tampered = tamperBundle(validBundle);
    const result = await prepareSelfHostedRuntime(validConfig(), tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors.some((e) => e.code === "bundle_integrity")).toBe(true);
    }
  }, 30_000);

  it("only creates enabled interfaces", async () => {
    const config = { ...validConfig(), enabledInterfaces: ["docs"] };
    const result = await prepareSelfHostedRuntime(config, validBundle);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.docsHandler).not.toBeNull();
      expect(result.value.mcpDispatcher).toBeNull();
      expect(result.value.publicApi).toBeNull();
    }
  }, 30_000);
});

describe("startSelfHostedRuntime", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildValidBundle();
  }, 30_000);

  it("invokes binder for each enabled endpoint", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const bindings: BindRequest[] = [];
    await startSelfHostedRuntime(result.value, (req) => {
      bindings.push(req);
      return Promise.resolve();
    });

    expect(bindings.length).toBe(4);
    expect(bindings.map((b) => b.interfaceId).sort()).toEqual([
      "docs",
      "mcp",
      "public-api",
      "registry",
    ]);
  }, 30_000);

  it("invalid config/tampered bundle invokes binder zero times", async () => {
    const tampered = tamperBundle(validBundle);
    const prepResult = await prepareSelfHostedRuntime(validConfig(), tampered);
    expect(prepResult.ok).toBe(false);
    // Binder never called because prepare failed
  }, 30_000);
});
