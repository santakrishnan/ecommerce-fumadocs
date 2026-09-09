import "server-only";

import {
  DEFAULT_VDP_BOOKING_STATE,
  VDP_BOOKING_COOKIE,
  VDP_BOOKING_STATE_COOKIE,
  type VdpBookingState,
  vdpBookingStateSchema,
} from "@config/vdp-booking-state";
import { cookies } from "next/headers";
import { type TestDriveAppointment, testDriveAppointmentListSchema } from "../schemas";

interface VdpBookingStateResult {
  appointment?: TestDriveAppointment;
  state: VdpBookingState;
}

function readBookings(raw: string | undefined): TestDriveAppointment[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = testDriveAppointmentListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * Derive the display state (and the appointment to show) from the visitor's
 * real bookings for the viewed VIN/dealer.
 */
function deriveFromBookings(
  bookings: TestDriveAppointment[],
  vin: string,
  dealerCode: string
): VdpBookingStateResult {
  const forVin = bookings.find((appointment) =>
    appointment.vehicles.some((vehicle) => vehicle.vin.toUpperCase() === vin.toUpperCase())
  );
  if (forVin) {
    return { state: "this_vin", appointment: forVin };
  }

  const forDealer = bookings.find((appointment) => appointment.dealerCode === dealerCode);
  if (forDealer) {
    return { state: "same_dealer_other_vin", appointment: forDealer };
  }

  const [firstBooking] = bookings;
  if (firstBooking) {
    return { state: "different_dealer", appointment: firstBooking };
  }

  return { state: "no_appointment" };
}

/**
 * Resolves the VDP booking state server-side (no hydration flash).
 *
 * Precedence:
 * 1. Demo override — when the `demo-vdp-booking-state` selector is set to a
 *    specific state (not "default"), force it on any VDP for preview. The rail
 *    builds a synthetic appointment for display.
 * 2. Default — derive the state and the appointment from the visitor's real
 *    persisted bookings (`demo-vdp-booking`).
 *
 * TODO: replace cookie resolution with GET /appointments when the Arrow endpoint is available.
 */
async function getVdpBookingState(vin: string, dealerCode: string): Promise<VdpBookingStateResult> {
  const cookieStore = await cookies();

  const parsedOverride = vdpBookingStateSchema.safeParse(
    cookieStore.get(VDP_BOOKING_STATE_COOKIE)?.value
  );
  const override = parsedOverride.success ? parsedOverride.data : DEFAULT_VDP_BOOKING_STATE;

  if (override !== "default") {
    return { state: override };
  }

  return deriveFromBookings(
    readBookings(cookieStore.get(VDP_BOOKING_COOKIE)?.value),
    vin,
    dealerCode
  );
}

export type { VdpBookingStateResult };
export { getVdpBookingState };
