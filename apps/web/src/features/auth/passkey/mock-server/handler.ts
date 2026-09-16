import "server-only";

import { connection } from "next/server";
import { MockRpError } from "./server";

/**
 * THROWAWAY (see server.ts cleanup notes). Wraps a mock-RP operation in a route handler: parses the JSON body, maps
 * `MockRpError` to its status and everything else to 500, never leaks stacks.
 */
export function mockRpRoute<T>(
  run: (request: Request, body: unknown) => Promise<T>
): (request: Request) => Promise<Response> {
  return async (request) => {
    await connection();
    let body: unknown = {};
    if (request.method === "POST" || request.method === "PATCH") {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }
    try {
      const result = await run(request, body);
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof MockRpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      const message = error instanceof Error ? error.message : "Unexpected error";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}
