import "server-only";

import {
  type ProfileActivityRouteResponse,
  profileActivityRequestSchema,
  profileActivityRouteResponseSchema,
} from "../contracts/profile-activity.schema";
import { captureProfileActivity } from "./profile-activity-capture";

/**
 * Feature-scoped profile activity resolver.
 * Handles validation as a boundary guard and returns a typed union response.
 *
 * Follows ADR-7 BFF composition: validation errors are part of the success path,
 * allowing the route handler to remain thin orchestration.
 */
export async function getProfileActivityResponse(
  body: unknown
): Promise<ProfileActivityRouteResponse> {
  const parsed = profileActivityRequestSchema.safeParse(body);

  if (!parsed.success) {
    console.error("[getProfileActivityResponse] Invalid request payload", parsed.error.issues);
    return {
      error: {
        code: "PROFILE_ACTIVITY_VALIDATION_FAILED",
        message: "Activity payload did not match contract.",
        details: {
          endpoint: "/api/v1/profile/activities",
        },
      },
    };
  }

  const result = await captureProfileActivity(parsed.data);

  if (!result.success) {
    return {
      error: {
        code: "PROFILE_ACTIVITY_CAPTURE_FAILED",
        message: result.error,
        details: {
          endpoint: "/api/v1/profile/activities",
        },
      },
    };
  }

  // Validate response shape to catch internal drift
  const responseValidation = profileActivityRouteResponseSchema.safeParse(result.data);
  if (!responseValidation.success) {
    console.error(
      "[getProfileActivityResponse] Invalid response payload",
      responseValidation.error.issues
    );
    return {
      error: {
        code: "PROFILE_ACTIVITY_CAPTURE_FAILED",
        message: "Failed to validate activity response.",
        details: {
          endpoint: "/api/v1/profile/activities",
        },
      },
    };
  }

  return result.data;
}
