import { NextResponse } from "next/server";
import type { z } from "zod";
import type {
  profileActivityCaptureErrorSchema,
  profileActivityValidationErrorSchema,
} from "../contracts/profile-activity.schema";

export type ProfileActivityValidationError = z.infer<typeof profileActivityValidationErrorSchema>;
export type ProfileActivityCaptureError = z.infer<typeof profileActivityCaptureErrorSchema>;

export type ProfileActivityError =
  | ProfileActivityValidationError["error"]
  | ProfileActivityCaptureError["error"];

export interface ProfileActivityErrorBody {
  error: ProfileActivityError;
}

function getStatus(error: ProfileActivityError): number {
  return error.code === "PROFILE_ACTIVITY_VALIDATION_FAILED" ? 400 : 500;
}

/**
 * Convert a profile activity error into a typed NextResponse.
 * Use in route handlers to avoid repeating error serialization logic.
 */
export function profileActivityErrorResponse(
  error: ProfileActivityError
): NextResponse<ProfileActivityErrorBody> {
  return NextResponse.json<ProfileActivityErrorBody>({ error }, { status: getStatus(error) });
}
