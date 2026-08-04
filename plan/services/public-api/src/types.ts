/**
 * Framework-neutral HTTP types for the public API.
 *
 * These types define the handler contract: method, path, query, and headers only.
 * No user/account/session/auth/paid-plan/access-gate inputs exist.
 */

/** Incoming HTTP request — framework-neutral, read-only. */
export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly query: Readonly<Record<string, string | undefined>>;
  readonly headers: Readonly<Record<string, string | undefined>>;
}

/** Outgoing HTTP response — framework-neutral. */
export interface HttpResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

/** The public API handler function. */
export interface PublicApiHandler {
  readonly handle: (request: HttpRequest) => Promise<HttpResponse>;
}
