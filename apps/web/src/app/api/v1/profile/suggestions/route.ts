import {
  getProfileSuggestions,
  type ProfileSuggestionsResponse,
  profileErrorResponse,
  profileSuggestionsRequestSchema,
} from "@features/profile/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/profile/suggestions
 *
 * Returns personalised suggestion content for the profile page.
 * Optional visitor identification via the `X-Visitor-Id` request header.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = profileSuggestionsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return profileErrorResponse({
        code: "PROFILE_VALIDATION_FAILED",
        message: "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const visitorId = request.headers.get("X-Visitor-Id") ?? undefined;
    const result = await getProfileSuggestions(parsed.data, visitorId);

    if (!result.success) {
      return profileErrorResponse(result.error);
    }

    return NextResponse.json<ProfileSuggestionsResponse>(result.data);
  } catch {
    return profileErrorResponse({
      code: "PROFILE_INTERNAL_ERROR",
      message: "Failed to fetch profile suggestions",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
