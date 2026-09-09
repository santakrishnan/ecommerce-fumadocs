import "server-only";

import {
  APPOINTMENT_VARIANT_COOKIE,
  type AppointmentVariant,
  appointmentVariantSchema,
  DEFAULT_APPOINTMENT_VARIANT,
} from "@config/appointment-variant";
import { cookies } from "next/headers";

/**
 * Reads the `demo-appointment-variant` cookie and returns a validated variant.
 * Falls back to the default if the cookie is absent or contains an invalid value.
 */
export async function getAppointmentVariant(): Promise<AppointmentVariant> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(APPOINTMENT_VARIANT_COOKIE)?.value;
  const parsed = appointmentVariantSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_APPOINTMENT_VARIANT;
}
