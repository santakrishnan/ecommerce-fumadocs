import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { ErrorDetailCodeEnumKey } from "@ucmp/sdk-search-api";
import { isValidErrorDetail } from "./sdk-error-detail.guard";

/**
 * Default HTTP statuses for agent error codes used in pre-stream JSON responses
 * and SSE error frames. BFF-only codes retain their own keys; upstream SDK codes
 * use their SDK enum key as the object key.
 *
 * NOTE: The status for SearchToolTimeout (504) is a placeholder — confirm with
 * product in a follow-up ticket (see blast-radius notes).
 */
export const AgentErrorCodes = {
  AGENT_VALIDATION_FAILED: { code: "AGENT_VALIDATION_FAILED", status: 400 },
  ServiceUnavailable: { code: "ServiceUnavailable", status: 503 },
  InternalError: { code: "InternalError", status: 500 },
  AgentAborted: { code: "AgentAborted", status: 499 },
  SearchToolTimeout: { code: "SearchToolTimeout", status: 504 },
  AGENT_INTERNAL_ERROR: { code: "AGENT_INTERNAL_ERROR", status: 500 },
} as const;

/**
 * BFF-layer error codes for the agent domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey` (which includes
 * agent-specific codes such as "AgentAborted" and "SearchToolTimeout"). BFF-only
 * codes that have no SDK equivalent are appended as local augmentations.
 */
export type AgentErrorCode =
  | ErrorDetailCodeEnumKey
  | "AGENT_VALIDATION_FAILED"
  | "AGENT_INTERNAL_ERROR";

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  status: number;
}

export function createAgentError(
  code: AgentErrorCode,
  message: string,
  status: number
): AgentError {
  return { code, message, status };
}

export function mapCaughtToAgentError(error: unknown): AgentError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createAgentError(
        errorDetail.code as AgentErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createAgentError(
        "ServiceUnavailable",
        "Search agent service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createAgentError(
        "ServiceUnavailable",
        "Search agent service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createAgentError(
      "InternalError",
      "Search agent service returned an error",
      error.status
    );
  }

  return createAgentError(
    "AGENT_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
