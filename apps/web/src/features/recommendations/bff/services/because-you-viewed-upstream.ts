import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { cacheLife, cacheTag } from "next/cache";
import type { BecauseYouViewedRequest } from "../contracts/because-you-viewed-request.schema";
import type { BecauseYouViewedResponse } from "../contracts/because-you-viewed-response.schema";
import {
  becauseYouViewedResponseSchema,
  becauseYouViewedUpstreamResponseSchema,
} from "../contracts/because-you-viewed-response.schema";
import {
  createRecommendationsError,
  mapCaughtToRecommendationsError,
  type RecommendationsError,
} from "../errors/recommendations.errors";
import { mapBecauseYouViewedUpstreamToResponse } from "../mappers/because-you-viewed.mapper";
import { createRecommendationsClient } from "./recommendations-client";

type FetchBecauseYouViewedResult =
  | { success: true; data: BecauseYouViewedResponse }
  | { success: false; error: RecommendationsError };

async function fetchBecauseYouViewed(
  baseUrl: string,
  request: BecauseYouViewedRequest,
  visitorId: string
): Promise<FetchBecauseYouViewedResult> {
  const client = createRecommendationsClient(baseUrl);

  try {
    const raw = await client.post("/recommendations/because-you-viewed", request, {
      headers: { "X-Visitor-Id": visitorId },
    });

    const parsed = becauseYouViewedUpstreamResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: createRecommendationsError(
          "RECOMMENDATIONS_UPSTREAM_ERROR",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapBecauseYouViewedUpstreamToResponse(parsed.data);
    const validated = becauseYouViewedResponseSchema.safeParse(mapped);

    if (!validated.success) {
      return {
        success: false,
        error: createRecommendationsError(
          "RECOMMENDATIONS_UPSTREAM_ERROR",
          "Mapped response violates the BFF response contract",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    return { success: false, error: mapCaughtToRecommendationsError(error) };
  }
}

export async function fetchBecauseYouViewedCached(
  baseUrl: string,
  request: BecauseYouViewedRequest,
  visitorId: string
): Promise<FetchBecauseYouViewedResult> {
  "use cache";
  cacheLife("profile");
  cacheTag("recommendations-because-you-viewed", `recommendations-because-you-viewed:${visitorId}`);

  return fetchBecauseYouViewed(baseUrl, request, visitorId);
}
