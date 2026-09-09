import "server-only";

import { env } from "@config/env";
import {
  type ProfileActivityRequest,
  type ProfileActivityResponse,
  profileActivityResponseSchema,
} from "../contracts/profile-activity.schema";

export type ProfileActivityCaptureResult =
  | { success: true; data: ProfileActivityResponse }
  | { success: false; error: string };

const MILLISECOND_SUFFIX_REGEX = /\.\d{3}Z$/;

function buildActivityId(): string {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `act_${suffix}`;
}

function currentIsoSecond(): string {
  return new Date().toISOString().replace(MILLISECOND_SUFFIX_REGEX, "Z");
}

export async function captureProfileActivity(
  request: ProfileActivityRequest
): Promise<ProfileActivityCaptureResult> {
  try {
    const shouldQueue = env.PROFILE_ACTIVITY_MODE === "queued";

    const data = shouldQueue
      ? profileActivityResponseSchema.parse({
          activityId: null,
          activityType: request.activityType,
          status: "queued",
          warnings: ["profile-unavailable"],
        })
      : profileActivityResponseSchema.parse({
          activityId: buildActivityId(),
          activityType: request.activityType,
          recordedAt: currentIsoSecond(),
          status: "recorded",
        });

    return { success: true, data };
  } catch (error) {
    console.error("[captureProfileActivity] Failed to capture profile activity", error);
    return {
      success: false,
      error: "Failed to capture activity",
    };
  }
}
