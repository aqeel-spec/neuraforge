export const catalogCoreBoundary = {
  id: "catalog-core",
  responsibility: "pure catalog validation, integrity, and resolution",
  publicSource: true,
} as const;

export * from "./errors.js";
export * from "./access.js";
export * from "./provenance.js";
export * from "./release-eligibility.js";
export * from "./canonical-bytes.js";
export * from "./version-resolution.js";
