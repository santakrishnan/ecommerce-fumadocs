import "server-only";

import type { ProfileAppointment } from "../contracts/profile-appointment-response.schema";
import type { ProfileError } from "../errors/profile.errors";

type FetchProfileAppointmentResult =
  | { success: true; data: ProfileAppointment[] }
  | { success: false; error: ProfileError };

/**
 * Stub for the real upstream appointment service.
 *
 * This will be implemented once the upstream contract is finalized.
 * For now it always returns an empty array (no appointments).
 */
export async function fetchProfileAppointment(
  _baseUrl: string,
  _visitorId: string | undefined
): Promise<FetchProfileAppointmentResult> {
  // TODO: implement real upstream call when service is available
  return { success: true, data: [] };
}
