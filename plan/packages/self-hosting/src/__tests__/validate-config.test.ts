/**
 * Config validator unit tests.
 */

import { describe, it, expect } from "vitest";
import { validateSelfHostConfig } from "../validate-config.js";

function validConfigInput(): Record<string, unknown> {
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

describe("validateSelfHostConfig", () => {
  it("accepts a valid configuration", () => {
    const result = validateSelfHostConfig(validConfigInput());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.config).toBeDefined();
    expect(result.config?.configSchemaVersion).toBe("1.0.0");
  });

  it("rejects non-object input", () => {
    const result = validateSelfHostConfig("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects account/licenseKey/hostedPlan/subscription/payment/quota fields", () => {
    for (const field of [
      "account",
      "licenseKey",
      "hostedPlan",
      "subscription",
      "payment",
      "quota",
    ]) {
      const input = { ...validConfigInput(), [field]: "should-be-rejected" };
      const result = validateSelfHostConfig(input);
      expect(result.valid).toBe(false);
      const rejectedError = result.errors.find((e) => e.path === `/${field}`);
      expect(rejectedError).toBeDefined();
    }
  });

  it("rejects unknown fields", () => {
    const input = { ...validConfigInput(), unknownField: "value" };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "/unknownField")).toBe(true);
  });

  it("rejects wrong schema version", () => {
    const input = { ...validConfigInput(), configSchemaVersion: "2.0.0" };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "/configSchemaVersion")).toBe(true);
  });

  it("requires at least one enabled interface", () => {
    const input = { ...validConfigInput(), enabledInterfaces: [] };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "/enabledInterfaces")).toBe(true);
  });

  it("rejects invalid port numbers", () => {
    const input = validConfigInput();
    (input.endpoints as Record<string, unknown>).registry = {
      host: "localhost",
      port: 0,
      basePath: "/reg",
    };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("port"))).toBe(true);
  });

  it("rejects duplicate host+port+path combinations", () => {
    const input = validConfigInput();
    const endpoints = input.endpoints as Record<string, unknown>;
    endpoints.registry = { host: "localhost", port: 8080, basePath: "/same" };
    endpoints["public-api"] = { host: "localhost", port: 8080, basePath: "/same" };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "duplicate_endpoint")).toBe(true);
  });

  it("rejects path traversal in storage root", () => {
    const input = { ...validConfigInput(), storage: { type: "local", root: "/data/../etc" } };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "path_traversal")).toBe(true);
  });

  it("rejects retention outside 0..365", () => {
    const input = { ...validConfigInput(), retentionDays: 400 };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "/retentionDays")).toBe(true);
  });

  it("rejects telemetry: true for MVP", () => {
    const input = { ...validConfigInput(), telemetry: true };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "/telemetry")).toBe(true);
  });

  it("accumulates all errors at once", () => {
    const input = {
      configSchemaVersion: "wrong",
      serviceVersion: "",
      enabledInterfaces: [],
      endpoints: "not-object",
      storage: "not-object",
      backupStorage: "not-object",
      retentionDays: -1,
      resourceLimits: "not-object",
      tls: "not-object",
      proxy: "not-object",
      telemetry: true,
    };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);
  });

  it("validates S3-compatible storage config", () => {
    const input = {
      ...validConfigInput(),
      storage: {
        type: "s3-compatible",
        endpoint: "https://s3.example.com",
        bucket: "my-bucket",
        credentialRef: "aws-creds-ref",
      },
    };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(true);
  });

  it("rejects S3 storage with missing fields", () => {
    const input = {
      ...validConfigInput(),
      storage: { type: "s3-compatible", endpoint: "", bucket: "", credentialRef: "" },
    };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
  });

  it("requires TLS cert/key refs when enabled", () => {
    const input = { ...validConfigInput(), tls: { enabled: true } };
    const result = validateSelfHostConfig(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "missing_cert_ref")).toBe(true);
  });
});
