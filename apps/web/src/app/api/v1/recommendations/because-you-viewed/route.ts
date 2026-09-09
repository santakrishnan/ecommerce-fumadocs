import {
  type BecauseYouViewedResponse,
  becauseYouViewedRequestSchema,
  getBecauseYouViewed,
  recommendationsErrorResponse,
} from "@features/recommendations/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/recommendations/because-you-viewed
 *
 * Returns inventory recommendations based on a visitor's viewing history.
 * Requires `X-Visitor-Id` header to identify the visitor upstream.
 */
export async function POST(request: NextRequest) {
  try {
    const visitorId = request.headers.get("X-Visitor-Id") ?? undefined;

    if (!visitorId) {
      return recommendationsErrorResponse({
        code: "RECOMMENDATIONS_VALIDATION_FAILED",
        message: "X-Visitor-Id header is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = becauseYouViewedRequestSchema.safeParse(body);

    if (!parsed.success) {
      return recommendationsErrorResponse({
        code: "RECOMMENDATIONS_VALIDATION_FAILED",
        message: "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await getBecauseYouViewed(parsed.data, visitorId);

    if (!result.success) {
      return recommendationsErrorResponse(result.error);
    }

    return NextResponse.json<BecauseYouViewedResponse>(result.data);
  } catch {
    return recommendationsErrorResponse({
      code: "RECOMMENDATIONS_INTERNAL_ERROR",
      message: "Failed to fetch because-you-viewed recommendations",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
