/**
 * @neuraforge/public-api — Framework-free, unauthenticated, read-only
 * exact-version HTTP surface over one verified ReleaseBundle.
 *
 * Exposes:
 * - HttpRequest, HttpResponse, PublicApiHandler types
 * - createPublicApi(bundle) — verifies bundle, returns handler
 * - createNodeRequestListener(handler) — node:http adapter
 */

export const publicApiBoundary = {
  id: "public-api",
  responsibility: "unauthenticated exact-version Registry reads",
  publicSource: true,
} as const;

// Types
export type { HttpRequest, HttpResponse, PublicApiHandler } from "./types.js";

// Factory
export { createPublicApi } from "./handler.js";

// Node adapter
export { createNodeRequestListener } from "./node-adapter.js";
