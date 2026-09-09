import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { ProfileSuggestionsRequest } from "../contracts/profile-suggestions-request.schema";
import type { ProfileSuggestionsResponse } from "../contracts/profile-suggestions-response.schema";
import { createProfileError, type ProfileError } from "../errors/profile.errors";
import { mockProfileSuggestions } from "../services/profile-suggestions-mock";
import { fetchProfileSuggestionsCached } from "../services/profile-suggestions-upstream";

export type GetProfileSuggestionsResult =
  | { success: true; data: ProfileSuggestionsResponse }
  | { success: false; error: ProfileError };

/**
 * Use case: fetch profile-based suggestions for a visitor.
 * visitorId is forwarded to the upstream as the X-Visitor-Id header.
 *
 * - When USE_PROFILE_SUGGESTIONS_MOCKS is "true" → returns mock data (takes priority)
 * - When API_UPSTREAM_URL is set → calls the real upstream /profile/suggestions
 * - Otherwise → fails fast with 503
 */
export async function getProfileSuggestions(
  request: ProfileSuggestionsRequest,
  visitorId: string | undefined
): Promise<GetProfileSuggestionsResult> {
  if (env.USE_PROFILE_SUGGESTIONS_MOCKS === "true") {
    const data = await mockProfileSuggestions();
    return { success: true, data };
  }

  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (upstreamUrl) {
    return fetchProfileSuggestionsCached(upstreamUrl, request, visitorId);
  }

  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "API_UPSTREAM_URL is not configured and USE_PROFILE_SUGGESTIONS_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
