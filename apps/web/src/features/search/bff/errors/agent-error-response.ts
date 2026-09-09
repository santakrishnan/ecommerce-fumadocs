import type { AgentErrorCode } from "./agent.errors";
import { AgentErrorCodes } from "./agent.errors";

interface PreStreamErrorBody {
  error: { code: string; message: string };
  meta: { timestamp: string };
}

/**
 * Returns a JSON Response for pre-stream failures (before SSE opens).
 *
 * Looks up the default HTTP status from AgentErrorCodes when the code is
 * registered there. SDK-derived codes (e.g. "ServiceUnavailable", "InternalError")
 * that appear in AgentErrorCodes will resolve their default status; any
 * unregistered code falls back to 500. statusOverride always wins.
 */
export function agentPreStreamErrorResponse(
  code: AgentErrorCode,
  message: string,
  statusOverride?: number
): Response {
  const entry = (AgentErrorCodes as Record<string, { status: number } | undefined>)[code];
  const defaultStatus = entry?.status ?? 500;
  const status = statusOverride ?? defaultStatus;
  const body: PreStreamErrorBody = {
    error: { code, message },
    meta: { timestamp: new Date().toISOString() },
  };
  return Response.json(body, { status });
}

/**
 * Serializes an in-stream Error SSE frame string.
 */
export function agentErrorSseFrame(code: string, message: string): string {
  return `event: Error\ndata: ${JSON.stringify({ type: "Error", error: { code, message } })}\n\n`;
}
