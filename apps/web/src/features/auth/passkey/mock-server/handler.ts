import "server-only";

import { createLogger } from "@shared/lib/logger";
import { connection } from "next/server";
import { MockRpError } from "./server";

const log = createLogger("mock-rp");

/** Keep terminal output readable: long base64 fields are shortened. */
function brief(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 48 ? `${value.slice(0, 24)}…(${value.length} chars)` : value;
  }
  if (Array.isArray(value)) {
    return value.map(brief);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, brief(v)])
    );
  }
  return value;
}

/**
 * THROWAWAY (see server.ts cleanup notes). Wraps a mock-RP operation in a route handler: parses the JSON body, maps
 * `MockRpError` to its status and everything else to 500, never leaks stacks.
 */
export function mockRpRoute<T>(
  run: (request: Request, body: unknown) => Promise<T>
): (request: Request) => Promise<Response> {
  return async (request) => {
    await connection();
    const path = new URL(request.url).pathname;
    let body: unknown = {};
    if (request.method === "POST" || request.method === "PATCH") {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }
    log.info(`→ ${request.method} ${path}`, {
      body: brief(body),
      cookies:
        request.headers
          .get("cookie")
          ?.split(";")
          .map((c) => c.trim().split("=")[0]) ?? [],
    });
    try {
      const result = await run(request, body);
      log.info(`← 200 ${path}`, { response: brief(result) });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof MockRpError) {
        log.warn(`← ${error.status} ${path}`, { error: error.message });
        return Response.json({ error: error.message }, { status: error.status });
      }
      const message = error instanceof Error ? error.message : "Unexpected error";
      log.error(`← 500 ${path}`, { error: message });
      return Response.json({ error: message }, { status: 500 });
    }
  };
}
