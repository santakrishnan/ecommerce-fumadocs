import {
  type DealerInsightResponse,
  getDealerInsight,
  vdpErrorResponse,
} from "@features/vehicle-detail/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/dealer-insight/{dealerCode}
 *
 * Returns dealer information for the Dealer Insight Modal.
 * Includes dealer name, rating, review count, address, phone,
 * business hours, photo gallery, and map thumbnail.
 *
 * This endpoint is separate from the core VDP response and the
 * Purchase Card contract.
 *
 * Errors:
 * - 400: dealerCode missing or empty
 * - 502: upstream dealer service unavailable
 * - 503: service not configured
 * - 500: unexpected server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealerCode: string }> }
) {
  const traceId = request.headers.get("X-Trace-Id") ?? crypto.randomUUID();

  try {
    const { dealerCode } = await params;

    if (!dealerCode || dealerCode.trim().length === 0) {
      return vdpErrorResponse(
        {
          code: "VDP_INVALID_VIN",
          message: "Invalid dealer code. A non-empty dealerCode is required.",
          status: HTTP_STATUS_BAD_REQUEST,
        },
        traceId
      );
    }

    const result = await getDealerInsight({
      dealerCode: dealerCode.trim(),
      traceId,
    });

    if (!result.success) {
      return vdpErrorResponse(result.error, traceId);
    }

    return NextResponse.json<DealerInsightResponse>(result.data);
  } catch {
    return vdpErrorResponse(
      {
        code: "VDP_INTERNAL_ERROR",
        message: "An unexpected error occurred while processing the dealer insight request",
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      },
      traceId
    );
  }
}
