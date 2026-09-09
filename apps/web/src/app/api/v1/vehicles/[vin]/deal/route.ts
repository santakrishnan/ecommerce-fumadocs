import type { DealRouteResponse } from "@features/landing/bff/contracts/vehicle-deal.schema";
import { getVehicleDeal } from "@features/landing/bff/services/get-vehicle-deal";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VIN_PATTERN } from "utils/validators";

/**
 * GET /api/v1/vehicles/[vin]/deal
 *
 * BFF route for loan origination / deal data. Calls the upstream loan
 * origination service to retrieve financing details for the given VIN.
 *
 * Used by the DealerDealCard on the welcome-back page to fetch financing
 * data (monthly payment, term, APR, credit score, urgency message).
 *
 * Headers forwarded to upstream:
 * - `X-Visitor-Id` — canonical visitor identifier (required by Loan Origination API)
 * - `X-Session-Id` — current session identifier (optional)
 *
 * Currently fixture-backed — will forward to the loan origination service
 * once `LOAN_ORIGINATION_API_URL` is configured.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  try {
    const { vin: rawVin } = await params;
    const vin = rawVin.toUpperCase();

    if (!VIN_PATTERN.test(vin)) {
      return NextResponse.json<DealRouteResponse>(
        {
          error: {
            code: "INVALID_VIN",
            message: "VIN must be exactly 17 alphanumeric characters (excluding I, O, Q).",
          },
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    const visitorId = request.headers.get("X-Visitor-Id") ?? undefined;
    const sessionId = request.headers.get("X-Session-Id") ?? undefined;

    const result = await getVehicleDeal(vin, { visitorId, sessionId });

    if ("error" in result) {
      const status = result.error.code === "DEAL_NOT_FOUND" ? 404 : 500;
      return NextResponse.json<DealRouteResponse>(result, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json<DealRouteResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch vehicle deal data",
        },
      },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}
