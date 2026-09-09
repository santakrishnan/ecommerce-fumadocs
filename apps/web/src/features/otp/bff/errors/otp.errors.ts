import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// Shared start + verify error table; start never produces VERIFICATION_FAILED.
// TODO (verify ticket): verify/passkey need the `edi-session-id` continuity
// cookie that createBedClient doesn't send — settle the session model first.
export type OtpErrorCode =
  | "INVALID_REQUEST"
  | "DELIVERY_FAILURE"
  | "VERIFICATION_FAILED"
  | "AUTHENTICATION_ERROR"
  | "PERMISSION_ERROR"
  | "UNEXPECTED_ERROR"
  | "CONFIGURATION_ERROR"
  | "CONNECTION_ERROR"
  | "SERVER_ERROR"
  | "RATE_LIMITING_ERROR";

export interface OtpError {
  code: OtpErrorCode;
  // Upstream identifier (e.g. EDI-TES-100).
  errorCode: string;
  status: number;
}

interface OtpErrorDefinition {
  code: OtpErrorCode;
  status: number;
}

// Maps the upstream `errorCode` (EDI-TES-*) to a domain code + HTTP status.
// The BFF returns codes only — user-facing copy is owned by the client.
export const OTP_ERRORS: Record<string, OtpErrorDefinition> = {
  "EDI-TES-100": {
    code: "INVALID_REQUEST",
    status: HTTP_STATUS_BAD_REQUEST,
  },
  "EDI-TES-101": {
    code: "DELIVERY_FAILURE",
    status: HTTP_STATUS_BAD_REQUEST,
  },
  "EDI-TES-102": {
    code: "VERIFICATION_FAILED",
    status: HTTP_STATUS_BAD_REQUEST,
  },
  "EDI-TES-300": {
    code: "AUTHENTICATION_ERROR",
    status: HTTP_STATUS_UNAUTHORIZED,
  },
  "EDI-TES-301": {
    code: "PERMISSION_ERROR",
    status: HTTP_STATUS_FORBIDDEN,
  },
  "EDI-TES-200": {
    code: "UNEXPECTED_ERROR",
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
  },
  "EDI-TES-201": {
    code: "CONFIGURATION_ERROR",
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
  },
  "EDI-TES-202": {
    code: "CONNECTION_ERROR",
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
  },
  "EDI-TES-203": {
    code: "SERVER_ERROR",
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
  },
  "EDI-TES-204": {
    code: "RATE_LIMITING_ERROR",
    // 429 (not 503) so clients treat it as retryable rate-limiting, not an outage.
    status: HTTP_STATUS_TOO_MANY_REQUESTS,
  },
};

// Forward index (OtpErrorCode → full OtpError), derived from OTP_ERRORS so the
// two can't drift and createOtpError needs no unchecked table lookup.
const OTP_CODE_TO_ERROR = Object.fromEntries(
  Object.entries(OTP_ERRORS).map(([errorCode, def]) => [
    def.code,
    { code: def.code, errorCode, status: def.status },
  ])
) as Record<OtpErrorCode, OtpError>;

export function createOtpError(code: OtpErrorCode): OtpError {
  return OTP_CODE_TO_ERROR[code];
}

// Read `ediErrorCode` from the RFC 9457 problem+json body.
function readEdiErrorCode(body: unknown): string | undefined {
  if (body && typeof body === "object" && "ediErrorCode" in body) {
    const value = (body as { ediErrorCode: unknown }).ediErrorCode;
    if (typeof value === "string") {
      return value;
    }
  }
  return;
}

// Fallback when no recognizable ediErrorCode is present (transport/non-EDI errors).
function mapStatusToOtpCode(status: number): OtpErrorCode {
  if (status === 0) {
    return "CONNECTION_ERROR";
  }
  if (status === HTTP_STATUS_BAD_REQUEST) {
    return "INVALID_REQUEST";
  }
  if (status === HTTP_STATUS_UNAUTHORIZED) {
    return "AUTHENTICATION_ERROR";
  }
  if (status === HTTP_STATUS_FORBIDDEN) {
    return "PERMISSION_ERROR";
  }
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
    return "RATE_LIMITING_ERROR";
  }
  return "SERVER_ERROR";
}

// Map a caught error to an OtpError: prefer `ediErrorCode`, else HTTP status;
// non-ServerHttpError → UNEXPECTED_ERROR.
export function mapCaughtToOtpError(error: unknown): OtpError {
  if (error instanceof ServerHttpError) {
    const ediCode = readEdiErrorCode(error.body);
    const mapped = ediCode ? OTP_ERRORS[ediCode] : undefined;
    if (mapped) {
      return createOtpError(mapped.code);
    }
    return createOtpError(mapStatusToOtpCode(error.status));
  }
  return createOtpError("UNEXPECTED_ERROR");
}
