import "server-only";

import { isAgentVersion } from "@config/agent-backend";
import { isMockNotFoundSearchId } from "../../lib/mock-not-found-search-ids";
import type { AgentSearchRequest } from "../contracts/agent-request.schema";
import { resolveAgentBackend } from "../lib/resolve-agent-backend";
import { createAgentErrorStream, createAgentSseResponse } from "../lib/sse";
import { mockSearchAgentStream } from "../services/agent-mock";
import { fetchAgentStream } from "../services/agent-upstream";

/** Structural cookie getter — satisfied by `NextRequest.cookies` and `next/headers` cookies(). */
interface CookieGetter {
  get(name: string): { value: string } | undefined;
}

/**
 * Returns an SSE stream for the search agent. Routes on transport
 * (`resolveAgentBackend`: cookie over env, default "v2"):
 *   - `static_mock` → fixture stream
 *   - any known agent version → single upstream path (`fetchAgentStream`); the
 *     version only selects the response transformer, carried on
 *     `request.agentVersion` — not re-read from the cookie here
 *   - otherwise → Error SSE frame
 *
 * @param requestCookies - Pass `request.cookies` from the Route Handler; reading
 *   the `next/headers` store here can block streaming.
 */
export async function getSearchAgentStream(
  request: AgentSearchRequest,
  signal?: AbortSignal,
  requestCookies?: CookieGetter
): Promise<Response> {
  const backend = await resolveAgentBackend(requestCookies);

  if (request.searchId && isMockNotFoundSearchId(request.searchId)) {
    return new Response(null, { status: 404 });
  }

  try {
    if (isAgentVersion(backend)) {
      return await fetchAgentStream({ ...request, agentVersion: backend }, signal);
    }

    switch (backend) {
      case "static_mock":
        return createAgentSseResponse(mockSearchAgentStream(request, signal));

      default:
        throw new Error(`SEARCH_AGENT_BACKEND is not set to a known value (got: ${backend})`);
    }
  } catch (e) {
    return createAgentSseResponse(
      createAgentErrorStream(
        "ServiceUnavailable",
        e instanceof Error ? e.message : "Unknown error, env may be misconfigured"
      )
    );
  }
}
