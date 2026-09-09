import { NextResponse } from "next/server";
import type { GeoError, GeoErrorCode } from "./geo.errors";

export interface GeoErrorBody {
  error: { code: GeoErrorCode; message: string };
}

/**
 * Convert a GeoError into a typed NextResponse.
 * Use in route handlers to avoid repeating error serialization logic.
 */
export function geoErrorResponse(error: GeoError): NextResponse<GeoErrorBody> {
  return NextResponse.json<GeoErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
