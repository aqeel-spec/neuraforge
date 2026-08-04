export const compositionsBoundary = {
  id: "compositions",
  responsibility: "deterministic curated page and section compositions",
  publicSource: true,
} as const;

export * from "./types.js";
export * from "./manifest.js";
export * from "./customization.js";
export * from "./selection.js";
export * from "./retrieval.js";
export * from "./mcp-operations.js";
