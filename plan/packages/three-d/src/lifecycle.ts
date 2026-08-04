import type { JsonValue } from "@neuraforge/schemas";

import type {
  ActionJournal,
  CommittedAction,
  ResumeStateContract,
  ThreeDErrorBoundary,
  ThreeDLifecycleState,
} from "./types.js";
import { createErrorBoundaryState, recordFailure, transition } from "./capability.js";
import type { ErrorBoundaryState } from "./capability.js";

// ---------------------------------------------------------------------------
// Viewport Suspension and Resumable Lifecycle (Task 13.2)
// ---------------------------------------------------------------------------

/**
 * The full runtime state of a 3D component, including lifecycle, error tracking,
 * action journal, and resume state. This is the single source of truth for the
 * component's current condition.
 *
 * Requirements: 5.18, 5.19
 */
export interface ThreeDRuntimeState {
  readonly lifecycle: ThreeDLifecycleState;
  readonly errorBoundary: ErrorBoundaryState;
  readonly actionJournal: ActionJournal;
  readonly resumeState: ResumeStateContract | undefined;
  readonly renderLoopActive: boolean;
  readonly frameCount: number;
}

/**
 * Creates the initial runtime state for a 3D component.
 */
export function createInitialRuntimeState(
  initialLifecycle: ThreeDLifecycleState,
  errorBoundaryConfig: ThreeDErrorBoundary,
): ThreeDRuntimeState {
  return {
    lifecycle: initialLifecycle,
    errorBoundary: createErrorBoundaryState(errorBoundaryConfig),
    actionJournal: { entries: [], lastCommittedId: undefined },
    resumeState: undefined,
    renderLoopActive: initialLifecycle === "active",
    frameCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Lifecycle Transitions
// ---------------------------------------------------------------------------

/**
 * Transitions the runtime state to the `active` state (initialization complete).
 * Only valid from `initializing` state.
 */
export function activate(state: ThreeDRuntimeState): ThreeDRuntimeState {
  const result = transition(state.lifecycle, "active");
  if (!result.transitioned) return state;

  return {
    ...state,
    lifecycle: "active",
    renderLoopActive: true,
  };
}

/**
 * Transitions to the `failed` state after an error. Records the failure in the
 * error boundary and stops the render loop.
 */
export function fail(state: ThreeDRuntimeState, error: string): ThreeDRuntimeState {
  const result = transition(state.lifecycle, "failed");
  if (!result.transitioned) return state;

  const failure = recordFailure(state.errorBoundary, error);

  return {
    ...state,
    lifecycle: "failed",
    errorBoundary: failure.state,
    renderLoopActive: false,
  };
}

// ---------------------------------------------------------------------------
// Viewport Suspension (Requirement 5.18)
// ---------------------------------------------------------------------------

/**
 * Suspends the 3D component when it exits the viewport. Captures a resume state
 * snapshot and stops the render loop. Only valid from `active` state.
 *
 * The suspend operation:
 * 1. Captures the current serializable state (passed by the component).
 * 2. Preserves the current action journal (to prevent replay on resume).
 * 3. Stops the continuous render/animation loop.
 * 4. Transitions to `suspended` lifecycle state.
 *
 * Requirement 5.18
 */
export function suspend(state: ThreeDRuntimeState, currentState: JsonValue): ThreeDRuntimeState {
  const result = transition(state.lifecycle, "suspended");
  if (!result.transitioned) return state;

  const resumeState: ResumeStateContract = {
    description: "State captured at viewport exit for lossless resume",
    state: currentState,
    actionJournal: state.actionJournal,
    suspendedAt: Date.now(),
  };

  return {
    ...state,
    lifecycle: "suspended",
    renderLoopActive: false,
    resumeState,
  };
}

/**
 * Pure version of suspend that accepts a timestamp for testability.
 */
export function suspendAt(
  state: ThreeDRuntimeState,
  currentState: JsonValue,
  timestamp: number,
): ThreeDRuntimeState {
  const result = transition(state.lifecycle, "suspended");
  if (!result.transitioned) return state;

  const resumeState: ResumeStateContract = {
    description: "State captured at viewport exit for lossless resume",
    state: currentState,
    actionJournal: state.actionJournal,
    suspendedAt: timestamp,
  };

  return {
    ...state,
    lifecycle: "suspended",
    renderLoopActive: false,
    resumeState,
  };
}

// ---------------------------------------------------------------------------
// Viewport Resume (Requirement 5.19)
// ---------------------------------------------------------------------------

/**
 * Resumes the 3D component when it re-enters the viewport. Restores from the
 * saved resume state without replaying committed actions. Only valid from
 * `suspended` state.
 *
 * The resume operation:
 * 1. Validates the resume state exists.
 * 2. Restores the component from the saved state snapshot.
 * 3. Preserves the action journal (committed actions are NOT replayed).
 * 4. Restarts the continuous render/animation loop.
 * 5. Transitions to `active` lifecycle state.
 *
 * Requirement 5.19
 */
export function resume(state: ThreeDRuntimeState): {
  state: ThreeDRuntimeState;
  resumedFrom: ResumeStateContract | undefined;
} {
  const result = transition(state.lifecycle, "active");
  if (!result.transitioned) {
    return { state, resumedFrom: undefined };
  }

  const resumedFrom = state.resumeState;

  return {
    state: {
      ...state,
      lifecycle: "active",
      renderLoopActive: true,
      // Resume state is cleared once consumed
      resumeState: undefined,
    },
    resumedFrom,
  };
}

// ---------------------------------------------------------------------------
// Action Journal (Requirement 5.19 — prevent replay)
// ---------------------------------------------------------------------------

/**
 * Records a committed user-visible action in the journal. This action will NOT
 * be replayed after a suspend/resume cycle because the journal is preserved.
 */
export function commitAction(
  state: ThreeDRuntimeState,
  actionId: string,
  description: string,
  timestamp?: number,
): ThreeDRuntimeState {
  if (state.lifecycle !== "active") return state;

  const entry: CommittedAction = {
    actionId,
    timestamp: timestamp ?? Date.now(),
    description,
  };

  const newJournal: ActionJournal = {
    entries: [...state.actionJournal.entries, entry],
    lastCommittedId: actionId,
  };

  return {
    ...state,
    actionJournal: newJournal,
  };
}

/**
 * Checks whether an action has already been committed (and should not be replayed).
 * Used after resume to prevent duplicate execution of user-visible actions.
 */
export function isActionCommitted(state: ThreeDRuntimeState, actionId: string): boolean {
  return state.actionJournal.entries.some((e) => e.actionId === actionId);
}

/**
 * Returns the list of action IDs that have been committed since the last suspension.
 * These should be skipped when resuming to prevent replay.
 */
export function getCommittedActionIds(state: ThreeDRuntimeState): readonly string[] {
  return state.actionJournal.entries.map((e) => e.actionId);
}

// ---------------------------------------------------------------------------
// Render Loop Tracking
// ---------------------------------------------------------------------------

/**
 * Increments the frame counter. Used to verify the render loop is running and to
 * confirm it stops during suspension.
 */
export function tickFrame(state: ThreeDRuntimeState): ThreeDRuntimeState {
  if (!state.renderLoopActive) return state;
  return { ...state, frameCount: state.frameCount + 1 };
}

/**
 * Returns whether the render loop should be running based on current lifecycle state.
 */
export function shouldRenderLoopRun(state: ThreeDRuntimeState): boolean {
  return state.lifecycle === "active" && state.renderLoopActive;
}

// ---------------------------------------------------------------------------
// Intersection Observer Integration
// ---------------------------------------------------------------------------

/**
 * Processes an intersection change event (from IntersectionObserver).
 * - Entering viewport: resume if suspended.
 * - Leaving viewport: suspend if active, preserving current state.
 *
 * This is the primary integration point between the DOM observation layer
 * and the lifecycle state machine.
 *
 * Requirement 5.18, 5.19
 */
export function handleIntersectionChange(
  state: ThreeDRuntimeState,
  isIntersecting: boolean,
  currentSceneState: JsonValue,
): ThreeDRuntimeState {
  if (isIntersecting && state.lifecycle === "suspended") {
    const { state: resumed } = resume(state);
    return resumed;
  }

  if (!isIntersecting && state.lifecycle === "active") {
    return suspend(state, currentSceneState);
  }

  return state;
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

/**
 * Attempts to retry initialization after a failure. Returns to `initializing` state
 * only if the error boundary allows retries.
 *
 * Note: `failed` → `fallback` is the only valid transition from `failed` in our
 * state machine. Re-initialization means going through `fallback` → capability check
 * → `initializing` again. This function handles the transition to fallback and
 * indicates whether a retry should be attempted.
 */
export function attemptRetry(state: ThreeDRuntimeState): {
  state: ThreeDRuntimeState;
  shouldRetry: boolean;
} {
  if (state.lifecycle !== "failed") {
    return { state, shouldRetry: false };
  }

  if (state.errorBoundary.permanentlyFailed) {
    // Transition to fallback permanently
    const result = transition(state.lifecycle, "fallback");
    if (result.transitioned) {
      return {
        state: { ...state, lifecycle: "fallback" },
        shouldRetry: false,
      };
    }
    return { state, shouldRetry: false };
  }

  // Transition to fallback, but indicate retry is available
  const result = transition(state.lifecycle, "fallback");
  if (result.transitioned) {
    return {
      state: { ...state, lifecycle: "fallback" },
      shouldRetry: true,
    };
  }

  return { state, shouldRetry: false };
}
