/**
 * Node.js HTTP request listener adapter.
 *
 * Adapts node:http IncomingMessage/ServerResponse to the framework-neutral
 * HttpRequest/HttpResponse contract. Does not bind/listen by itself.
 * Rejects request bodies for GET/HEAD. Bounds response size.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { PublicApiHandler, HttpRequest } from "./types.js";

/** Maximum response body size (10 MB). */
const MAX_RESPONSE_BODY_SIZE = 10 * 1024 * 1024;

/** Maximum allowed incoming content-length for GET/HEAD (reject bodies). */
const MAX_GET_BODY_SIZE = 0;

/**
 * Creates a Node.js HTTP request listener from a PublicApiHandler.
 * The listener adapts path/query/headers without adding business logic.
 * It does not bind or listen by itself.
 */
export function createNodeRequestListener(
  handler: PublicApiHandler,
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req: IncomingMessage, res: ServerResponse): void => {
    void handleNodeRequest(handler, req, res);
  };
}

async function handleNodeRequest(
  handler: PublicApiHandler,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const method = (req.method ?? "GET").toUpperCase();

    // Reject request bodies for GET/HEAD
    if (method === "GET" || method === "HEAD") {
      const contentLength = req.headers["content-length"];
      if (contentLength !== undefined && Number(contentLength) > MAX_GET_BODY_SIZE) {
        res.writeHead(413, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": "0",
        });
        res.end();
        return;
      }
    }

    // Parse URL
    const url = req.url ?? "/";
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url, "http://localhost");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: { code: "invalid_url", message: "Invalid URL" } }));
      return;
    }

    // Build query map
    const query: Record<string, string | undefined> = {};
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      query[key] = value;
    }

    // Build headers map (lowercase keys)
    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(", ");
      }
    }

    const request: HttpRequest = {
      method,
      path: parsedUrl.pathname,
      query,
      headers,
    };

    const response = await handler.handle(request);

    // Bound response size
    if (response.body.length > MAX_RESPONSE_BODY_SIZE) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          error: { code: "response_too_large", message: "Response exceeds size limit" },
        }),
      );
      return;
    }

    // Write response
    res.writeHead(response.status, response.headers);
    if (method === "HEAD" || response.body === "") {
      res.end();
    } else {
      res.end(response.body, "utf-8");
    }
  } catch {
    if (!res.headersSent) {
      res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          error: { code: "service_unavailable", message: "Service temporarily unavailable" },
        }),
      );
    }
  }
}
