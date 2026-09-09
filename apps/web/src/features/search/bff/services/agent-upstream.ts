import "server-only";

import { resolveBedService, SEARCH_ENDPOINTS } from "@config/bed-services";
import { buildBedHeadersWithApiKey } from "@shared/lib/http/bed-client";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import type { AgentSearchRequest } from "../contracts/agent-request.schema";
import { createAgentErrorStream, createAgentSseResponse } from "../lib/sse";
import { buildAgentPayload } from "./agent-payload";
import { runAgentStreamPipeline } from "./agent-stream-pipeline";
import { agentVersionHandler } from "./agent-version-registry";

type EventTransform = (parsed: AsyncGenerator<unknown>) => AsyncGenerator<Record<string, unknown>>;

/**
 * Fetches the search agent SSE stream from the BED "search" service. Single
 * upstream path for every version; `agentVersion` only selects the response
 * transformer (see `agent-version-registry`).
 */
async function fetchAgentStream(
  request: AgentSearchRequest,
  signal?: AbortSignal
): Promise<Response> {
  const service = resolveBedService("search");
  if (!service) {
    return createAgentSseResponse(
      createAgentErrorStream(
        "ServiceUnavailable",
        "Search upstream service is not configured (API_UPSTREAM_URL + SEARCH_API_KEY)"
      )
    );
  }

  const identity = await readVisitorIdentity();
  const runtimeSessionId = crypto.randomUUID();

  const headers: Record<string, string> = {
    ...buildBedHeadersWithApiKey(service, identity),
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...originVerifyHeader(),
  };

  const body = buildAgentPayload(request);
  const url = `${service.baseUrl}${SEARCH_ENDPOINTS.agent}`;

  // Pass `null` (not "") for anonymous visitors so the Complete debug context
  // omits visitorId, matching the BED omit-when-anonymous rule.
  const handler = agentVersionHandler(request.agentVersion);
  const transform: EventTransform = (parsed) =>
    handler.transform(parsed, runtimeSessionId, identity.visitorId ?? null);

  return runAgentStreamPipeline({
    url,
    headers,
    body,
    signal,
    serviceLabel: "agent",
    ensureTerminalEvent: true,
    transform,
  });
}

export { fetchAgentStream };
