import { describe, it, expect } from "vitest";

import type {
  ThreeDComponentRecord,
  ThreeDErrorBoundary,
  ThreeDFallbackContract,
} from "./types.js";
import { THREE_D_CAPABILITIES, THREE_D_LIFECYCLE_STATES } from "./types.js";
import {
  checkCapability,
  createErrorBoundaryState,
  determineInitialState,
  isValidTransition,
  recordFailure,
  shouldRenderFallback,
  transition,
  validateComponentRecord,
  validateFallbackContract,
} from "./capability.js";
import {
  activate,
  attemptRetry,
  commitAction,
  createInitialRuntimeState,
  fail,
  getCommittedActionIds,
  handleIntersectionChange,
  isActionCommitted,
  resume,
  shouldRenderLoopRun,
  suspendAt,
  tickFrame,
} from "./lifecycle.js";
import {
  buildThreeDMcpPayload,
  buildThreeDMcpSummary,
  classifyThreeDStatus,
  projectThreeDComponent,
} from "./projection.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ERROR_BOUNDARY: ThreeDErrorBoundary = {
  initTimeoutMs: 5000,
  retryOnContextRestored: true,
  maxRetries: 3,
};

const FALLBACK: ThreeDFallbackContract = {
  description: "Static 2D product image with rotate button",
  preservesContent: true,
  preservesStatus: true,
  preservesPrimaryActions: true,
  fallbackSourcePath: "src/components/product-viewer-fallback.tsx",
};

function makeRecord(overrides: Partial<ThreeDComponentRecord> = {}): ThreeDComponentRecord {
  return {
    ref: { kind: "three-d-component", stableId: "product-viewer", version: "1.0.0" },
    status: "stable",
    schemaVersion: "1.0.0",
    requiredCapability: "webgl2",
    fallback: FALLBACK,
    errorBoundary: ERROR_BOUNDARY,
    parameters: [
      { name: "autoRotate", type: "boolean", description: "Auto rotate model", default: true, required: false, group: "interaction" },
      { name: "cameraDistance", type: "number", description: "Camera distance", default: 5, required: false, range: { min: 1, max: 20 }, group: "camera" },
    ],
    resumeStateDescription: "Camera position, rotation state, and selected material",
    sourceFiles: [{
      path: "src/components/product-viewer.tsx",
      origin: "original",
      mediaType: "text/typescript",
      size: 4096,
      checksum: { algorithm: "sha256", canonicalization: "neuraforge-canonical-v1", digest: "abc123" },
    }],
    dependencies: [{ name: "three", version: "0.160.0", source: "https://github.com/mrdoob/three.js" }],
    assets: [{
      path: "assets/product-model.glb",
      mediaType: "model/gltf-binary",
      size: 512000,
      provenance: {
        name: "product-model",
        version: "1.0.0",
        source: "https://example.com/models",
        copyright: "Copyright 2026 Example Corp",
        spdxIdentifier: "CC-BY-4.0",
        licenseTextPath: "licenses/cc-by-4.0.txt",
        attribution: "Example Corp",
        redistributionObligations: ["attribution"],
        reviewStatus: "approved",
      },
    }],
    provenance: [{
      name: "three",
      version: "0.160.0",
      source: "https://github.com/mrdoob/three.js",
      copyright: "Copyright 2010-2026 Three.js Authors",
      spdxIdentifier: "MIT",
      licenseTextPath: "licenses/three-MIT.txt",
      attribution: "Three.js Authors",
      redistributionObligations: ["include-license-text"],
      reviewStatus: "approved",
    }],
    examples: [{
      id: "basic-viewer",
      title: "Basic product viewer",
      description: "Displays a 3D product model with orbit controls",
      parameters: { autoRotate: true, cameraDistance: 5 },
      sourcePath: "examples/basic-viewer.tsx",
      interactive: true,
    }],
    performanceRecords: [{
      artifact: { kind: "three-d-component", stableId: "product-viewer", version: "1.0.0" },
      metric: "first-render-ms",
      scenario: "cold start on mid-range GPU",
      environment: { operatingSystem: "linux", runtime: "chrome-120", tools: {}, prerequisites: [], fixtures: [] },
      result: 120,
      threshold: 500,
      unit: "ms",
      command: "npm run perf:3d",
      status: "passed",
    }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Capability & Fallback Tests
// ---------------------------------------------------------------------------

describe("3D Capability Guard", () => {
  it("THREE_D_CAPABILITIES contains webgl, webgl2, webgpu", () => {
    expect(THREE_D_CAPABILITIES).toEqual(["webgl", "webgl2", "webgpu"]);
  });

  it("THREE_D_LIFECYCLE_STATES contains all 5 states", () => {
    expect(THREE_D_LIFECYCLE_STATES).toHaveLength(5);
    expect(THREE_D_LIFECYCLE_STATES).toContain("fallback");
    expect(THREE_D_LIFECYCLE_STATES).toContain("initializing");
    expect(THREE_D_LIFECYCLE_STATES).toContain("active");
    expect(THREE_D_LIFECYCLE_STATES).toContain("suspended");
    expect(THREE_D_LIFECYCLE_STATES).toContain("failed");
  });

  it("checkCapability returns unavailable when predicate returns false", () => {
    const result = checkCapability("webgl2", () => false);
    expect(result.available).toBe(false);
    expect(result.requiredCapability).toBe("webgl2");
    expect(result.supported).toHaveLength(0);
  });

  it("checkCapability returns available when predicate returns true for required", () => {
    const result = checkCapability("webgl", (cap) => cap === "webgl");
    expect(result.available).toBe(true);
    expect(result.supported).toContain("webgl");
  });

  it("determineInitialState returns fallback when capability unavailable", () => {
    const state = determineInitialState("webgpu", () => false);
    expect(state).toBe("fallback");
  });

  it("determineInitialState returns initializing when capability available", () => {
    const state = determineInitialState("webgl", () => true);
    expect(state).toBe("initializing");
  });

  it("shouldRenderFallback returns true for fallback and failed states", () => {
    expect(shouldRenderFallback("fallback")).toBe(true);
    expect(shouldRenderFallback("failed")).toBe(true);
    expect(shouldRenderFallback("active")).toBe(false);
    expect(shouldRenderFallback("suspended")).toBe(false);
    expect(shouldRenderFallback("initializing")).toBe(false);
  });

  it("validateFallbackContract accepts valid fallback", () => {
    const result = validateFallbackContract(FALLBACK);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("validateFallbackContract catches missing source path", () => {
    const invalid = { ...FALLBACK, fallbackSourcePath: "" };
    const result = validateFallbackContract(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});


// ---------------------------------------------------------------------------
// Lifecycle State Machine Tests
// ---------------------------------------------------------------------------

describe("3D Lifecycle State Machine", () => {
  it("valid transitions are enforced", () => {
    expect(isValidTransition("initializing", "active")).toBe(true);
    expect(isValidTransition("initializing", "failed")).toBe(true);
    expect(isValidTransition("active", "suspended")).toBe(true);
    expect(isValidTransition("active", "failed")).toBe(true);
    expect(isValidTransition("suspended", "active")).toBe(true);
    expect(isValidTransition("suspended", "failed")).toBe(true);
    expect(isValidTransition("failed", "fallback")).toBe(true);
  });

  it("invalid transitions are rejected", () => {
    expect(isValidTransition("fallback", "active")).toBe(false);
    expect(isValidTransition("fallback", "suspended")).toBe(false);
    expect(isValidTransition("initializing", "suspended")).toBe(false);
    expect(isValidTransition("active", "initializing")).toBe(false);
    expect(isValidTransition("failed", "active")).toBe(false);
  });

  it("transition function returns transitioned=false for invalid transitions", () => {
    const result = transition("fallback", "active");
    expect(result.transitioned).toBe(false);
    expect(result.state).toBe("fallback");
  });

  it("transition function returns new state for valid transitions", () => {
    const result = transition("initializing", "active");
    expect(result.transitioned).toBe(true);
    expect(result.state).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Viewport Suspension & Resume Tests
// ---------------------------------------------------------------------------

describe("3D Viewport Suspension", () => {
  it("creates initial runtime state correctly", () => {
    const state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    expect(state.lifecycle).toBe("initializing");
    expect(state.renderLoopActive).toBe(false);
    expect(state.frameCount).toBe(0);
    expect(state.actionJournal.entries).toHaveLength(0);
    expect(state.resumeState).toBeUndefined();
  });

  it("activate transitions from initializing to active and starts render loop", () => {
    const state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    const activated = activate(state);
    expect(activated.lifecycle).toBe("active");
    expect(activated.renderLoopActive).toBe(true);
  });

  it("suspend captures state and stops render loop", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    const suspended = suspendAt(state, { camera: { x: 1, y: 2, z: 3 } }, 1000);
    expect(suspended.lifecycle).toBe("suspended");
    expect(suspended.renderLoopActive).toBe(false);
    expect(suspended.resumeState).toBeDefined();
    expect(suspended.resumeState!.state).toEqual({ camera: { x: 1, y: 2, z: 3 } });
    expect(suspended.resumeState!.suspendedAt).toBe(1000);
  });

  it("resume restores from suspended state and restarts render loop", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = suspendAt(state, { rotation: 45 }, 1000);
    const { state: resumed, resumedFrom } = resume(state);
    expect(resumed.lifecycle).toBe("active");
    expect(resumed.renderLoopActive).toBe(true);
    expect(resumed.resumeState).toBeUndefined(); // cleared after use
    expect(resumedFrom).toBeDefined();
    expect(resumedFrom!.state).toEqual({ rotation: 45 });
  });

  it("suspend preserves action journal for replay prevention", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = commitAction(state, "add-to-cart", "User added item to cart", 500);
    state = suspendAt(state, {}, 1000);
    expect(state.resumeState!.actionJournal.entries).toHaveLength(1);
    expect(state.resumeState!.actionJournal.entries[0]!.actionId).toBe("add-to-cart");
  });

  it("handleIntersectionChange suspends on leaving viewport", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = handleIntersectionChange(state, false, { scene: "data" });
    expect(state.lifecycle).toBe("suspended");
    expect(state.renderLoopActive).toBe(false);
  });

  it("handleIntersectionChange resumes on entering viewport", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = suspendAt(state, { scene: "data" }, 1000);
    state = handleIntersectionChange(state, true, {});
    expect(state.lifecycle).toBe("active");
    expect(state.renderLoopActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Action Journal & Replay Prevention Tests
// ---------------------------------------------------------------------------

describe("3D Action Journal", () => {
  it("commitAction adds entry to journal", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = commitAction(state, "select-color", "User selected red", 100);
    expect(state.actionJournal.entries).toHaveLength(1);
    expect(state.actionJournal.lastCommittedId).toBe("select-color");
  });

  it("commitAction is ignored when not in active state", () => {
    const state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    const unchanged = commitAction(state, "action-1", "test", 100);
    expect(unchanged.actionJournal.entries).toHaveLength(0);
  });

  it("isActionCommitted detects previously committed actions", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = commitAction(state, "add-to-cart", "Added item", 100);
    expect(isActionCommitted(state, "add-to-cart")).toBe(true);
    expect(isActionCommitted(state, "remove-from-cart")).toBe(false);
  });

  it("getCommittedActionIds returns all committed IDs", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = commitAction(state, "action-1", "First", 100);
    state = commitAction(state, "action-2", "Second", 200);
    const ids = getCommittedActionIds(state);
    expect(ids).toEqual(["action-1", "action-2"]);
  });

  it("actions committed before suspend are preserved after resume (no replay)", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = commitAction(state, "purchase", "Completed purchase", 100);
    state = suspendAt(state, {}, 200);
    const { state: resumed } = resume(state);
    // The journal is preserved — action should still be marked committed
    expect(isActionCommitted(resumed, "purchase")).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// Render Loop & Frame Counter Tests
// ---------------------------------------------------------------------------

describe("3D Render Loop", () => {
  it("tickFrame increments frame count when loop is active", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = tickFrame(state);
    state = tickFrame(state);
    expect(state.frameCount).toBe(2);
  });

  it("tickFrame does nothing when render loop is stopped", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = suspendAt(state, {}, 1000);
    state = tickFrame(state); // should not increment
    expect(state.frameCount).toBe(0);
  });

  it("shouldRenderLoopRun is true only when active", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    expect(shouldRenderLoopRun(state)).toBe(false);
    state = activate(state);
    expect(shouldRenderLoopRun(state)).toBe(true);
    state = suspendAt(state, {}, 1000);
    expect(shouldRenderLoopRun(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Error Boundary & Retry Tests
// ---------------------------------------------------------------------------

describe("3D Error Boundary", () => {
  it("createErrorBoundaryState initializes with zero attempts", () => {
    const ebState = createErrorBoundaryState(ERROR_BOUNDARY);
    expect(ebState.attempts).toBe(0);
    expect(ebState.maxRetries).toBe(3);
    expect(ebState.permanentlyFailed).toBe(false);
  });

  it("recordFailure increments attempts", () => {
    let ebState = createErrorBoundaryState(ERROR_BOUNDARY);
    const result = recordFailure(ebState, "WebGL context lost");
    expect(result.state.attempts).toBe(1);
    expect(result.state.lastError).toBe("WebGL context lost");
    expect(result.shouldRetry).toBe(true);
  });

  it("recordFailure marks permanently failed after maxRetries", () => {
    let ebState = createErrorBoundaryState(ERROR_BOUNDARY);
    let result = recordFailure(ebState, "Error 1");
    result = recordFailure(result.state, "Error 2");
    result = recordFailure(result.state, "Error 3");
    expect(result.state.permanentlyFailed).toBe(true);
    expect(result.shouldRetry).toBe(false);
  });

  it("fail transitions lifecycle and stops render loop", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = fail(state, "Shader compilation failed");
    expect(state.lifecycle).toBe("failed");
    expect(state.renderLoopActive).toBe(false);
    expect(state.errorBoundary.lastError).toBe("Shader compilation failed");
  });

  it("attemptRetry returns shouldRetry=true when retries remain", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = fail(state, "Context lost");
    const { state: retried, shouldRetry } = attemptRetry(state);
    expect(shouldRetry).toBe(true);
    expect(retried.lifecycle).toBe("fallback");
  });

  it("attemptRetry returns shouldRetry=false when permanently failed", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    // Exhaust retries
    state = fail(state, "Error 1");
    let retry = attemptRetry(state);
    // Re-init from fallback → initializing → active → fail again
    state = { ...retry.state, lifecycle: "initializing" as const };
    state = activate(state);
    state = fail(state, "Error 2");
    retry = attemptRetry(state);
    state = { ...retry.state, lifecycle: "initializing" as const };
    state = activate(state);
    state = fail(state, "Error 3");
    const { shouldRetry: lastRetry } = attemptRetry(state);
    expect(lastRetry).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Projection & MCP Tests
// ---------------------------------------------------------------------------

describe("3D Projection", () => {
  it("projectThreeDComponent creates a frozen projection", () => {
    const record = makeRecord();
    const projected = projectThreeDComponent(record);
    expect(projected.ref.stableId).toBe("product-viewer");
    expect(projected.status).toBe("stable");
    expect(projected.requiredCapability).toBe("webgl2");
    expect(Object.isFrozen(projected)).toBe(true);
  });

  it("projection includes fallback with preservation guarantees", () => {
    const record = makeRecord();
    const projected = projectThreeDComponent(record);
    expect(projected.fallback.preservesContent).toBe(true);
    expect(projected.fallback.preservesStatus).toBe(true);
    expect(projected.fallback.preservesPrimaryActions).toBe(true);
    expect(projected.fallback.fallbackSourcePath).toBeTruthy();
  });

  it("projection includes parameters with types and ranges", () => {
    const record = makeRecord();
    const projected = projectThreeDComponent(record);
    expect(projected.parameters).toHaveLength(2);
    const camParam = projected.parameters.find((p) => p.name === "cameraDistance");
    expect(camParam).toBeDefined();
    expect(camParam!.range).toEqual({ min: 1, max: 20 });
  });

  it("projection includes assets with provenance", () => {
    const record = makeRecord();
    const projected = projectThreeDComponent(record);
    expect(projected.assets).toHaveLength(1);
    expect(projected.assets[0]!.license).toBe("CC-BY-4.0");
  });

  it("classifyThreeDStatus returns stable for complete record", () => {
    const record = makeRecord();
    const result = classifyThreeDStatus(record);
    expect(result.status).toBe("stable");
    expect(result.blockers).toHaveLength(0);
  });

  it("classifyThreeDStatus returns experimental for incomplete record", () => {
    const record = makeRecord({ examples: [], performanceRecords: [] });
    const result = classifyThreeDStatus(record);
    expect(result.status).toBe("experimental");
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("classifyThreeDStatus catches failing performance", () => {
    const record = makeRecord({
      performanceRecords: [{
        artifact: { kind: "three-d-component", stableId: "product-viewer", version: "1.0.0" },
        metric: "fps",
        scenario: "animation loop",
        environment: { operatingSystem: "linux", runtime: "chrome-120", tools: {}, prerequisites: [], fixtures: [] },
        result: 20,
        threshold: 30,
        unit: "fps",
        command: "npm run perf:fps",
        status: "failed",
      }],
    });
    const result = classifyThreeDStatus(record);
    expect(result.status).toBe("experimental");
    expect(result.blockers.some((b) => b.code === "performance_failure")).toBe(true);
  });

  it("buildThreeDMcpPayload returns complete MCP structure", () => {
    const record = makeRecord();
    const payload = buildThreeDMcpPayload(record);
    expect(payload["kind"]).toBe("three-d-component");
    expect(payload["stableId"]).toBe("product-viewer");
    expect(payload["capability"]).toBeDefined();
    expect(payload["parameters"]).toBeDefined();
    expect(payload["performance"]).toBeDefined();
    expect(payload["examples"]).toBeDefined();
  });

  it("buildThreeDMcpPayload includes experimental warnings when applicable", () => {
    const record = makeRecord({
      status: "experimental",
      blockers: [{ code: "asset_review", description: "Pending asset review" }],
    });
    const payload = buildThreeDMcpPayload(record);
    expect(payload["experimental"]).toBeDefined();
    const experimental = payload["experimental"] as { blockers: unknown[]; warnings: string[] };
    expect(experimental.blockers).toHaveLength(1);
    expect(experimental.warnings.length).toBeGreaterThan(0);
  });

  it("buildThreeDMcpSummary returns summary with key fields", () => {
    const record = makeRecord();
    const summary = buildThreeDMcpSummary(record);
    expect(summary["kind"]).toBe("three-d-component");
    expect(summary["stableId"]).toBe("product-viewer");
    expect(summary["requiredCapability"]).toBe("webgl2");
    expect(summary["hasFallback"]).toBe(true);
    expect(summary["parameterCount"]).toBe(2);
    expect(summary["performanceStatus"]).toBe("passing");
  });
});

// ---------------------------------------------------------------------------
// Accessibility Tests
// ---------------------------------------------------------------------------

describe("3D Accessibility", () => {
  it("fallback state guarantees non-3D content is rendered", () => {
    const state = createInitialRuntimeState("fallback", ERROR_BOUNDARY);
    expect(shouldRenderFallback(state.lifecycle)).toBe(true);
    expect(state.renderLoopActive).toBe(false);
  });

  it("failed state falls back to non-3D content", () => {
    let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
    state = activate(state);
    state = fail(state, "WebGL not supported");
    expect(shouldRenderFallback(state.lifecycle)).toBe(true);
  });

  it("validateComponentRecord catches missing provenance", () => {
    const record = makeRecord({ provenance: [] });
    const result = validateComponentRecord(record);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("provenance"))).toBe(true);
  });

  it("reduced motion: 3D component with no render loop does not animate", () => {
    const state = createInitialRuntimeState("fallback", ERROR_BOUNDARY);
    expect(shouldRenderLoopRun(state)).toBe(false);
    // Fallback source is first-class and has no animation dependency
    expect(FALLBACK.preservesContent).toBe(true);
    expect(FALLBACK.preservesPrimaryActions).toBe(true);
  });
});
