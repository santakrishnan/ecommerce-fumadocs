import "server-only";

import type { AppointmentVariant } from "@config/appointment-variant";
import type { ProfileTier } from "@config/profile-tier";
import {
  type TestDriveAppointment,
  testDriveAppointmentListSchema,
  VDP_BOOKING_COOKIE,
} from "@config/vdp-booking-state";
import { cookies } from "next/headers";
import {
  OFFER_SINGLE_VEHICLE_FIXTURE,
  TEST_DRIVE_SINGLE_VEHICLE_FIXTURE,
  TEST_DRIVE_TWO_VEHICLES_FIXTURE,
  VEHICLE_SOLD_FIXTURE,
} from "../__fixtures__/profile-appointment.fixture";
import type { ProfileAppointment } from "../contracts/profile-appointment-response.schema";

const MOCK_DELAY_MS = 50;

/** Offer fixture without scheduledAt — for the "no appointment" variant */
const OFFER_NO_APPT_FIXTURE: ProfileAppointment = {
  ...OFFER_SINGLE_VEHICLE_FIXTURE,
  id: "appt-offer-no-appt",
  label: "Your pre-qualified offer",
  scheduledAt: undefined,
};

/** 3+ vehicles test drive fixture */
const TEST_DRIVE_3PLUS_FIXTURE: ProfileAppointment = {
  ...TEST_DRIVE_TWO_VEHICLES_FIXTURE,
  id: "appt-td-3plus",
  vehicles: [
    ...TEST_DRIVE_TWO_VEHICLES_FIXTURE.vehicles,
    {
      title: "TOYOTA CAMRY HYBRID XSE",
      year: 2024,
      mileage: 5200,
      vin: "4T1DAACK2SU601290",
      make: "Toyota",
      model: "Camry",
      trim: "Hybrid XSE",
    },
    {
      title: "TOYOTA COROLLA CROSS HYBRID",
      year: 2024,
      mileage: 3100,
      vin: "4T1DAACK9SU571964",
      make: "Toyota",
      model: "Corolla Cross",
      trim: "Hybrid",
    },
    {
      title: "TOYOTA VENZA LIMITED",
      year: 2023,
      mileage: 18_400,
      vin: "4T1G11AK5NU445566",
      make: "Toyota",
      model: "Venza",
      trim: "Limited",
    },
  ],
};

function appointmentsForVariant(variant: AppointmentVariant): ProfileAppointment[] {
  switch (variant) {
    case "test_drive_1":
      return [TEST_DRIVE_SINGLE_VEHICLE_FIXTURE];
    case "test_drive_2":
      return [TEST_DRIVE_TWO_VEHICLES_FIXTURE];
    case "test_drive_3plus":
      return [TEST_DRIVE_3PLUS_FIXTURE];
    case "offer_with_appt":
      return [OFFER_SINGLE_VEHICLE_FIXTURE];
    case "offer_no_appt":
      return [OFFER_NO_APPT_FIXTURE];
    case "vehicle_sold":
      return [VEHICLE_SOLD_FIXTURE];
    case "three_appts_modal":
      return [
        TEST_DRIVE_SINGLE_VEHICLE_FIXTURE,
        TEST_DRIVE_TWO_VEHICLES_FIXTURE,
        OFFER_SINGLE_VEHICLE_FIXTURE,
      ];
    default:
      return [TEST_DRIVE_SINGLE_VEHICLE_FIXTURE];
  }
}

/**
 * Maps the VDP-booked appointments (persisted in the shared `demo-vdp-booking`
 * cookie) into the Profile appointment shape so the Profile reflects them.
 */
const TIME_SLOT_RE = /(\d{1,2}):(\d{2})\s*(am|pm)/i;

function toScheduledIso(date: string, timeSlot: string): string {
  const match = TIME_SLOT_RE.exec(timeSlot);
  const rawHour = match?.[1];
  const minutes = match?.[2];
  const meridiem = match?.[3];
  if (!(rawHour && minutes && meridiem)) {
    return `${date}T12:00:00.000Z`;
  }
  let hour = Number(rawHour) % 12;
  if (meridiem.toLowerCase() === "pm") {
    hour += 12;
  }
  return `${date}T${String(hour).padStart(2, "0")}:${minutes}:00.000Z`;
}

function toProfileAppointment(booking: TestDriveAppointment): ProfileAppointment {
  return {
    id: booking.id,
    type: "test_drive",
    label: `Your test drive at ${booking.dealerName}`,
    dealershipName: booking.dealerName,
    dealershipAddress: booking.dealerAddress,
    scheduledAt: toScheduledIso(booking.date, booking.timeSlot),
    vehicles: booking.vehicles.map((vehicle) => ({
      title: vehicle.title,
      year: vehicle.year,
      mileage: 0,
      imageUrl: vehicle.imageUrl,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
    })),
  };
}

async function readBookedAppointments(): Promise<ProfileAppointment[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(VDP_BOOKING_COOKIE)?.value;
  if (!raw) {
    return [];
  }
  try {
    const result = testDriveAppointmentListSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data.map(toProfileAppointment) : [];
  } catch {
    return [];
  }
}

/**
 * Returns mock appointment data based on the visitor's profile tier and
 * the selected appointment variant (from /demo-settings).
 *
 * When a VDP booking cookie is present, the booked appointment is prepended so
 * it surfaces on the Profile after navigating from the VDP:
 * - t0: hidden (cannot reach Profile)
 * - t1: shows only the booked appointment when present
 * - t2/t3: booked appointment prepended to the selected variant
 */
export async function mockProfileAppointment(
  tier: ProfileTier,
  variant: AppointmentVariant
): Promise<ProfileAppointment[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const bookedAppointments = await readBookedAppointments();

  if (tier === "t0") {
    return [];
  }

  if (tier === "t1") {
    return bookedAppointments;
  }

  return [...bookedAppointments, ...appointmentsForVariant(variant)];
}
