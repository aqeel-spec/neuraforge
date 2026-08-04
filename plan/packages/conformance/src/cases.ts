/**
 * Conformance case definitions.
 *
 * Each case is a deterministic named test that compares canonical JSON/checksums
 * across Registry, Public API, and MCP surfaces. Never hides failures.
 */

import type { ConformanceAdapters, ConformanceCaseResult, ConformanceMismatch } from "./types.js";
import { canonicalizeJson } from "@neuraforge-ui/catalog-core";
import { toJsonValue } from "@neuraforge-ui/registry-builder";
import type { ReleaseBundle } from "@neuraforge-ui/registry-builder";

export const CONFORMANCE_CASE_NAMES = [
  "snapshot_checksum_version",
  "component_parity_registry_api_mcp",
  "token_parity_registry_api_mcp",
  "list_20_components_six_categories",
  "list_deterministic_pagination",
  "anonymous_api_access",
  "mcp_list_components",
  "mcp_get_component",
  "mcp_search_components",
  "mcp_get_design_tokens",
  "unknown_version_structured_error",
  "no_private_entitlement_fields",
] as const;

export type ConformanceCaseName = (typeof CONFORMANCE_CASE_NAMES)[number];

/** Forbidden fields that must never appear in any response. */
const FORBIDDEN_FIELDS = [
  "account",
  "licenseKey",
  "hostedPlan",
  "subscription",
  "payment",
  "quota",
  "entitlement",
  "privateVariant",
  "paidOnlyVariant",
  "paymentRequired",
  "licenseKeyRequired",
] as const;

// ---------------------------------------------------------------------------
// Helpers — simple value extraction to avoid complex type indexing
// ---------------------------------------------------------------------------

function mismatch(path: string, expected: string, actual: string): ConformanceMismatch {
  return { path, expected, actual };
}

function passed(caseName: string): ConformanceCaseResult {
  return { caseName, passed: true, mismatchDetails: [] };
}

function failed(caseName: string, details: readonly ConformanceMismatch[]): ConformanceCaseResult {
  return { caseName, passed: false, mismatchDetails: details };
}

function canonicalize(value: unknown): string {
  return canonicalizeJson(toJsonValue(value));
}

/** Safely get a string property from a plain object. */
function getString(obj: unknown, key: string): string | undefined {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return undefined;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : undefined;
}

/** Safely get nested string: obj[key1][key2] */
function getNestedString(obj: unknown, key1: string, key2: string): string | undefined {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return undefined;
  const nested = (obj as Record<string, unknown>)[key1];
  return getString(nested, key2);
}

/** Safely get a property as unknown. */
function getProp(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return undefined;
  return (obj as Record<string, unknown>)[key];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepSearchForFields(
  value: unknown,
  forbidden: readonly string[],
  path: string,
): ConformanceMismatch[] {
  const found: ConformanceMismatch[] = [];
  if (value === null || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item: unknown = value[i];
      if (item !== undefined) {
        found.push(...deepSearchForFields(item, forbidden, `${path}[${String(i)}]`));
      }
    }
    return found;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (forbidden.includes(key)) {
      found.push(mismatch(`${path}.${key}`, "absent", "present"));
    }
    const val: unknown = record[key];
    if (val !== undefined) {
      found.push(...deepSearchForFields(val, forbidden, `${path}.${key}`));
    }
  }
  return found;
}

export type CaseRunner = (
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
) => Promise<ConformanceCaseResult>;

// ---------------------------------------------------------------------------
// Case: snapshot_checksum_version
// ---------------------------------------------------------------------------
async function caseSnapshotChecksumVersion(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "snapshot_checksum_version";
  const mismatches: ConformanceMismatch[] = [];

  const snapshot = await adapters.registry.getSnapshot();
  if (!isPlainObject(snapshot)) {
    return failed(caseName, [mismatch("/snapshot", "object", typeof snapshot)]);
  }

  const expectedVersion = bundle.snapshot.registryVersion;
  const expectedChecksum = bundle.snapshot.snapshotChecksum.digest;

  const actualVersion = getString(snapshot, "registryVersion");
  if (actualVersion !== expectedVersion) {
    mismatches.push(mismatch("/registryVersion", expectedVersion, String(actualVersion)));
  }

  const digest = getNestedString(snapshot, "snapshotChecksum", "digest");
  if (digest === undefined) {
    mismatches.push(mismatch("/snapshotChecksum", "object with digest", "missing"));
  } else if (digest !== expectedChecksum) {
    mismatches.push(mismatch("/snapshotChecksum/digest", expectedChecksum, digest));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: component_parity_registry_api_mcp
// ---------------------------------------------------------------------------
async function caseComponentParity(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "component_parity_registry_api_mcp";
  const mismatches: ConformanceMismatch[] = [];

  const firstComponent = bundle.snapshot.components[0];
  if (!firstComponent) {
    return failed(caseName, [mismatch("/components", "at least 1", "0")]);
  }

  const stableId = firstComponent.ref.stableId;
  const version = firstComponent.ref.version;
  const registryVersion = bundle.snapshot.registryVersion;

  // Registry adapter
  const registryResult = await adapters.registry.getComponent(stableId, version);

  // Public API
  const apiResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/artifacts/component/${stableId}/${version}`,
  );

  // MCP dispatcher
  const mcpContext = toJsonValue({ registryVersion, requestId: "conformance-parity" });
  const mcpInput = toJsonValue({ stableId, version });
  const mcpResult = await adapters.mcp.dispatch("get_component", mcpInput, mcpContext);

  // Extract values
  const regOk = getProp(registryResult, "ok") === true;
  const regValue = regOk ? getProp(registryResult, "value") : null;
  const apiBody = apiResult.body;
  const mcpOk = getProp(mcpResult, "ok") === true;
  const mcpValue = mcpOk ? getProp(mcpResult, "value") : null;

  if (regValue && apiBody && apiResult.status === 200 && mcpValue) {
    // Compare component checksum digest across surfaces
    const regChecksum = getNestedString(regValue, "checksum", "digest");
    const apiChecksum = getNestedString(apiBody, "checksum", "digest");
    const mcpChecksum = getNestedString(mcpValue, "checksum", "digest");

    if (regChecksum && apiChecksum && regChecksum !== apiChecksum) {
      mismatches.push(mismatch("/checksum/registry_vs_api", regChecksum, apiChecksum));
    }
    if (regChecksum && mcpChecksum && regChecksum !== mcpChecksum) {
      mismatches.push(mismatch("/checksum/registry_vs_mcp", regChecksum, mcpChecksum));
    }

    // Compare source content parity
    const regFiles = getProp(regValue, "sourceFiles");
    const mcpFiles = getProp(mcpValue, "sourceFiles");
    if (Array.isArray(regFiles) && Array.isArray(mcpFiles)) {
      const regContent = getString(regFiles[0], "content");
      const mcpContent = getString(mcpFiles[0], "content");
      if (regContent && mcpContent && regContent !== mcpContent) {
        mismatches.push(
          mismatch("/sourceFiles[0]/content", regContent.slice(0, 40), mcpContent.slice(0, 40)),
        );
      }
    }
  } else {
    if (!regValue)
      mismatches.push(mismatch("/registry", "ok:true", canonicalize(registryResult).slice(0, 80)));
    if (!apiBody || apiResult.status !== 200)
      mismatches.push(mismatch("/api/status", "200", String(apiResult.status)));
    if (!mcpValue)
      mismatches.push(mismatch("/mcp", "ok:true", canonicalize(mcpResult).slice(0, 80)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: token_parity_registry_api_mcp
// ---------------------------------------------------------------------------
async function caseTokenParity(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "token_parity_registry_api_mcp";
  const mismatches: ConformanceMismatch[] = [];

  const tokenVersion = bundle.snapshot.tokenArtifact.releaseVersion;
  const expectedDigest = bundle.snapshot.tokenArtifact.checksum.digest;
  const registryVersion = bundle.snapshot.registryVersion;

  // Registry
  const regResult = await adapters.registry.getTokenArtifact(tokenVersion);
  const regOk = getProp(regResult, "ok") === true;
  const regValue = regOk ? getProp(regResult, "value") : null;

  // Public API
  const apiResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/artifacts/token-set/design-tokens/${tokenVersion}`,
  );
  const apiBody = apiResult.body;

  // MCP
  const mcpContext = toJsonValue({ registryVersion, requestId: "conformance-token" });
  const mcpInput = toJsonValue({ exactVersion: tokenVersion });
  const mcpResult = await adapters.mcp.dispatch("get_design_tokens", mcpInput, mcpContext);
  const mcpOk = getProp(mcpResult, "ok") === true;
  const mcpValue = mcpOk ? getProp(mcpResult, "value") : null;

  // Compare digests
  if (regValue) {
    const regDigest = getNestedString(regValue, "checksum", "digest");
    if (regDigest !== expectedDigest) {
      mismatches.push(mismatch("/registry/checksum", expectedDigest, String(regDigest)));
    }
  } else {
    mismatches.push(mismatch("/registry/token", "ok:true", canonicalize(regResult).slice(0, 80)));
  }

  if (apiBody && apiResult.status === 200) {
    const apiDigest =
      getNestedString(apiBody, "checksum", "digest") ??
      getNestedString(getProp(apiBody, "lineage"), "checksum", "digest");
    if (apiDigest !== undefined && apiDigest !== expectedDigest) {
      mismatches.push(mismatch("/api/checksum", expectedDigest, String(apiDigest)));
    }
  } else {
    mismatches.push(mismatch("/api/token/status", "200", String(apiResult.status)));
  }

  if (mcpValue) {
    const mcpDigest = getNestedString(getProp(mcpValue, "lineage"), "checksum", "digest");
    if (mcpDigest !== undefined && mcpDigest !== expectedDigest) {
      mismatches.push(mismatch("/mcp/checksum", expectedDigest, String(mcpDigest)));
    }
  } else {
    mismatches.push(mismatch("/mcp/token", "ok:true", canonicalize(mcpResult).slice(0, 80)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: list_20_components_six_categories
// ---------------------------------------------------------------------------
async function caseList20SixCategories(
  _bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "list_20_components_six_categories";
  const mismatches: ConformanceMismatch[] = [];

  const components = await adapters.registry.listComponents();
  if (!Array.isArray(components)) {
    return failed(caseName, [mismatch("/list", "array", typeof components)]);
  }

  if (components.length < 20) {
    mismatches.push(mismatch("/count", ">=20", String(components.length)));
  }

  // Verify six categories
  const categories = new Set<string>();
  for (const comp of components) {
    const cat = getString(comp, "category");
    if (cat) categories.add(cat);
  }

  const expectedCategories = [
    "navigation",
    "layout",
    "forms",
    "feedback",
    "data-display",
    "marketing",
  ];
  for (const cat of expectedCategories) {
    if (!categories.has(cat)) {
      mismatches.push(mismatch(`/categories/${cat}`, "present", "absent"));
    }
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: list_deterministic_pagination
// ---------------------------------------------------------------------------
async function caseListPagination(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "list_deterministic_pagination";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  // Request page 1 with small page size via MCP
  const ctx = toJsonValue({ registryVersion, requestId: "conformance-page1" });
  const input1 = toJsonValue({ pageSize: 5 });
  const result1 = await adapters.mcp.dispatch("list_components", input1, ctx);

  if (getProp(result1, "ok") !== true) {
    return failed(caseName, [mismatch("/page1", "ok:true", canonicalize(result1).slice(0, 80))]);
  }

  const val1 = getProp(result1, "value");
  const comps1 = getProp(val1, "components");
  if (!Array.isArray(comps1) || comps1.length === 0) {
    return failed(caseName, [mismatch("/page1/components", "array>0", "empty or not array")]);
  }

  // Request same page again, verify byte-equivalent
  const ctx2 = toJsonValue({ registryVersion, requestId: "conformance-page1b" });
  const result1b = await adapters.mcp.dispatch("list_components", input1, ctx2);

  if (getProp(result1b, "ok") !== true) {
    mismatches.push(mismatch("/page1b", "ok:true", "failed"));
  } else {
    const val1b = getProp(result1b, "value");
    const comps1b = getProp(val1b, "components");
    if (Array.isArray(comps1b)) {
      const canonical1 = canonicalize(comps1);
      const canonical1b = canonicalize(comps1b);
      if (canonical1 !== canonical1b) {
        mismatches.push(mismatch("/pagination/determinism", "identical", "different"));
      }
    }
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: anonymous_api_access
// ---------------------------------------------------------------------------
async function caseAnonymousApi(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "anonymous_api_access";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  // Manifest should be accessible without auth
  const manifestResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/manifest`,
  );

  if (manifestResult.status !== 200) {
    mismatches.push(mismatch("/manifest/status", "200", String(manifestResult.status)));
  }

  // Components list should work without auth
  const listResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/components`,
  );

  if (listResult.status !== 200) {
    mismatches.push(mismatch("/list/status", "200", String(listResult.status)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: mcp_list_components
// ---------------------------------------------------------------------------
async function caseMcpListComponents(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "mcp_list_components";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  const ctx = toJsonValue({ registryVersion, requestId: "conformance-mcp-list" });
  const result = await adapters.mcp.dispatch("list_components", toJsonValue({}), ctx);

  if (getProp(result, "ok") !== true) {
    return failed(caseName, [mismatch("/result", "ok:true", canonicalize(result).slice(0, 80))]);
  }

  const value = getProp(result, "value");
  const comps = getProp(value, "components");
  if (!Array.isArray(comps)) {
    mismatches.push(mismatch("/components", "array", typeof comps));
  }

  const regVer = getString(value, "registryVersion");
  if (regVer !== registryVersion) {
    mismatches.push(mismatch("/registryVersion", registryVersion, String(regVer)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: mcp_get_component
// ---------------------------------------------------------------------------
async function caseMcpGetComponent(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "mcp_get_component";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  const firstComponent = bundle.snapshot.components[0];
  if (!firstComponent) {
    return failed(caseName, [mismatch("/components", "at least 1", "0")]);
  }

  const ctx = toJsonValue({ registryVersion, requestId: "conformance-mcp-get" });
  const input = toJsonValue({
    stableId: firstComponent.ref.stableId,
    version: firstComponent.ref.version,
  });
  const result = await adapters.mcp.dispatch("get_component", input, ctx);

  if (getProp(result, "ok") !== true) {
    return failed(caseName, [mismatch("/result", "ok:true", canonicalize(result).slice(0, 80))]);
  }

  const value = getProp(result, "value");
  const returnedId = getString(value, "stableId");
  if (returnedId !== firstComponent.ref.stableId) {
    mismatches.push(mismatch("/stableId", firstComponent.ref.stableId, String(returnedId)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: mcp_search_components
// ---------------------------------------------------------------------------
async function caseMcpSearchComponents(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "mcp_search_components";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  const ctx = toJsonValue({ registryVersion, requestId: "conformance-mcp-search" });
  const input = toJsonValue({ query: "navigation" });
  const result = await adapters.mcp.dispatch("search_components", input, ctx);

  if (getProp(result, "ok") !== true) {
    return failed(caseName, [mismatch("/result", "ok:true", canonicalize(result).slice(0, 80))]);
  }

  const value = getProp(result, "value");
  const results = getProp(value, "results");
  if (!Array.isArray(results)) {
    mismatches.push(mismatch("/results", "array", typeof results));
  }

  const ruleVersion = getString(value, "ruleVersion");
  if (typeof ruleVersion !== "string") {
    mismatches.push(mismatch("/ruleVersion", "string", typeof ruleVersion));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: mcp_get_design_tokens
// ---------------------------------------------------------------------------
async function caseMcpGetDesignTokens(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "mcp_get_design_tokens";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;
  const tokenVersion = bundle.snapshot.tokenArtifact.releaseVersion;

  const ctx = toJsonValue({ registryVersion, requestId: "conformance-mcp-tokens" });
  const input = toJsonValue({ exactVersion: tokenVersion });
  const result = await adapters.mcp.dispatch("get_design_tokens", input, ctx);

  if (getProp(result, "ok") !== true) {
    return failed(caseName, [mismatch("/result", "ok:true", canonicalize(result).slice(0, 80))]);
  }

  const value = getProp(result, "value");
  const tokenDoc = getProp(value, "tokenDocument");
  if (typeof tokenDoc !== "object" || tokenDoc === null) {
    mismatches.push(mismatch("/tokenDocument", "object", typeof tokenDoc));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: unknown_version_structured_error
// ---------------------------------------------------------------------------
async function caseUnknownVersionError(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "unknown_version_structured_error";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  // Request a non-existent component version via MCP
  const ctx = toJsonValue({ registryVersion, requestId: "conformance-unknown" });
  const input = toJsonValue({ stableId: "nonexistent-component", version: "99.99.99" });
  const result = await adapters.mcp.dispatch("get_component", input, ctx);

  if (getProp(result, "ok") !== false) {
    mismatches.push(mismatch("/result", "ok:false", "ok:true"));
  } else {
    const error = getProp(result, "error");
    const inner = getProp(error, "error");
    const code = getString(inner, "code");
    const message = getString(inner, "message");
    if (typeof code !== "string") {
      mismatches.push(mismatch("/error/code", "string", typeof code));
    }
    if (typeof message !== "string") {
      mismatches.push(mismatch("/error/message", "string", typeof message));
    }
  }

  // Also via Public API
  const apiResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/artifacts/component/nonexistent/99.99.99`,
  );

  if (apiResult.status !== 404) {
    mismatches.push(mismatch("/api/status", "404", String(apiResult.status)));
  }

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case: no_private_entitlement_fields
// ---------------------------------------------------------------------------
async function caseNoPrivateFields(
  bundle: ReleaseBundle,
  adapters: ConformanceAdapters,
): Promise<ConformanceCaseResult> {
  const caseName = "no_private_entitlement_fields";
  const mismatches: ConformanceMismatch[] = [];
  const registryVersion = bundle.snapshot.registryVersion;

  // Check registry snapshot
  const snapshot = await adapters.registry.getSnapshot();
  mismatches.push(...deepSearchForFields(snapshot, FORBIDDEN_FIELDS, "/registry/snapshot"));

  // Check a public API response
  const apiResult = await adapters.publicApi.handle(
    "GET",
    `/registry/${registryVersion}/components`,
  );
  if (apiResult.body !== null) {
    mismatches.push(...deepSearchForFields(apiResult.body, FORBIDDEN_FIELDS, "/api/list"));
  }

  // Check MCP response
  const ctx = toJsonValue({ registryVersion, requestId: "conformance-private" });
  const mcpResult = await adapters.mcp.dispatch("list_components", toJsonValue({}), ctx);
  mismatches.push(...deepSearchForFields(mcpResult, FORBIDDEN_FIELDS, "/mcp/list"));

  return mismatches.length === 0 ? passed(caseName) : failed(caseName, mismatches);
}

// ---------------------------------------------------------------------------
// Case runner map
// ---------------------------------------------------------------------------
export const CASE_RUNNERS: ReadonlyMap<ConformanceCaseName, CaseRunner> = new Map([
  ["snapshot_checksum_version", caseSnapshotChecksumVersion],
  ["component_parity_registry_api_mcp", caseComponentParity],
  ["token_parity_registry_api_mcp", caseTokenParity],
  ["list_20_components_six_categories", caseList20SixCategories],
  ["list_deterministic_pagination", caseListPagination],
  ["anonymous_api_access", caseAnonymousApi],
  ["mcp_list_components", caseMcpListComponents],
  ["mcp_get_component", caseMcpGetComponent],
  ["mcp_search_components", caseMcpSearchComponents],
  ["mcp_get_design_tokens", caseMcpGetDesignTokens],
  ["unknown_version_structured_error", caseUnknownVersionError],
  ["no_private_entitlement_fields", caseNoPrivateFields],
]);
