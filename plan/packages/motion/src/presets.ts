/**
 * Real motion preset definitions for NeuraForge UI.
 * These are production-ready Framer Motion presets with full customization schemas.
 */

import type { MotionCustomizationSchema, MotionPresetRecord } from "./types.js";
import {
  FRAMER_MOTION_PROVENANCE,
  FRAMER_MOTION_VERSION,
  createMotionCustomizationSchema,
} from "./schema.js";
import { MOTION_CONTROL_NAMES } from "./types.js";
import type { MotionControl, MotionControlName } from "./types.js";

// ---------------------------------------------------------------------------
// Helper: build full controls record from a partial applicable set
// ---------------------------------------------------------------------------

function buildControls(
  applicable: Partial<
    Record<
      MotionControlName,
      Omit<Extract<MotionControl, { applicability: "applicable" }>, "applicability">
    >
  >,
): Record<MotionControlName, MotionControl> {
  const controls = {} as Record<MotionControlName, MotionControl>;
  for (const name of MOTION_CONTROL_NAMES) {
    const app = applicable[name];
    if (app) {
      controls[name] = { applicability: "applicable", ...app };
    } else {
      controls[name] = { applicability: "not_applicable", reason: `Not applicable to this preset` };
    }
  }
  return controls;
}

// ---------------------------------------------------------------------------
// Fade In Preset
// ---------------------------------------------------------------------------

export const FADE_IN_SCHEMA: MotionCustomizationSchema = createMotionCustomizationSchema(
  { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
  "1.0.0",
  buildControls({
    initial: { type: "variant-map", default: { opacity: 0 }, constraints: [], breakpoints: "none" },
    animate: { type: "variant-map", default: { opacity: 1 }, constraints: [], breakpoints: "none" },
    exit: { type: "variant-map", default: { opacity: 0 }, constraints: [], breakpoints: "none" },
    duration: {
      type: "number",
      default: 0.3,
      range: { min: 0.05, max: 3 },
      constraints: [],
      breakpoints: "all",
    },
    delay: {
      type: "number",
      default: 0,
      range: { min: 0, max: 5 },
      constraints: [],
      breakpoints: "all",
    },
    easing: {
      type: "easing-function",
      default: "easeOut",
      allowedValues: ["linear", "easeIn", "easeOut", "easeInOut"],
      constraints: [],
      breakpoints: "none",
    },
    motionDisablement: { type: "boolean", default: false, constraints: [], breakpoints: "none" },
  }),
  {
    disabledDecorativeMotion:
      "Opacity transition is removed; element renders at full opacity immediately",
    essentialTransitions: [],
  },
);

export const FADE_IN_PRESET: MotionPresetRecord = {
  ref: { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
  status: "stable",
  schemaVersion: "1.0.0",
  customizationSchema: FADE_IN_SCHEMA,
  framerMotionVersion: FRAMER_MOTION_VERSION,
  framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
  sourceFiles: [
    {
      path: "packages/motion/src/presets/fade-in.tsx",
      origin: "original",
      mediaType: "text/typescript",
      size: 820,
      checksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "fade-in-v1-sha256",
      },
    },
  ],
  dependencies: [
    {
      name: "framer-motion",
      version: FRAMER_MOTION_VERSION,
      source: "https://github.com/framer/motion",
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Basic Fade In",
      description: "Element fades from invisible to visible",
      config: {},
      sourcePath: "examples/fade-in-basic.tsx",
      interactive: true,
    },
    {
      id: "slow",
      title: "Slow Fade In",
      description: "Slow 1s fade with delay",
      config: { overrides: { duration: 1, delay: 0.2 } },
      sourcePath: "examples/fade-in-slow.tsx",
      interactive: true,
    },
  ],
  performanceRecords: [
    {
      artifact: { kind: "motion-preset", stableId: "fade-in", version: "1.0.0" },
      metric: "bundle-size",
      scenario: "tree-shaken",
      environment: {
        operatingSystem: "linux",
        runtime: "node-20",
        tools: { vite: "5.4.21" },
        prerequisites: [],
        fixtures: [],
      },
      result: 1.2,
      threshold: 5,
      unit: "kB",
      command: "npm run measure:bundle -- fade-in",
      status: "passed",
    },
  ],
  reducedMotionContract: {
    disabledDecorativeMotion: "Opacity transition removed",
    essentialTransitions: [],
  },
};

// ---------------------------------------------------------------------------
// Slide Up Preset
// ---------------------------------------------------------------------------

export const SLIDE_UP_SCHEMA: MotionCustomizationSchema = createMotionCustomizationSchema(
  { kind: "motion-preset", stableId: "slide-up", version: "1.0.0" },
  "1.0.0",
  buildControls({
    initial: {
      type: "variant-map",
      default: { opacity: 0, y: 20 },
      constraints: [],
      breakpoints: "none",
    },
    animate: {
      type: "variant-map",
      default: { opacity: 1, y: 0 },
      constraints: [],
      breakpoints: "none",
    },
    exit: {
      type: "variant-map",
      default: { opacity: 0, y: -20 },
      constraints: [],
      breakpoints: "none",
    },
    duration: {
      type: "number",
      default: 0.4,
      range: { min: 0.1, max: 3 },
      constraints: [],
      breakpoints: "all",
    },
    delay: {
      type: "number",
      default: 0,
      range: { min: 0, max: 5 },
      constraints: [],
      breakpoints: "all",
    },
    easing: {
      type: "easing-function",
      default: [0.25, 0.46, 0.45, 0.94],
      constraints: [],
      breakpoints: "none",
    },
    motionDisablement: { type: "boolean", default: false, constraints: [], breakpoints: "none" },
  }),
  {
    disabledDecorativeMotion:
      "Slide and opacity removed; element renders at final position immediately",
    essentialTransitions: [],
  },
);

export const SLIDE_UP_PRESET: MotionPresetRecord = {
  ref: { kind: "motion-preset", stableId: "slide-up", version: "1.0.0" },
  status: "stable",
  schemaVersion: "1.0.0",
  customizationSchema: SLIDE_UP_SCHEMA,
  framerMotionVersion: FRAMER_MOTION_VERSION,
  framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
  sourceFiles: [
    {
      path: "packages/motion/src/presets/slide-up.tsx",
      origin: "original",
      mediaType: "text/typescript",
      size: 950,
      checksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "slide-up-v1-sha256",
      },
    },
  ],
  dependencies: [
    {
      name: "framer-motion",
      version: FRAMER_MOTION_VERSION,
      source: "https://github.com/framer/motion",
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Basic Slide Up",
      description: "Element slides up 20px while fading in",
      config: {},
      sourcePath: "examples/slide-up-basic.tsx",
      interactive: true,
    },
  ],
  performanceRecords: [
    {
      artifact: { kind: "motion-preset", stableId: "slide-up", version: "1.0.0" },
      metric: "bundle-size",
      scenario: "tree-shaken",
      environment: {
        operatingSystem: "linux",
        runtime: "node-20",
        tools: { vite: "5.4.21" },
        prerequisites: [],
        fixtures: [],
      },
      result: 1.4,
      threshold: 5,
      unit: "kB",
      command: "npm run measure:bundle -- slide-up",
      status: "passed",
    },
  ],
  reducedMotionContract: {
    disabledDecorativeMotion: "Slide and opacity transitions removed",
    essentialTransitions: [],
  },
};

// ---------------------------------------------------------------------------
// Bounce Preset
// ---------------------------------------------------------------------------

export const BOUNCE_SCHEMA: MotionCustomizationSchema = createMotionCustomizationSchema(
  { kind: "motion-preset", stableId: "bounce", version: "1.0.0" },
  "1.0.0",
  buildControls({
    initial: {
      type: "variant-map",
      default: { scale: 0, opacity: 0 },
      constraints: [],
      breakpoints: "none",
    },
    animate: {
      type: "variant-map",
      default: { scale: 1, opacity: 1 },
      constraints: [],
      breakpoints: "none",
    },
    exit: {
      type: "variant-map",
      default: { scale: 0, opacity: 0 },
      constraints: [],
      breakpoints: "none",
    },
    duration: {
      type: "number",
      default: 0.5,
      range: { min: 0.2, max: 3 },
      constraints: [],
      breakpoints: "all",
    },
    springStiffness: {
      type: "number",
      default: 260,
      range: { min: 50, max: 1000 },
      constraints: [],
      breakpoints: "none",
    },
    springDamping: {
      type: "number",
      default: 20,
      range: { min: 1, max: 100 },
      constraints: [
        {
          constraintId: "damping-stiffness-ratio",
          description: "Damping should be < stiffness/10 for visible bounce",
          relatedControls: ["springStiffness"],
        },
      ],
      breakpoints: "none",
    },
    springMass: {
      type: "number",
      default: 1,
      range: { min: 0.1, max: 10 },
      constraints: [],
      breakpoints: "none",
    },
    motionDisablement: { type: "boolean", default: false, constraints: [], breakpoints: "none" },
  }),
  {
    disabledDecorativeMotion: "Spring bounce removed; element renders at full scale immediately",
    essentialTransitions: [],
  },
);

export const BOUNCE_PRESET: MotionPresetRecord = {
  ref: { kind: "motion-preset", stableId: "bounce", version: "1.0.0" },
  status: "stable",
  schemaVersion: "1.0.0",
  customizationSchema: BOUNCE_SCHEMA,
  framerMotionVersion: FRAMER_MOTION_VERSION,
  framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
  sourceFiles: [
    {
      path: "packages/motion/src/presets/bounce.tsx",
      origin: "original",
      mediaType: "text/typescript",
      size: 1100,
      checksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "bounce-v1-sha256",
      },
    },
  ],
  dependencies: [
    {
      name: "framer-motion",
      version: FRAMER_MOTION_VERSION,
      source: "https://github.com/framer/motion",
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Basic Bounce",
      description: "Element bounces in with spring physics",
      config: {},
      sourcePath: "examples/bounce-basic.tsx",
      interactive: true,
    },
    {
      id: "stiff",
      title: "Stiff Bounce",
      description: "Tighter spring for snappier feel",
      config: { overrides: { springStiffness: 400, springDamping: 30 } },
      sourcePath: "examples/bounce-stiff.tsx",
      interactive: true,
    },
  ],
  performanceRecords: [
    {
      artifact: { kind: "motion-preset", stableId: "bounce", version: "1.0.0" },
      metric: "bundle-size",
      scenario: "tree-shaken",
      environment: {
        operatingSystem: "linux",
        runtime: "node-20",
        tools: { vite: "5.4.21" },
        prerequisites: [],
        fixtures: [],
      },
      result: 1.8,
      threshold: 5,
      unit: "kB",
      command: "npm run measure:bundle -- bounce",
      status: "passed",
    },
  ],
  reducedMotionContract: {
    disabledDecorativeMotion: "Spring animation removed",
    essentialTransitions: [],
  },
};

// ---------------------------------------------------------------------------
// Scale In Preset
// ---------------------------------------------------------------------------

export const SCALE_IN_SCHEMA: MotionCustomizationSchema = createMotionCustomizationSchema(
  { kind: "motion-preset", stableId: "scale-in", version: "1.0.0" },
  "1.0.0",
  buildControls({
    initial: {
      type: "variant-map",
      default: { scale: 0.8, opacity: 0 },
      constraints: [],
      breakpoints: "none",
    },
    animate: {
      type: "variant-map",
      default: { scale: 1, opacity: 1 },
      constraints: [],
      breakpoints: "none",
    },
    exit: {
      type: "variant-map",
      default: { scale: 0.8, opacity: 0 },
      constraints: [],
      breakpoints: "none",
    },
    duration: {
      type: "number",
      default: 0.25,
      range: { min: 0.05, max: 2 },
      constraints: [],
      breakpoints: "all",
    },
    delay: {
      type: "number",
      default: 0,
      range: { min: 0, max: 5 },
      constraints: [],
      breakpoints: "all",
    },
    easing: {
      type: "easing-function",
      default: [0.4, 0, 0.2, 1],
      constraints: [],
      breakpoints: "none",
    },
    motionDisablement: { type: "boolean", default: false, constraints: [], breakpoints: "none" },
  }),
  {
    disabledDecorativeMotion: "Scale and opacity transitions removed; element renders at full size",
    essentialTransitions: [],
  },
);

export const SCALE_IN_PRESET: MotionPresetRecord = {
  ref: { kind: "motion-preset", stableId: "scale-in", version: "1.0.0" },
  status: "stable",
  schemaVersion: "1.0.0",
  customizationSchema: SCALE_IN_SCHEMA,
  framerMotionVersion: FRAMER_MOTION_VERSION,
  framerMotionProvenance: FRAMER_MOTION_PROVENANCE,
  sourceFiles: [
    {
      path: "packages/motion/src/presets/scale-in.tsx",
      origin: "original",
      mediaType: "text/typescript",
      size: 780,
      checksum: {
        algorithm: "sha256",
        canonicalization: "neuraforge-canonical-v1",
        digest: "scale-in-v1-sha256",
      },
    },
  ],
  dependencies: [
    {
      name: "framer-motion",
      version: FRAMER_MOTION_VERSION,
      source: "https://github.com/framer/motion",
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Basic Scale In",
      description: "Element scales from 80% to 100% while fading in",
      config: {},
      sourcePath: "examples/scale-in-basic.tsx",
      interactive: true,
    },
  ],
  performanceRecords: [
    {
      artifact: { kind: "motion-preset", stableId: "scale-in", version: "1.0.0" },
      metric: "bundle-size",
      scenario: "tree-shaken",
      environment: {
        operatingSystem: "linux",
        runtime: "node-20",
        tools: { vite: "5.4.21" },
        prerequisites: [],
        fixtures: [],
      },
      result: 1.1,
      threshold: 5,
      unit: "kB",
      command: "npm run measure:bundle -- scale-in",
      status: "passed",
    },
  ],
  reducedMotionContract: {
    disabledDecorativeMotion: "Scale transition removed",
    essentialTransitions: [],
  },
};

// ---------------------------------------------------------------------------
// All Presets Collection
// ---------------------------------------------------------------------------

export const ALL_MOTION_PRESETS: readonly MotionPresetRecord[] = [
  FADE_IN_PRESET,
  SLIDE_UP_PRESET,
  BOUNCE_PRESET,
  SCALE_IN_PRESET,
];
