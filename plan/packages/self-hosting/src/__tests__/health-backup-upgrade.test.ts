/**
 * Health, backup, restore, upgrade, rollback, and integrity tests.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { buildReleaseBundle } from "@neuraforge-ui/registry-builder";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";
import { buildFixtureInput } from "@neuraforge-ui/registry-builder/testing";
import { prepareSelfHostedRuntime } from "../prepare.js";
import { createHealthReport, healthReportToJson } from "../health.js";
import { createBackup, restoreBackup } from "../backup.js";
import { upgradeRuntime, rollbackUpgrade } from "../upgrade.js";
import { verifyRuntimeIntegrity } from "../integrity.js";

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

async function buildBundle(version = "1.0.0"): Promise<ReleaseBundle> {
  const input = await buildFixtureInput({ componentCount: 20, withApproval: true });
  const modifiedInput = { ...input, releaseVersion: version, registryVersion: version };
  const result = await buildReleaseBundle(modifiedInput);
  if (!result.success) {
    throw new Error(`Build failed: ${result.errors.map((e) => e.guidance).join(", ")}`);
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

function tamperToken(bundle: ReleaseBundle): ReleaseBundle {
  const tampered = JSON.parse(JSON.stringify(bundle)) as typeof bundle;
  const tokenDoc = tampered.snapshot.tokenArtifact.tokenDocument;
  (tokenDoc.tokens as Record<string, unknown>)["color.evil"] = {
    category: "color",
    type: "color",
    value: "#ff0000",
  };
  return tampered;
}

describe("createHealthReport", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildBundle();
  }, 30_000);

  it("returns deterministic health report with no secrets", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const report = createHealthReport(result.value);
    expect(report.serviceVersion).toBe("0.1.0");
    expect(report.registryVersion).toBe("1.0.0");
    expect(report.configSchemaVersion).toBe("1.0.0");
    expect(report.bundleAddress).toBe(validBundle.bundleAddress);
    expect(report.bundleChecksum).toBe(validBundle.bundleChecksum.digest);
    expect(report.enabledInterfaces).toHaveLength(4);

    // No credential values
    const json = JSON.stringify(healthReportToJson(report));
    expect(json).not.toContain("secret");
    expect(json).not.toContain("password");
  }, 30_000);
});

describe("createBackup / restoreBackup", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildBundle();
  }, 30_000);

  it("creates deterministic backup and restores successfully", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const backup = await createBackup(result.value.config, validBundle, "2024-06-01T00:00:00Z");
    expect(backup.schemaVersion).toBe("1.0.0");
    expect(backup.createdAt).toBe("2024-06-01T00:00:00Z");
    expect(typeof backup.archiveChecksum).toBe("string");
    expect(backup.archiveChecksum.length).toBe(64);

    // Restore
    const restoreResult = await restoreBackup(backup);
    expect(restoreResult.ok).toBe(true);
    if (restoreResult.ok) {
      expect(restoreResult.value.prepared.config.serviceVersion).toBe("0.1.0");
    }
  }, 30_000);

  it("backup is deterministic — same inputs produce same checksum", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    if (!result.ok) return;

    const backup1 = await createBackup(result.value.config, validBundle, "2024-06-01T00:00:00Z");
    const backup2 = await createBackup(result.value.config, validBundle, "2024-06-01T00:00:00Z");
    expect(backup1.archiveChecksum).toBe(backup2.archiveChecksum);
  }, 30_000);

  it("restoreBackup rejects tampered archive", async () => {
    const result = await prepareSelfHostedRuntime(validConfig(), validBundle);
    if (!result.ok) return;

    const backup = await createBackup(result.value.config, validBundle, "2024-06-01T00:00:00Z");
    const tampered = { ...backup, archiveChecksum: "0".repeat(64) };
    const restoreResult = await restoreBackup(tampered);
    expect(restoreResult.ok).toBe(false);
  }, 30_000);

  it("restoreBackup rejects invalid shape", async () => {
    const restoreResult = await restoreBackup("not-an-object");
    expect(restoreResult.ok).toBe(false);
  });
});

describe("upgradeRuntime / rollbackUpgrade", () => {
  let bundle100: ReleaseBundle;
  let bundle200: ReleaseBundle;

  beforeAll(async () => {
    bundle100 = await buildBundle("1.0.0");
    bundle200 = await buildBundle("2.0.0");
  }, 60_000);

  it("upgrades to higher version and rolls back", async () => {
    const prepResult = await prepareSelfHostedRuntime(validConfig(), bundle100);
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;

    const upgradeResult = await upgradeRuntime(prepResult.value, bundle200);
    expect(upgradeResult.ok).toBe(true);
    if (!upgradeResult.ok) return;

    expect(upgradeResult.value.current.bundle.snapshot.releaseVersion).toBe("2.0.0");
    expect(upgradeResult.value.previousBundle.snapshot.releaseVersion).toBe("1.0.0");

    // Rollback
    const rollbackResult = await rollbackUpgrade(upgradeResult.value);
    expect(rollbackResult.ok).toBe(true);
    if (rollbackResult.ok) {
      expect(rollbackResult.value.bundle.snapshot.releaseVersion).toBe("1.0.0");
    }
  }, 60_000);

  it("rejects same-version upgrade", async () => {
    const prepResult = await prepareSelfHostedRuntime(validConfig(), bundle100);
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;

    const upgradeResult = await upgradeRuntime(prepResult.value, bundle100);
    expect(upgradeResult.ok).toBe(false);
    if (!upgradeResult.ok) {
      expect(upgradeResult.error.code).toBe("version_not_progressing");
    }
  }, 30_000);

  it("rejects downgrade", async () => {
    const prepResult = await prepareSelfHostedRuntime(validConfig(), bundle200);
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;

    const upgradeResult = await upgradeRuntime(prepResult.value, bundle100);
    expect(upgradeResult.ok).toBe(false);
    if (!upgradeResult.ok) {
      expect(upgradeResult.error.code).toBe("version_not_progressing");
    }
  }, 30_000);

  it("rejects tampered new bundle", async () => {
    const prepResult = await prepareSelfHostedRuntime(validConfig(), bundle100);
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;

    const tampered = tamperBundle(bundle200);
    const upgradeResult = await upgradeRuntime(prepResult.value, tampered);
    expect(upgradeResult.ok).toBe(false);
  }, 30_000);
});

describe("verifyRuntimeIntegrity", () => {
  let validBundle: ReleaseBundle;

  beforeAll(async () => {
    validBundle = await buildBundle();
  }, 30_000);

  it("reports valid for intact bundle", async () => {
    const result = await verifyRuntimeIntegrity(validBundle);
    expect(result.valid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  }, 30_000);

  it("reports mismatches for tampered source", async () => {
    const tampered = tamperBundle(validBundle);
    const result = await verifyRuntimeIntegrity(tampered);
    expect(result.valid).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
  }, 30_000);

  it("reports mismatches for tampered token", async () => {
    const tampered = tamperToken(validBundle);
    const result = await verifyRuntimeIntegrity(tampered);
    expect(result.valid).toBe(false);
    expect(result.mismatches.some((m) => m.path.includes("token"))).toBe(true);
  }, 30_000);

  it("works with PreparedRuntime input", async () => {
    const prepResult = await prepareSelfHostedRuntime(validConfig(), validBundle);
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;

    const result = await verifyRuntimeIntegrity(prepResult.value);
    expect(result.valid).toBe(true);
  }, 30_000);
});
