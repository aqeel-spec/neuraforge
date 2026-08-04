/**
 * Serverless entry point for the Public API.
 * Compatible with Cloudflare Workers, Vercel Edge Functions, and AWS Lambda.
 *
 * This module provides adapters that wrap the platform-agnostic PublicApiHandler
 * into the request model expected by each serverless platform.
 *
 * Usage:
 *   1. Build or load a verified ReleaseBundle
 *   2. Call createPublicApi(bundle) to get a handler
 *   3. Use createFetchAdapter(handler) for Fetch-based platforms
 *   4. Use createLambdaAdapter(handler) for AWS Lambda
 */

import type { PublicApiHandler } from "./types.js";

// ---------------------------------------------------------------------------
// Fetch API Adapter (Cloudflare Workers / Vercel Edge / Deno Deploy)
// ---------------------------------------------------------------------------

/**
 * Creates a Fetch-compatible handler from the PublicApiHandler.
 * Suitable for Cloudflare Workers, Vercel Edge Functions, Deno Deploy,
 * or any platform supporting the Web Fetch API (Request → Response).
 */
export function createFetchAdapter(handler: PublicApiHandler) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const result = await handler.handle({
      method: request.method,
      path: url.pathname,
      query,
      headers: {},
    });

    return new Response(result.body, {
      status: result.status,
      headers: {
        ...result.headers,
        ...corsHeaders(),
      },
    });
  };
}

// ---------------------------------------------------------------------------
// AWS Lambda Adapter (API Gateway v2 HTTP API)
// ---------------------------------------------------------------------------

/** API Gateway v2 event shape. */
interface LambdaEvent {
  readonly requestContext: { readonly http: { readonly method: string; readonly path: string } };
  readonly queryStringParameters?: Record<string, string>;
  readonly headers?: Record<string, string>;
}

/** API Gateway v2 response shape. */
interface LambdaResponse {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: string;
}

/**
 * Creates an AWS Lambda handler from the PublicApiHandler.
 * Compatible with API Gateway v2 (HTTP API) payload format.
 */
export function createLambdaAdapter(handler: PublicApiHandler) {
  return async (event: LambdaEvent): Promise<LambdaResponse> => {
    const result = await handler.handle({
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
      query: event.queryStringParameters ?? {},
      headers: event.headers ?? {},
    });

    return {
      statusCode: result.status,
      headers: {
        ...result.headers,
        ...corsHeaders(),
      },
      body: result.body,
    };
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export { createPublicApi } from "./handler.js";
export { createRouter } from "./router.js";
