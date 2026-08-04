export const motionBoundary = {
  id: "motion",
  responsibility: "public Framer Motion presets and animated component schemas",
  publicSource: true,
} as const;

export * from "./types.js";
export * from "./schema.js";
export * from "./resolution.js";
export * from "./validation.js";
export * from "./components.js";
export * from "./projection.js";
export * from "./presets.js";
