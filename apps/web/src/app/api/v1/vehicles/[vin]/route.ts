import type { VehicleRouteResponse } from "@features/landing/bff/contracts/vehicle-deal.schema";
import {
  getVehicleDetail,
  transformVdpToWelcomeBackShape,
  vdpVinSchema,
} from "@features/vehicle-detail/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/vehicles/[vin]
 *
 * BFF route for vehicle detail lookup. Calls the upstream Search API's
 * `POST /vehicles` endpoint with the path VIN and returns the vehicle detail.
 *
 * Used by the DealerDealCard on the welcome-back page to fetch vehicle data
 * (year, make, model, trim, mileage, pricing, media) for a specific VIN.
 *
 * Headers forwarded to upstream:
 * - `X-Visitor-Id` — canonical visitor identifier (required by Search API)
 * - `X-Trace-Id` — optional trace identifier for upstream correlation
 *
 * Delegates to the canonical Vehicle Detail BFF use-case (ADR-9).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  const traceId = request.headers.get("X-Trace-Id") ?? crypto.randomUUID();

  try {
    const { vin: rawVin } = await params;

    // Validate VIN format using canonical VDP schema
    const parsed = vdpVinSchema.safeParse(rawVin.toUpperCase());

    if (!parsed.success) {
      return NextResponse.json<VehicleRouteResponse>(
        {
          error: {
            code: "INVALID_VIN",
            message: "VIN must be exactly 17 alphanumeric characters (excluding I, O, Q).",
          },
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    const vin = parsed.data;

    const visitorId = request.headers.get("X-Visitor-Id");

    // Delegate to canonical Vehicle Detail BFF use-case (ADR-9)
    const result = await getVehicleDetail({
      vin,
      visitorId: visitorId ?? null,
      traceId,
    });

    if (!result.success) {
      const status =
        result.error.code === "VDP_NOT_FOUND"
          ? 404
          : (result.error.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR);
      return NextResponse.json<VehicleRouteResponse>(
        {
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        { status }
      );
    }

    // Transform full VDP response to Landing/Welcome Back response shape.
    // The adapter returns an error object when vehicle data is unavailable
    // (e.g. data.vehicle is null), which must be translated to an HTTP error
    // rather than silently returned with a 200 status.
    const welcomeBackResponse = transformVdpToWelcomeBackShape(result.data);

    if ("error" in welcomeBackResponse) {
      const status =
        welcomeBackResponse.error?.code === "VEHICLE_NOT_FOUND"
          ? HTTP_STATUS_NOT_FOUND
          : HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return NextResponse.json<VehicleRouteResponse>(welcomeBackResponse, { status });
    }

    return NextResponse.json<VehicleRouteResponse>(welcomeBackResponse);
  } catch {
    return NextResponse.json<VehicleRouteResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch vehicle detail",
        },
      },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}
