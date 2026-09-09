import {
  AgentSearchRequestSchema,
  agentPreStreamErrorResponse,
  getSearchAgentStream,
} from "@features/search/bff";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";

/**
 * POST /api/v1/search/agent
 *
 * Validates the request and streams an SSE response via the search agent use-case.
 * Delegates mock vs. upstream selection to getSearchAgentStream.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = AgentSearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return agentPreStreamErrorResponse("AGENT_VALIDATION_FAILED", "Invalid request body");
    }

    return await getSearchAgentStream(parsed.data, request.signal, request.cookies);
  } catch {
    return agentPreStreamErrorResponse(
      "AGENT_INTERNAL_ERROR",
      "An unexpected error occurred",
      HTTP_STATUS_INTERNAL_SERVER_ERROR
    );
  }
}
