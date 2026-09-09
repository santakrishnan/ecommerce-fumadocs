import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

/**
 * Domain-specific error codes for the geo BFF layer.
 */
export type GeoErrorCode =
  | "GEO_UPSTREAM_UNAVAILABLE"
  | "GEO_UPSTREAM_ERROR"
  | "GEO_VALIDATION_FAILED"
  | "GEO_INTERNAL_ERROR";

export interface GeoError {
  code: GeoErrorCode;
  message: string;
  status: number;
}

export function createGeoError(code: GeoErrorCode, message: string, status: number): GeoError {
  return { code, message, status };
}

/**
 * Map a caught error (typically from ServerHttpError) to a structured GeoError.
 * Use in the catch block of any geo upstream service.
 */
export function mapCaughtToGeoError(error: unknown): GeoError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createGeoError(
        "GEO_UPSTREAM_UNAVAILABLE",
        "Geo service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createGeoError(
        "GEO_UPSTREAM_UNAVAILABLE",
        "Geo service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createGeoError("GEO_UPSTREAM_ERROR", "Geo service returned an error", error.status);
  }
  return createGeoError(
    "GEO_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
