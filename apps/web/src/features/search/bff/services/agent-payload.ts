import "server-only";

import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import type { AgentSearchRequest } from "../contracts/agent-request.schema";
import { agentVersionHandler } from "./agent-version-registry";

const DEFAULT_RADIUS_MILES = 100;

/**
 * Builds the unified agent request body. `agentVersion` is forwarded untouched
 * (default {@link DEFAULT_AGENT_VERSION}); query composition is delegated to the
 * version's registered `composeQuery` hook, or forwarded as-is when there's none.
 */
function buildAgentPayload(input: AgentSearchRequest): Record<string, unknown> {
  const { location, debug: _debug, query, filters, agentVersion, ...rest } = input;
  const resolvedAgentVersion = agentVersion ?? DEFAULT_AGENT_VERSION;
  const handler = agentVersionHandler(resolvedAgentVersion);

  const body: Record<string, unknown> = {
    ...rest,
    agentVersion: resolvedAgentVersion,
  };

  if (filters) {
    body.filters = filters;
  }

  if (handler.composeQuery) {
    const composed = handler.composeQuery(query, filters);
    if (composed) {
      body.query = composed;
    }
  } else if (query !== undefined) {
    body.query = query;
  }

  if (location) {
    body.location = { ...location, radiusMiles: DEFAULT_RADIUS_MILES };
  }

  return body;
}

export { buildAgentPayload };
