/**
 * Optional hosted MCP capacity boundary.
 *
 * This service isolates hosted identity, billing, and quota state from the public
 * artifact/operation core (`packages/mcp-core`, `packages/catalog-core`). Nothing under
 * `services/hosted-gateway` may be imported by, or influence the output of, the public
 * MCP dispatcher: Hosted Plan differences are limited to quota metadata and documented
 * account/organization administration (Requirements 18.4, 18.5).
 *
 * This module (task 9.1) publishes only the isolated hosted data models: immutable
 * Pricing Versions, Billing Cycles/Quota Windows, Subscriptions, and the strict Quota
 * Ledger allowlist. The authenticated gateway/dispatch adapter that uses these models is
 * implemented by a later task (9.2).
 */
export const hostedGatewayBoundary = {
  id: "hosted-gateway",
  responsibility: "optional managed capacity isolated from artifact access",
  publicSource: true,
} as const;

export * from "./pricing.js";
export * from "./billing-cycle.js";
export * from "./subscription.js";
export * from "./quota-ledger.js";
