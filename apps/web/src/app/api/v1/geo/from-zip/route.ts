import {
  type FromZipResponse,
  fromZipRequestSchema,
  type GeoErrorBody,
  geoErrorResponse,
  getGeoFromZip,
} from "@features/geo/bff";
import { HTTP_STATUS_BAD_REQUEST } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/geo/from-zip?zip=10001
 *
 * Resolves the visitor's location from a zip code.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<FromZipResponse | GeoErrorBody>> {
  const zip = request.nextUrl.searchParams.get("zip");

  const parsed = fromZipRequestSchema.safeParse({ zip });
  if (!parsed.success) {
    return geoErrorResponse({
      code: "GEO_VALIDATION_FAILED",
      message: "Invalid zip code",
      status: HTTP_STATUS_BAD_REQUEST,
    });
  }

  const result = await getGeoFromZip(parsed.data);

  if (!result.success) {
    return geoErrorResponse(result.error);
  }

  return NextResponse.json<FromZipResponse>(result.data);
}
