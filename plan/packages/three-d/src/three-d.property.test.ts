import { describe, it, expect } from "vitest";
import fc from "fast-check";

import { THREE_D_LIFECYCLE_STATES } from "./types.js";
import { isValidTransition, transition } from "./capability.js";
import {
  activate,
  commitAction,
  createInitialRuntimeState,
  handleIntersectionChange,
  isActionCommitted,
  resume,
  suspendAt,
  tickFrame,
} from "./lifecycle.js";

import type { JsonValue } from "@neuraforge/schemas";

// Feature: neuraforge-open-source-ui, Property 15: 3D suspension and resumption preserve valid state

const ERROR_BOUNDARY = { initTimeoutMs: 5000, retryOnContextRestored: true, maxRetries: 3 };

describe("Property 15: 3D suspension and resumption preserve valid state", () => {
  it("suspend captures state and resume returns the exact same state", () => {
    fc.assert(
      fc.property(
        fc.json(),
        fc.integer({ min: 1000, max: 9999999 }),
        (sceneState, timestamp) => {
          const parsed = JSON.parse(sceneState) as JsonValue;
          let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
          state = activate(state);
          state = suspendAt(state, parsed, timestamp);
          expect(state.resumeState).toBeDefined();
          expect(state.resumeState!.state).toEqual(parsed);
          expect(state.resumeState!.suspendedAt).toBe(timestamp);
          const { state: resumed, resumedFrom } = resume(state);
          expect(resumed.lifecycle).toBe("active");
          expect(resumedFrom).toBeDefined();
          expect(resumedFrom!.state).toEqual(parsed);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("committed actions are never lost across suspend/resume cycles", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (actionIds, cycles) => {
          let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
          state = activate(state);
          for (let i = 0; i < actionIds.length; i++) {
            state = commitAction(state, actionIds[i]!, `Action ${i}`, i * 100);
          }
          for (let c = 0; c < cycles; c++) {
            state = suspendAt(state, { cycle: c }, c * 1000);
            const { state: resumed } = resume(state);
            state = resumed;
          }
          for (const id of actionIds) {
            expect(isActionCommitted(state, id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("frame counter does not increment while suspended", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (preFrames, postAttempts) => {
          let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
          state = activate(state);
          for (let i = 0; i < preFrames; i++) {
            state = tickFrame(state);
          }
          expect(state.frameCount).toBe(preFrames);
          state = suspendAt(state, {}, 1000);
          for (let i = 0; i < postAttempts; i++) {
            state = tickFrame(state);
          }
          expect(state.frameCount).toBe(preFrames); // unchanged
        },
      ),
      { numRuns: 100 },
    );
  });

  it("only valid state transitions are accepted", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...THREE_D_LIFECYCLE_STATES),
        fc.constantFrom(...THREE_D_LIFECYCLE_STATES),
        (from, to) => {
          const result = transition(from, to);
          if (isValidTransition(from, to)) {
            expect(result.transitioned).toBe(true);
            expect(result.state).toBe(to);
          } else {
            expect(result.transitioned).toBe(false);
            expect(result.state).toBe(from);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("intersection change round-trip preserves committed actions", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        (actionIds) => {
          let state = createInitialRuntimeState("initializing", ERROR_BOUNDARY);
          state = activate(state);
          for (let i = 0; i < actionIds.length; i++) {
            state = commitAction(state, actionIds[i]!, `Act ${i}`, i);
          }
          // Leave viewport
          state = handleIntersectionChange(state, false, { saved: true });
          expect(state.lifecycle).toBe("suspended");
          // Re-enter viewport
          state = handleIntersectionChange(state, true, {});
          expect(state.lifecycle).toBe("active");
          for (const id of actionIds) {
            expect(isActionCommitted(state, id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
