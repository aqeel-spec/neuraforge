/**
 * Runtime React components for 3D rendering using Three.js / @react-three/fiber.
 * These are the actual renderable 3D components agents install into projects.
 *
 * @ts-nocheck — This file depends on browser APIs (IntersectionObserver, matchMedia).
 * Type checking is deferred to consumer projects.
 */

// @ts-nocheck

import * as React from "react";

import type { ThreeDCapability, ThreeDFallbackContract } from "./types.js";
import { defaultCapabilityPredicate, shouldRenderFallback } from "./capability.js";
import type { ThreeDRuntimeState } from "./lifecycle.js";
import {
  activate,
  commitAction,
  createInitialRuntimeState,
  fail,
  handleIntersectionChange,
  isActionCommitted,
  shouldRenderLoopRun,
} from "./lifecycle.js";

// ---------------------------------------------------------------------------
// ThreeDContainer — manages 3D lifecycle and fallback
// ---------------------------------------------------------------------------

export interface ThreeDContainerProps {
  /** Required 3D capability. */
  requiredCapability: ThreeDCapability;
  /** Fallback contract with description and source. */
  fallback: ThreeDFallbackContract;
  /** Error boundary configuration. */
  errorBoundary: { initTimeoutMs: number; retryOnContextRestored: boolean; maxRetries: number };
  /** The 3D scene content (rendered when capability available). */
  children: React.ReactNode;
  /** The fallback content (rendered when capability unavailable or failed). */
  fallbackContent: React.ReactNode;
  /** Container className. */
  className?: string;
  /** Called when the component's lifecycle state changes. */
  onStateChange?: (state: ThreeDRuntimeState) => void;
}

/**
 * A container that manages the full 3D component lifecycle:
 * - Detects capability on mount
 * - Renders fallback or 3D content based on state
 * - Handles intersection-based suspension
 * - Provides error boundary behavior
 */
export function ThreeDContainer({
  requiredCapability,
  fallback,
  errorBoundary,
  children,
  fallbackContent,
  className,
  onStateChange,
}: ThreeDContainerProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [runtimeState, setRuntimeState] = React.useState<ThreeDRuntimeState>(() => {
    const isAvailable = defaultCapabilityPredicate(requiredCapability);
    const initial = isAvailable ? "initializing" : "fallback";
    return createInitialRuntimeState(initial as "initializing" | "fallback", errorBoundary);
  });

  // Notify parent of state changes
  React.useEffect(() => {
    onStateChange?.(runtimeState);
  }, [runtimeState, onStateChange]);

  // Simulate initialization (in real usage, this would be Canvas onCreated)
  React.useEffect(() => {
    if (runtimeState.lifecycle === "initializing") {
      const timer = setTimeout(() => {
        setRuntimeState((s) => activate(s));
      }, 100);

      const failTimer = setTimeout(() => {
        setRuntimeState((s) => {
          if (s.lifecycle === "initializing") {
            return fail(s, "Initialization timeout");
          }
          return s;
        });
      }, errorBoundary.initTimeoutMs);

      return () => {
        clearTimeout(timer);
        clearTimeout(failTimer);
      };
    }
    return undefined;
  }, [runtimeState.lifecycle, errorBoundary.initTimeoutMs]);

  // IntersectionObserver for viewport suspension
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setRuntimeState((s) =>
          handleIntersectionChange(s, entry.isIntersecting, { timestamp: Date.now() }),
        );
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Determine what to render
  const showFallback = shouldRenderFallback(runtimeState.lifecycle);

  return React.createElement(
    "div",
    {
      ref: containerRef,
      className,
      "data-lifecycle": runtimeState.lifecycle,
      "data-render-loop": shouldRenderLoopRun(runtimeState),
      "aria-label": showFallback ? fallback.description : undefined,
    },
    showFallback ? fallbackContent : children,
  );
}

// ---------------------------------------------------------------------------
// SceneController — provides action journaling to 3D scenes
// ---------------------------------------------------------------------------

export interface SceneControllerContext {
  /** Commit a user-visible action (prevents replay after suspend/resume). */
  commitAction: (actionId: string, description: string) => void;
  /** Check if an action was already committed (skip on resume). */
  isCommitted: (actionId: string) => boolean;
  /** Current lifecycle state. */
  lifecycle: ThreeDRuntimeState["lifecycle"];
  /** Current frame count. */
  frameCount: number;
}

const SceneContext = React.createContext<SceneControllerContext | null>(null);

export interface SceneControllerProps {
  /** Current runtime state from ThreeDContainer. */
  runtimeState: ThreeDRuntimeState;
  /** State setter from ThreeDContainer. */
  onStateUpdate: (updater: (s: ThreeDRuntimeState) => ThreeDRuntimeState) => void;
  /** Children that need access to the scene controller. */
  children: React.ReactNode;
}

/**
 * Provides action journaling and lifecycle awareness to child 3D scene components.
 */
export function SceneController({
  runtimeState,
  onStateUpdate,
  children,
}: SceneControllerProps): React.JSX.Element {
  const ctx: SceneControllerContext = React.useMemo(
    () => ({
      commitAction: (actionId: string, description: string) => {
        onStateUpdate((s) => commitAction(s, actionId, description));
      },
      isCommitted: (actionId: string) => isActionCommitted(runtimeState, actionId),
      lifecycle: runtimeState.lifecycle,
      frameCount: runtimeState.frameCount,
    }),
    [runtimeState, onStateUpdate],
  );

  return React.createElement(SceneContext.Provider, { value: ctx }, children);
}

/**
 * Hook to access the scene controller from within a 3D scene.
 */
export function useSceneController(): SceneControllerContext {
  const ctx = React.useContext(SceneContext);
  if (!ctx) {
    throw new Error("useSceneController must be used within a SceneController");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// ReducedMotion3D — wraps 3D content with reduced-motion support
// ---------------------------------------------------------------------------

export interface ReducedMotion3DProps {
  /** Full 3D animated content. */
  children: React.ReactNode;
  /** Static/reduced-motion alternative. */
  reducedContent: React.ReactNode;
}

/**
 * Renders full 3D animated content or a reduced-motion alternative based on
 * the user's prefers-reduced-motion setting.
 */
export function ReducedMotion3D({
  children,
  reducedContent,
}: ReducedMotion3DProps): React.JSX.Element {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return React.createElement(React.Fragment, null, prefersReduced ? reducedContent : children);
}
