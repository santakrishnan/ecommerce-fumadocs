"use server";

import {
  APPOINTMENT_VARIANT_COOKIE,
  appointmentVariantCookie,
  appointmentVariantSchema,
} from "@config/appointment-variant";
import { cookies } from "next/headers";

export interface SetAppointmentVariantResult {
  success: boolean;
}

/**
 * Persist the selected appointment variant in the `demo-appointment-variant` cookie.
 */
export async function setAppointmentVariant(value: string): Promise<SetAppointmentVariantResult> {
  const parsed = appointmentVariantSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(APPOINTMENT_VARIANT_COOKIE, parsed.data, {
    httpOnly: appointmentVariantCookie.httpOnly,
    secure: appointmentVariantCookie.secure,
    sameSite: appointmentVariantCookie.sameSite,
    path: appointmentVariantCookie.path,
    maxAge: appointmentVariantCookie.maxAge,
  });

  return { success: true };
}

/**
 * Clear the cookie so the variant falls back to the default (test_drive_1).
 */
export async function resetAppointmentVariant(): Promise<SetAppointmentVariantResult> {
  const cookieStore = await cookies();
  cookieStore.delete(APPOINTMENT_VARIANT_COOKIE);
  return { success: true };
}
