import { env } from "@config/env";
import {
  getVdpSearchFaq,
  getVehicleDetail,
  type VdpApiResponse,
  type VdpSearchFaqApiResponse,
  vdpErrorResponse,
  vdpVinSchema,
} from "@features/vehicle-detail/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/v1/vdp/{vin}
 *
 * When `?question=` is present: returns a VDP-scoped, sessionless FAQ answer
 * for the given VIN and question (VdpSearchFaqApiResponse).
 *
 * When `?question=` is absent: returns aggregated vehicle detail page data
 * for a single VIN (VdpApiResponse).
 *
 * Errors:
 * - 400: VIN format invalid (VDP_INVALID_VIN)
 * - 400: question missing, empty, or too long (VDP_INVALID_QUESTION) — FAQ path only
 * - 404: VIN not found (VDP_NOT_FOUND) — detail path only
 * - 502/503: upstream service unavailable or not configured (VDP_UPSTREAM_UNAVAILABLE)
 * - 504: upstream service timeout (VDP_UPSTREAM_TIMEOUT)
 * - 500: unexpected server error (VDP_INTERNAL_ERROR)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  const traceId = request.headers.get("X-Trace-Id") ?? crypto.randomUUID();

  try {
    const { vin } = await params;

    const vinUpper = vin.toUpperCase();
    const isMockMode = env.USE_VDP_MOCKS === "true";

    // In mock mode, accept any 17-char string — dev fixture VINs may use chars (I, O, Q)
    // excluded by ISO 3779 but present in inventory dev fixtures.
    const vinParsed = isMockMode
      ? z.string().length(17).safeParse(vinUpper)
      : vdpVinSchema.safeParse(vinUpper);

    if (!vinParsed.success) {
      return vdpErrorResponse(
        {
          code: "VDP_INVALID_VIN",
          message: "Invalid VIN format. Expected 17 alphanumeric characters (excluding I, O, Q).",
          status: HTTP_STATUS_BAD_REQUEST,
        },
        traceId
      );
    }

    const resolvedVin = vinParsed.data;

    // FAQ branch: ?question= param present
    const question = request.nextUrl.searchParams.get("question");

    if (question !== null) {
      const parsedQuestion = z.string().trim().min(1).max(500).safeParse(question);

      if (!parsedQuestion.success) {
        return vdpErrorResponse(
          {
            code: "VDP_INVALID_QUESTION",
            message: "Question is required and must be between 1 and 500 characters.",
            status: HTTP_STATUS_BAD_REQUEST,
          },
          traceId
        );
      }

      const faqResult = await getVdpSearchFaq({
        vin: resolvedVin,
        question: parsedQuestion.data,
        traceId,
      });

      if (!faqResult.success) {
        return vdpErrorResponse(faqResult.error, traceId);
      }

      return NextResponse.json<VdpSearchFaqApiResponse>(faqResult.data);
    }

    // Default: vehicle detail
    const visitorId = request.headers.get("X-Visitor-Id");

    const result = await getVehicleDetail({
      vin: resolvedVin,
      visitorId,
      traceId,
    });

    if (!result.success) {
      return vdpErrorResponse(result.error, traceId);
    }

    return NextResponse.json<VdpApiResponse>(result.data);
  } catch {
    return vdpErrorResponse(
      {
        code: "VDP_INTERNAL_ERROR",
        message: "An unexpected error occurred while processing the vehicle detail request",
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      },
      traceId
    );
  }
}
