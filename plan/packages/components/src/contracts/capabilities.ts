import type { BrowserCapabilityId, CapabilityDetector } from "./types.js";

/**
 * Concrete, synchronous detectors for the closed `BrowserCapabilityId` set.
 *
 * Every detector is safe to call outside a browser (SSR/Node/test) environment: it
 * checks for the existence of the global it depends on before touching it, and returns
 * `false` rather than throwing when that global is absent. This lets a Component call
 * its declared detector unconditionally during render instead of branching on the
 * execution environment itself.
 */
export const capabilityDetectors: Readonly<Record<BrowserCapabilityId, CapabilityDetector>> = {
  "container-queries": () =>
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("container-type: inline-size"),
  "backdrop-filter": () =>
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    (CSS.supports("backdrop-filter: blur(1px)") ||
      CSS.supports("-webkit-backdrop-filter: blur(1px)")),
  "view-transitions": () => typeof document !== "undefined" && "startViewTransition" in document,
  popover: () => typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype,
  "dialog-element": () => typeof HTMLDialogElement !== "undefined",
  "prefers-reduced-motion": () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function",
  "intersection-observer": () => typeof IntersectionObserver !== "undefined",
  "resize-observer": () => typeof ResizeObserver !== "undefined",
  webgl: () => {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  },
  webgpu: () => typeof navigator !== "undefined" && "gpu" in navigator,
};

/** Looks up the concrete detector for a declared capability id. */
export function getCapabilityDetector(capability: BrowserCapabilityId): CapabilityDetector {
  return capabilityDetectors[capability];
}

/**
 * Reads the user's reduced-motion preference. Returns `false` (motion allowed) outside a
 * browser environment so server-rendered output matches the animated default, and the
 * client re-evaluates on hydration.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
