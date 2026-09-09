import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { cacheLife, cacheTag } from "next/cache";
import type { ProfileSuggestionsRequest } from "../contracts/profile-suggestions-request.schema";
import type { ProfileSuggestionsResponse } from "../contracts/profile-suggestions-response.schema";
import {
  profileSuggestionsResponseSchema,
  profileSuggestionsUpstreamResponseSchema,
} from "../contracts/profile-suggestions-response.schema";
import {
  createProfileError,
  mapCaughtToProfileError,
  type ProfileError,
} from "../errors/profile.errors";
import { mapProfileSuggestionsUpstreamToResponse } from "../mappers/profile-suggestions.mapper";
import { createProfileClient } from "./profile-client";

type FetchProfileSuggestionsResult =
  | { success: true; data: ProfileSuggestionsResponse }
  | { success: false; error: ProfileError };

async function fetchProfileSuggestions(
  baseUrl: string,
  _request: ProfileSuggestionsRequest,
  visitorId: string | undefined
): Promise<FetchProfileSuggestionsResult> {
  const client = createProfileClient(baseUrl);

  try {
    const raw = await client.post("/profile/suggestions", undefined, {
      headers: { ...(visitorId && { "X-Visitor-Id": visitorId }) },
    });

    const parsed = profileSuggestionsUpstreamResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: createProfileError(
          "PROFILE_UPSTREAM_ERROR",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapProfileSuggestionsUpstreamToResponse(parsed.data);
    const validated = profileSuggestionsResponseSchema.safeParse(mapped);

    if (!validated.success) {
      return {
        success: false,
        error: createProfileError(
          "PROFILE_UPSTREAM_ERROR",
          "Mapped response violates the BFF response contract",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    return { success: false, error: mapCaughtToProfileError(error) };
  }
}

export async function fetchProfileSuggestionsCached(
  baseUrl: string,
  request: ProfileSuggestionsRequest,
  visitorId: string | undefined
): Promise<FetchProfileSuggestionsResult> {
  "use cache";
  cacheLife("profile");
  cacheTag("profile-suggestions", `profile-suggestions:${visitorId ?? "anonymous"}`);

  return fetchProfileSuggestions(baseUrl, request, visitorId);
}
