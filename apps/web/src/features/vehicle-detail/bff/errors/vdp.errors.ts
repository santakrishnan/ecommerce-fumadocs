import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";

export type VdpErrorCode =
  | "VDP_INVALID_VIN"
  | "VDP_INVALID_QUESTION"
  | "VDP_NOT_FOUND"
  | "VDP_UPSTREAM_UNAVAILABLE"
  | "VDP_UPSTREAM_TIMEOUT"
  | "VDP_INTERNAL_ERROR";

export interface VdpError {
  code: VdpErrorCode;
  message: string;
  status: number;
}

export function createVdpError(code: VdpErrorCode, message: string, status: number): VdpError {
  return { code, message, status };
}

export function mapCaughtToVdpError(error: unknown): VdpError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createVdpError(
        "VDP_UPSTREAM_TIMEOUT",
        "Vehicle lookup service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createVdpError(
        "VDP_UPSTREAM_UNAVAILABLE",
        "Vehicle lookup service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === HTTP_STATUS_NOT_FOUND) {
      return createVdpError("VDP_NOT_FOUND", "Vehicle not found upstream", HTTP_STATUS_NOT_FOUND);
    }
    // Upstream POST /vehicles returns 200 even when VINs aren't found (they go
    // into the `notFound` array). A non-200 status from upstream indicates a
    // real service error (400 = bad request, 403 = forbidden, 5xx = server).
    return createVdpError(
      "VDP_UPSTREAM_UNAVAILABLE",
      "Vehicle lookup service returned an error",
      error.status >= 500 ? HTTP_STATUS_BAD_GATEWAY : error.status
    );
  }
  return createVdpError(
    "VDP_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
