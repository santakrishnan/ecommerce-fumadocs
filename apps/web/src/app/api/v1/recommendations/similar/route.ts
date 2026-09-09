import {
  type BecauseYouViewedResponse,
  getBecauseYouViewed,
  recommendationsErrorResponse,
} from "@features/recommendations/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

const vinQuerySchema = z.object({
  vin: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(VIN_PATTERN, "VIN must be exactly 17 alphanumeric characters.")),
});

/**
 * GET /api/v1/recommendations/similar?vin=<VIN>
 *
 * Returns similar vehicle recommendations based on the provided VIN.
 * The backend derives taxonomy filters (make, model, body style, etc.)
 * from the VIN and returns matching available vehicles.
 *
 * Currently not referenced by the welcome-back Search Recommendations UI.
 * Exposes similar-vehicle recommendations for callers that can provide a VIN.
 */
export async function GET(request: NextRequest) {
  try {
    const visitorId = request.headers.get("X-Visitor-Id") ?? "anonymous";

    const { searchParams } = request.nextUrl;
    const parsed = vinQuerySchema.safeParse({ vin: searchParams.get("vin") ?? "" });

    if (!parsed.success) {
      return recommendationsErrorResponse({
        code: "RECOMMENDATIONS_VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid VIN",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await getBecauseYouViewed({ vin: parsed.data.vin }, visitorId);

    if (!result.success) {
      return recommendationsErrorResponse(result.error);
    }

    return NextResponse.json<BecauseYouViewedResponse>(result.data);
  } catch {
    return recommendationsErrorResponse({
      code: "RECOMMENDATIONS_INTERNAL_ERROR",
      message: "Failed to fetch similar vehicle recommendations",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
