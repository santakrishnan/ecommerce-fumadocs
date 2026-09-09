import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { ProfileAppointment } from "../contracts/profile-appointment-response.schema";
import { createProfileError, type ProfileError } from "../errors/profile.errors";
import { mockProfileAppointment } from "../services/profile-appointment-mock";
import { fetchProfileAppointment } from "../services/profile-appointment-upstream";
import { getAppointmentVariant } from "./get-appointment-variant";
import { getProfileTier } from "./get-profile-tier";

export type GetProfileAppointmentResult =
  | { success: true; data: ProfileAppointment[] }
  | { success: false; error: ProfileError };

/**
 * Use case: fetch profile appointments for the current visitor.
 *
 * - When USE_PROFILE_APPOINTMENT_MOCKS is "true" → returns fixture data
 *   scoped to the visitor's profile tier and selected appointment variant:
 *     t0/t1 → [] (section hidden)
 *     t2/t3 → variant-specific fixture
 * - When API_UPSTREAM_URL is set → calls the real upstream (stubbed for now)
 * - Otherwise → fails fast with 503
 */
export async function getProfileAppointment(): Promise<GetProfileAppointmentResult> {
  if (env.USE_PROFILE_APPOINTMENT_MOCKS === "true") {
    const [tier, variant] = await Promise.all([getProfileTier(), getAppointmentVariant()]);
    const data = await mockProfileAppointment(tier, variant);
    return { success: true, data };
  }

  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (upstreamUrl) {
    return fetchProfileAppointment(upstreamUrl, undefined);
  }

  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "API_UPSTREAM_URL is not configured and USE_PROFILE_APPOINTMENT_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
