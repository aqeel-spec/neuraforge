/**
 * startSelfHostedRuntime — invokes injected binder for enabled endpoints only.
 *
 * Does NOT bind/listen itself. Tests prove invalid config/tampered bundle
 * invokes binder zero times. No process.exit.
 */

import type { EnabledInterface, EndpointConfig } from "./config-types.js";
import type { PreparedRuntime } from "./prepare.js";

/** What the binder receives for each enabled endpoint. */
export interface BindRequest {
  readonly interfaceId: EnabledInterface;
  readonly endpoint: EndpointConfig;
  readonly handler: unknown;
}

/** Injected binder — the operator provides the actual network binding logic. */
export type RuntimeBinder = (request: BindRequest) => Promise<void>;

/** Handle to stop a started runtime. */
export interface StartedRuntime {
  readonly enabledInterfaces: readonly EnabledInterface[];
  readonly boundCount: number;
}

/**
 * Starts the self-hosted runtime by invoking the binder for each enabled endpoint.
 * The binder is responsible for actual network binding. No process.exit.
 */
export async function startSelfHostedRuntime(
  prepared: PreparedRuntime,
  binder: RuntimeBinder,
): Promise<StartedRuntime> {
  let boundCount = 0;

  for (const iface of prepared.enabledInterfaces) {
    const endpoint = prepared.config.endpoints[iface];

    let handler: unknown = null;

    switch (iface) {
      case "registry":
      case "public-api":
        handler = prepared.publicApi;
        break;
      case "mcp":
        handler = prepared.mcpDispatcher;
        break;
      case "docs":
        handler = prepared.docsHandler;
        break;
    }

    if (handler !== null) {
      await binder({ interfaceId: iface, endpoint, handler });
      boundCount++;
    }
  }

  return {
    enabledInterfaces: prepared.enabledInterfaces,
    boundCount,
  };
}
