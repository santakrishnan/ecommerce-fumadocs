"use server";

import {
  VDP_BOOKING_COOKIE,
  VDP_BOOKING_STATE_COOKIE,
  vdpBookingStateSchema,
} from "@config/vdp-booking-state";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface SetVdpBookingStateResult {
  success: boolean;
}

async function setVdpBookingState(value: string): Promise<SetVdpBookingStateResult> {
  const parsed = vdpBookingStateSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(VDP_BOOKING_STATE_COOKIE, parsed.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { success: true };
}

/**
 * Clears only the test-drive booking cookies: the persisted appointment
 * (`demo-vdp-booking`) and the state selector (`demo-vdp-booking-state`).
 * Acts as a mock "cancel appointment" — leaves tier and other demo cookies intact.
 */
async function resetVdpBookingState(): Promise<SetVdpBookingStateResult> {
  const cookieStore = await cookies();
  cookieStore.delete(VDP_BOOKING_STATE_COOKIE);
  cookieStore.delete(VDP_BOOKING_COOKIE);
  return { success: true };
}

export type { SetVdpBookingStateResult };
export { resetVdpBookingState, setVdpBookingState };
