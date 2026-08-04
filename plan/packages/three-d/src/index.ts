export const threeDBoundary = {
  id: "three-d",
  responsibility: "public 3D components with first-class non-3D fallbacks",
  publicSource: true,
} as const;

export * from "./types.js";
export * from "./capability.js";
export * from "./lifecycle.js";
export * from "./projection.js";
