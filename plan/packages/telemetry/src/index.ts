export const telemetryBoundary = {
  id: "telemetry",
  responsibility: "default-off, consent-gated, allowlisted telemetry",
  publicSource: true,
} as const;

export * from "./types.js";
export * from "./schema.js";
export * from "./consent.js";
export * from "./collection.js";
export * from "./deletion.js";
