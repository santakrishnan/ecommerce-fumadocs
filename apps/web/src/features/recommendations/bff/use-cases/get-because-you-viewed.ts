import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { BecauseYouViewedRequest } from "../contracts/because-you-viewed-request.schema";
import type { BecauseYouViewedResponse } from "../contracts/because-you-viewed-response.schema";
import {
  createRecommendationsError,
  type RecommendationsError,
} from "../errors/recommendations.errors";
import { mockBecauseYouViewed } from "../services/because-you-viewed-mock";
import { fetchBecauseYouViewedCached } from "../services/because-you-viewed-upstream";

export type GetBecauseYouViewedResult =
  | { success: true; data: BecauseYouViewedResponse }
  | { success: false; error: RecommendationsError };

/**
 * Use case: fetch "Because You Viewed" recommendations for a visitor.
 *
 * - When API_UPSTREAM_URL is set → calls the real upstream
 * - When USE_RECOMMENDATIONS_MOCKS is "true" → returns mock data
 * - Otherwise → fails fast with 503
 */
export async function getBecauseYouViewed(
  request: BecauseYouViewedRequest,
  visitorId: string
): Promise<GetBecauseYouViewedResult> {
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (env.USE_RECOMMENDATIONS_MOCKS === "true") {
    const data = await mockBecauseYouViewed(request);
    return { success: true, data };
  }

  if (upstreamUrl) {
    return fetchBecauseYouViewedCached(upstreamUrl, request, visitorId);
  }

  return {
    success: false,
    error: createRecommendationsError(
      "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE",
      "API_UPSTREAM_URL is not configured and USE_RECOMMENDATIONS_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
