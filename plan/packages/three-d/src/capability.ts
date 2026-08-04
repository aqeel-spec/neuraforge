import type {
  CapabilityCheckResult,
  CapabilityPredicate,
  ThreeDCapability,
  ThreeDComponentRecord,
  ThreeDErrorBoundary,
  ThreeDFallbackContract,
  ThreeDLifecycleState,
} from "./types.js";
import { THREE_D_CAPABILITIES } from "./types.js";

// ---------------------------------------------------------------------------
// Capability Guard (Task 13.1)
// ---------------------------------------------------------------------------

/**
 * Default capability predicate. Checks for WebGL/WebGL2/WebGPU support by
 * attempting to create an offscreen canvas context. Returns `false` in SSR/Node
 * environments rather than throwing.
 *
 * This is the reference implementation; consumers may provide custom predicates
 * for testing or specialized environments.
 */
export const defaultCapabilityPredicate: CapabilityPredicate = (
  capability: ThreeDCapability,
): boolean => {
  // SSR / Node safety: if there's no global document or canvas support, return false
  if (typeof document === "undefined") return false;
  if (typeof HTMLCanvasElement === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    switch (capability) {
      case "webgl":
        return canvas.getContext("webgl") !== null;
      case "webgl2":
        return canvas.getContext("webgl2") !== null;
      case "webgpu": {
        // WebGPU availability is checked via navigator.gpu
        if (typeof navigator === "undefined") return false;
        return "gpu" in navigator;
      }
    }
  } catch {
    return false;
  }
};

/**
 * Checks whether the required 3D capability is available using the provided predicate.
 * Also reports all checked and supported capabilities for diagnostic purposes.
 */
export function checkCapability(
  requiredCapability: ThreeDCapability,
  predicate: CapabilityPredicate = defaultCapabilityPredicate,
): CapabilityCheckResult {
  const supported: ThreeDCapability[] = [];

  for (const cap of THREE_D_CAPABILITIES) {
    if (predicate(cap)) {
      supported.push(cap);
    }
  }

  return {
    requiredCapability,
    available: supported.includes(requiredCapability),
    checked: [...THREE_D_CAPABILITIES],
    supported,
  };
}

/**
 * Determines the initial lifecycle state for a 3D component based on capability check.
 * - If the required capability is available → `"initializing"`
 * - If not available → `"fallback"`
 */
export function determineInitialState(
  requiredCapability: ThreeDCapability,
  predicate: CapabilityPredicate = defaultCapabilityPredicate,
): ThreeDLifecycleState {
  const result = checkCapability(requiredCapability, predicate);
  return result.available ? "initializing" : "fallback";
}

// ---------------------------------------------------------------------------
// Lifecycle State Machine
// ---------------------------------------------------------------------------

/**
 * Valid transitions in the 3D component lifecycle state machine.
 * Enforces the documented transition graph.
 */
const VALID_TRANSITIONS: ReadonlyMap<ThreeDLifecycleState, readonly ThreeDLifecycleState[]> = new Map([
  ["fallback", []],
  ["initializing", ["active", "failed"]],
  ["active", ["suspended", "failed"]],
  ["suspended", ["active", "failed"]],
  ["failed", ["fallback"]],
]);

/**
 * Checks whether a lifecycle state transition is valid.
 */
export function isValidTransition(from: ThreeDLifecycleState, to: ThreeDLifecycleState): boolean {
  const allowed = VALID_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.includes(to);
}

/**
 * Attempts a lifecycle state transition. Returns the new state if valid, or the
 * current state unchanged if the transition is invalid.
 */
export function transition(
  current: ThreeDLifecycleState,
  target: ThreeDLifecycleState,
): { state: ThreeDLifecycleState; transitioned: boolean } {
  if (isValidTransition(current, target)) {
    return { state: target, transitioned: true };
  }
  return { state: current, transitioned: false };
}

// ---------------------------------------------------------------------------
// Error Boundary Logic
// ---------------------------------------------------------------------------

/**
 * Tracks initialization attempts and determines whether to retry or transition
 * to the failed state.
 */
export interface ErrorBoundaryState {
  readonly attempts: number;
  readonly maxRetries: number;
  readonly lastError: string | undefined;
  readonly permanentlyFailed: boolean;
}

/**
 * Creates an initial error boundary state from the component's error boundary config.
 */
export function createErrorBoundaryState(config: ThreeDErrorBoundary): ErrorBoundaryState {
  return {
    attempts: 0,
    maxRetries: config.maxRetries,
    lastError: undefined,
    permanentlyFailed: false,
  };
}

/**
 * Records a failure in the error boundary. Returns updated state indicating whether
 * the component should retry or permanently fail.
 */
export function recordFailure(
  state: ErrorBoundaryState,
  error: string,
): { state: ErrorBoundaryState; shouldRetry: boolean } {
  const newAttempts = state.attempts + 1;
  const permanentlyFailed = newAttempts >= state.maxRetries;

  return {
    state: {
      attempts: newAttempts,
      maxRetries: state.maxRetries,
      lastError: error,
      permanentlyFailed,
    },
    shouldRetry: !permanentlyFailed,
  };
}

// ---------------------------------------------------------------------------
// Fallback Resolution
// ---------------------------------------------------------------------------

/**
 * Determines whether a 3D component should render its fallback based on its
 * current lifecycle state. Returns true for `fallback` and `failed` states.
 */
export function shouldRenderFallback(state: ThreeDLifecycleState): boolean {
  return state === "fallback" || state === "failed";
}

/**
 * Validates that a fallback contract satisfies the requirements:
 * - Must preserve content, status, and primary actions
 * - Must have a valid source path
 * - Must have a description
 */
export function validateFallbackContract(fallback: ThreeDFallbackContract): {
  valid: boolean;
  issues: readonly string[];
} {
  const issues: string[] = [];

  if (!fallback.description) {
    issues.push("Fallback must have a description");
  }
  if (!fallback.fallbackSourcePath) {
    issues.push("Fallback must have a source path (first-class source, not generated)");
  }
  if (fallback.preservesContent !== true) {
    issues.push("Fallback must preserve content");
  }
  if (fallback.preservesStatus !== true) {
    issues.push("Fallback must preserve status");
  }
  if (fallback.preservesPrimaryActions !== true) {
    issues.push("Fallback must preserve primary actions");
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validates that a ThreeDComponentRecord has a complete and valid structure.
 * Returns issues if any required fields are missing or invalid.
 */
export function validateComponentRecord(record: ThreeDComponentRecord): {
  valid: boolean;
  issues: readonly string[];
} {
  const issues: string[] = [];

  if (!record.ref.stableId) issues.push("Missing ref.stableId");
  if (!record.ref.version) issues.push("Missing ref.version");
  if (!record.schemaVersion) issues.push("Missing schemaVersion");
  if (!THREE_D_CAPABILITIES.includes(record.requiredCapability)) {
    issues.push(`Invalid requiredCapability: ${record.requiredCapability}`);
  }

  const fallbackResult = validateFallbackContract(record.fallback);
  issues.push(...fallbackResult.issues);

  if (record.sourceFiles.length === 0) issues.push("Missing sourceFiles");
  if (record.examples.length === 0) issues.push("Missing examples");
  if (record.performanceRecords.length === 0) issues.push("Missing performanceRecords");
  if (record.provenance.length === 0) issues.push("Missing provenance");

  return { valid: issues.length === 0, issues };
}
