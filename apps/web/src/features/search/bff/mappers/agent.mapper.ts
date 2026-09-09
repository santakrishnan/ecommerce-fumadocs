import type { AgentSearchEvent } from "@ucmp/sdk-search-api";
import {
  completeEventTypeEnum,
  deltaEventTypeEnum,
  statusEventTypeEnum,
  streamErrorEventTypeEnum,
  toolCallEventTypeEnum,
  toolResultEventTypeEnum,
} from "@ucmp/sdk-search-api";

const VALID_EVENT_TYPES = new Set<string>([
  statusEventTypeEnum.Status,
  toolCallEventTypeEnum.ToolCall,
  toolResultEventTypeEnum.ToolResult,
  deltaEventTypeEnum.Delta,
  completeEventTypeEnum.Complete,
  streamErrorEventTypeEnum.Error,
]);

function isAgentSearchEvent(raw: unknown): raw is AgentSearchEvent {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }

  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (typeof type !== "string" || !VALID_EVENT_TYPES.has(type)) {
    return false;
  }

  switch (type) {
    case statusEventTypeEnum.Status:
      return typeof r.searchId === "string" && typeof r.stage === "string";
    case deltaEventTypeEnum.Delta:
      return typeof r.text === "string";
    case toolCallEventTypeEnum.ToolCall:
      return typeof r.toolName === "string" && typeof r.toolCallId === "string";
    case toolResultEventTypeEnum.ToolResult:
      return typeof r.toolCallId === "string" && typeof r.status === "string";
    case streamErrorEventTypeEnum.Error:
      return (
        typeof (r.error as { code?: unknown } | undefined)?.code === "string" &&
        typeof (r.error as { message?: unknown } | undefined)?.message === "string"
      );
    case completeEventTypeEnum.Complete:
      return typeof (r.payload as { searchId?: unknown } | undefined)?.searchId === "string";
    default:
      return false;
  }
}

/**
 * Maps a raw upstream event to a typed AgentSearchEvent.
 * Returns null for unrecognised or malformed events.
 */
export function mapAgentUpstreamEvent(raw: unknown): AgentSearchEvent | null {
  return isAgentSearchEvent(raw) ? raw : null;
}
