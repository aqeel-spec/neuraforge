/**
 * Closed runtime validator for SelfHostConfig.
 *
 * Accepts unknown and accumulates every FieldError.
 * Rejects unknown fields, entitlement fields, and invalid values.
 */

import type { FieldError } from "@neuraforge-ui/schemas";
import type {
  ConfigValidationResult,
  EnabledInterface,
  EndpointConfig,
  ResourceLimits,
  SelfHostConfig,
  StorageConfig,
  TlsConfig,
  ProxyConfig,
} from "./config-types.js";
import { CONFIG_SCHEMA_VERSION, REJECTED_CONFIG_FIELDS } from "./config-types.js";

const VALID_INTERFACES: readonly EnabledInterface[] = ["registry", "public-api", "mcp", "docs"];

function fieldError(code: string, path: string, constraint: string, guidance: string): FieldError {
  return { code, path, constraint, guidance };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeHost(host: string): boolean {
  if (host.length === 0 || host.length > 253) return false;
  // Allow localhost, IPs, and valid hostnames
  if (/^[a-zA-Z0-9._-]+$/.test(host)) return true;
  if (/^\[[:0-9a-fA-F]+\]$/.test(host)) return true; // IPv6 bracket notation
  return false;
}

function isConfinedPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("//")) return false;
  return true;
}

function validateEndpoint(
  value: unknown,
  path: string,
  errors: FieldError[],
): EndpointConfig | undefined {
  if (!isRecord(value)) {
    errors.push(
      fieldError("invalid_type", path, "must be an object", "Provide host, port, basePath"),
    );
    return undefined;
  }

  const host = value.host;
  const port = value.port;
  const basePath = value.basePath;

  if (typeof host !== "string" || !isSafeHost(host)) {
    errors.push(
      fieldError(
        "invalid_host",
        `${path}/host`,
        "must be a safe hostname",
        "Use localhost or a valid hostname",
      ),
    );
  }

  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(
      fieldError(
        "invalid_port",
        `${path}/port`,
        "must be integer 1..65535",
        "Use a valid port number",
      ),
    );
  }

  if (typeof basePath !== "string" || !isConfinedPath(basePath)) {
    errors.push(
      fieldError(
        "invalid_base_path",
        `${path}/basePath`,
        "must start with / and be confined",
        "Use a valid base path without .. or \\",
      ),
    );
  }

  if (typeof host === "string" && typeof port === "number" && typeof basePath === "string") {
    return { host: host, port: port, basePath: basePath };
  }
  return undefined;
}

function validateStorage(
  value: unknown,
  path: string,
  errors: FieldError[],
): StorageConfig | undefined {
  if (!isRecord(value)) {
    errors.push(
      fieldError(
        "invalid_type",
        path,
        "must be an object",
        "Provide type and storage-specific fields",
      ),
    );
    return undefined;
  }

  const type = value.type;
  if (type === "local") {
    const root = value.root;
    if (typeof root !== "string" || root.length === 0) {
      errors.push(
        fieldError(
          "invalid_root",
          `${path}/root`,
          "must be non-empty string",
          "Provide a valid directory path",
        ),
      );
      return undefined;
    }
    if (root.includes("..")) {
      errors.push(
        fieldError(
          "path_traversal",
          `${path}/root`,
          "must not contain ..",
          "Use an absolute confined path",
        ),
      );
      return undefined;
    }
    return { type: "local", root };
  }

  if (type === "s3-compatible") {
    const endpoint = value.endpoint;
    const bucket = value.bucket;
    const credentialRef = value.credentialRef;

    if (typeof endpoint !== "string" || endpoint.length === 0) {
      errors.push(
        fieldError(
          "invalid_endpoint",
          `${path}/endpoint`,
          "must be a valid URL string",
          "Provide S3-compatible endpoint URL",
        ),
      );
    }
    if (typeof bucket !== "string" || bucket.length === 0) {
      errors.push(
        fieldError(
          "invalid_bucket",
          `${path}/bucket`,
          "must be non-empty string",
          "Provide S3 bucket name",
        ),
      );
    }
    if (typeof credentialRef !== "string" || credentialRef.length === 0) {
      errors.push(
        fieldError(
          "invalid_credential_ref",
          `${path}/credentialRef`,
          "must be non-empty string reference",
          "Provide a credential reference (not secret bytes)",
        ),
      );
    }

    if (
      typeof endpoint === "string" &&
      typeof bucket === "string" &&
      typeof credentialRef === "string"
    ) {
      return { type: "s3-compatible", endpoint, bucket, credentialRef };
    }
    return undefined;
  }

  errors.push(
    fieldError(
      "invalid_storage_type",
      `${path}/type`,
      "must be 'local' or 's3-compatible'",
      "Choose a valid storage type",
    ),
  );
  return undefined;
}

/**
 * Validates unknown input as SelfHostConfig. Accumulates all errors.
 */
export function validateSelfHostConfig(input: unknown): ConfigValidationResult {
  const errors: FieldError[] = [];

  if (!isRecord(input)) {
    errors.push(
      fieldError("invalid_type", "/", "must be an object", "Provide a valid configuration object"),
    );
    return { valid: false, errors };
  }

  // Check for rejected entitlement fields
  for (const rejected of REJECTED_CONFIG_FIELDS) {
    if (rejected in input) {
      errors.push(
        fieldError(
          "rejected_field",
          `/${rejected}`,
          "must not be present",
          `Remove '${rejected}' — self-hosting has no NeuraForge account/quota requirements`,
        ),
      );
    }
  }

  // Check for unknown fields
  const knownFields = new Set([
    "configSchemaVersion",
    "serviceVersion",
    "enabledInterfaces",
    "endpoints",
    "storage",
    "backupStorage",
    "retentionDays",
    "resourceLimits",
    "tls",
    "proxy",
    "telemetry",
  ]);
  for (const key of Object.keys(input)) {
    if (!knownFields.has(key)) {
      errors.push(
        fieldError(
          "unknown_field",
          `/${key}`,
          "must not be present",
          `Remove unknown field '${key}'`,
        ),
      );
    }
  }

  // configSchemaVersion
  if (input.configSchemaVersion !== CONFIG_SCHEMA_VERSION) {
    errors.push(
      fieldError(
        "invalid_schema_version",
        "/configSchemaVersion",
        `must be '${CONFIG_SCHEMA_VERSION}'`,
        "Set configSchemaVersion to '1.0.0'",
      ),
    );
  }

  // serviceVersion
  if (typeof input.serviceVersion !== "string" || input.serviceVersion.length === 0) {
    errors.push(
      fieldError(
        "invalid_service_version",
        "/serviceVersion",
        "must be non-empty string",
        "Provide your service version",
      ),
    );
  }

  // enabledInterfaces
  const interfaces = input.enabledInterfaces;
  const validInterfaces: EnabledInterface[] = [];
  if (!Array.isArray(interfaces) || interfaces.length === 0) {
    errors.push(
      fieldError(
        "invalid_interfaces",
        "/enabledInterfaces",
        "must be non-empty array of interfaces",
        "Enable at least one: registry, public-api, mcp, docs",
      ),
    );
  } else {
    for (let i = 0; i < interfaces.length; i++) {
      const iface: unknown = interfaces[i];
      if (typeof iface !== "string" || !VALID_INTERFACES.includes(iface as EnabledInterface)) {
        errors.push(
          fieldError(
            "invalid_interface",
            `/enabledInterfaces/${String(i)}`,
            "must be registry|public-api|mcp|docs",
            "Use a valid interface name",
          ),
        );
      } else {
        validInterfaces.push(iface as EnabledInterface);
      }
    }
  }

  // endpoints — validate per enabled interface and check duplicates
  const endpoints: Record<string, EndpointConfig> = {};
  const endpointsInput = input.endpoints;
  if (!isRecord(endpointsInput)) {
    errors.push(
      fieldError(
        "invalid_type",
        "/endpoints",
        "must be an object",
        "Provide endpoints for each enabled interface",
      ),
    );
  } else {
    const seen = new Set<string>();
    for (const iface of validInterfaces) {
      const ep = validateEndpoint(endpointsInput[iface], `/endpoints/${iface}`, errors);
      if (ep) {
        const key = `${ep.host}:${String(ep.port)}${ep.basePath}`;
        if (seen.has(key)) {
          errors.push(
            fieldError(
              "duplicate_endpoint",
              `/endpoints/${iface}`,
              "host+port+path must be unique",
              "Use distinct endpoints for each interface",
            ),
          );
        }
        seen.add(key);
        endpoints[iface] = ep;
      }
    }
  }

  // storage
  const storage = validateStorage(input.storage, "/storage", errors);

  // backupStorage
  const backupStorage = validateStorage(input.backupStorage, "/backupStorage", errors);

  // retentionDays
  const retention = input.retentionDays;
  if (
    typeof retention !== "number" ||
    !Number.isInteger(retention) ||
    retention < 0 ||
    retention > 365
  ) {
    errors.push(
      fieldError(
        "invalid_retention",
        "/retentionDays",
        "must be integer 0..365",
        "Set retention between 0 and 365 days",
      ),
    );
  }

  // resourceLimits
  let resourceLimits: ResourceLimits | undefined;
  const limitsInput = input.resourceLimits;
  if (!isRecord(limitsInput)) {
    errors.push(
      fieldError(
        "invalid_type",
        "/resourceLimits",
        "must be an object",
        "Provide memoryMB, maxConcurrentRequests, mcpCallsPerMinute",
      ),
    );
  } else {
    const mem = limitsInput.memoryMB;
    const maxConc = limitsInput.maxConcurrentRequests;
    const mcpRate = limitsInput.mcpCallsPerMinute;

    if (typeof mem !== "number" || !Number.isInteger(mem) || mem < 1) {
      errors.push(
        fieldError(
          "invalid_memory",
          "/resourceLimits/memoryMB",
          "must be positive integer",
          "Set memory limit in MB",
        ),
      );
    }
    if (typeof maxConc !== "number" || !Number.isInteger(maxConc) || maxConc < 1) {
      errors.push(
        fieldError(
          "invalid_concurrency",
          "/resourceLimits/maxConcurrentRequests",
          "must be positive integer",
          "Set max concurrent requests",
        ),
      );
    }
    if (typeof mcpRate !== "number" || !Number.isInteger(mcpRate) || mcpRate < 1) {
      errors.push(
        fieldError(
          "invalid_mcp_rate",
          "/resourceLimits/mcpCallsPerMinute",
          "must be positive integer",
          "Set MCP calls per minute limit",
        ),
      );
    }

    if (typeof mem === "number" && typeof maxConc === "number" && typeof mcpRate === "number") {
      resourceLimits = {
        memoryMB: mem,
        maxConcurrentRequests: maxConc,
        mcpCallsPerMinute: mcpRate,
      };
    }
  }

  // tls
  let tls: TlsConfig | undefined;
  const tlsInput = input.tls;
  if (!isRecord(tlsInput)) {
    errors.push(
      fieldError("invalid_type", "/tls", "must be an object", "Provide TLS configuration"),
    );
  } else {
    if (typeof tlsInput.enabled !== "boolean") {
      errors.push(
        fieldError(
          "invalid_tls_enabled",
          "/tls/enabled",
          "must be boolean",
          "Set tls.enabled to true or false",
        ),
      );
    }
    if (tlsInput.enabled === true) {
      if (typeof tlsInput.certRef !== "string") {
        errors.push(
          fieldError(
            "missing_cert_ref",
            "/tls/certRef",
            "required when TLS is enabled",
            "Provide certificate reference",
          ),
        );
      }
      if (typeof tlsInput.keyRef !== "string") {
        errors.push(
          fieldError(
            "missing_key_ref",
            "/tls/keyRef",
            "required when TLS is enabled",
            "Provide key reference",
          ),
        );
      }
    }
    tls = {
      enabled: tlsInput.enabled === true,
      ...(typeof tlsInput.certRef === "string" ? { certRef: tlsInput.certRef } : {}),
      ...(typeof tlsInput.keyRef === "string" ? { keyRef: tlsInput.keyRef } : {}),
    };
  }

  // proxy
  let proxy: ProxyConfig | undefined;
  const proxyInput = input.proxy;
  if (!isRecord(proxyInput)) {
    errors.push(
      fieldError("invalid_type", "/proxy", "must be an object", "Provide proxy configuration"),
    );
  } else {
    if (typeof proxyInput.enabled !== "boolean") {
      errors.push(
        fieldError(
          "invalid_proxy_enabled",
          "/proxy/enabled",
          "must be boolean",
          "Set proxy.enabled to true or false",
        ),
      );
    }
    proxy = {
      enabled: proxyInput.enabled === true,
      ...(typeof proxyInput.upstreamRef === "string"
        ? { upstreamRef: proxyInput.upstreamRef }
        : {}),
    };
  }

  // telemetry — must be explicitly false for MVP
  if (input.telemetry !== false) {
    errors.push(
      fieldError(
        "telemetry_must_be_false",
        "/telemetry",
        "must be false for MVP",
        "Set telemetry to false — MVP does not support telemetry",
      ),
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // All fields are guaranteed defined here since errors would have been pushed
  if (!storage || !backupStorage || !resourceLimits || !tls || !proxy) {
    return { valid: false, errors };
  }

  const config: SelfHostConfig = {
    configSchemaVersion: CONFIG_SCHEMA_VERSION,
    serviceVersion: input.serviceVersion as string,
    enabledInterfaces: validInterfaces,
    endpoints: endpoints as Record<EnabledInterface, EndpointConfig>,
    storage,
    backupStorage,
    retentionDays: retention as number,
    resourceLimits,
    tls,
    proxy,
    telemetry: false,
  };

  return { valid: true, errors: [], config };
}
