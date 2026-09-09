import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import { z } from "zod";

/**
 * Appointment card variant demo override — cookie contract + option metadata.
 *
 * Side-effect-free module: safe to import from both server and client.
 * The mock service reads the cookie to determine which fixture to return first.
 */

/** One year, in seconds. */
const APPOINTMENT_VARIANT_COOKIE_TTL = 60 * 60 * 24 * 365;

/** `buildCookieConfig` (client-safe) applies the prod `__Host-` prefix. */
export const appointmentVariantCookie = buildCookieConfig(
  "demo-appointment-variant",
  APPOINTMENT_VARIANT_COOKIE_TTL,
  { httpOnly: true, sameSite: "lax" }
);

export const APPOINTMENT_VARIANT_COOKIE = appointmentVariantCookie.name;

export const appointmentVariantSchema = z.enum([
  "test_drive_1",
  "test_drive_2",
  "test_drive_3plus",
  "offer_with_appt",
  "offer_no_appt",
  "vehicle_sold",
  "three_appts_modal",
]);

export type AppointmentVariant = z.infer<typeof appointmentVariantSchema>;

export const DEFAULT_APPOINTMENT_VARIANT: AppointmentVariant = "test_drive_1";

interface AppointmentVariantOption {
  description: string;
  title: string;
  value: AppointmentVariant;
}

export const APPOINTMENT_VARIANT_OPTIONS: readonly AppointmentVariantOption[] = [
  {
    value: "test_drive_1",
    title: "Test Drive — 1 vehicle",
    description: "Single vehicle with photo thumbnail, scheduled date/location.",
  },
  {
    value: "test_drive_2",
    title: "Test Drive — 2 vehicles",
    description: "Two vehicles stacked with photo thumbnails.",
  },
  {
    value: "test_drive_3plus",
    title: "Test Drive — 3+ vehicles",
    description: "Generic car icon with title-case vehicle names and '+ N more'.",
  },
  {
    value: "offer_with_appt",
    title: "Offer with appointment",
    description: "Pre-qualified offer with scheduled appointment details.",
  },
  {
    value: "offer_no_appt",
    title: "Offer — no appointment",
    description: "Pre-qualified offer with dealership + 'Book appointment' button.",
  },
  {
    value: "vehicle_sold",
    title: "Vehicle Sold",
    description: "Cancelled appointment — vehicle has been sold.",
  },
  {
    value: "three_appts_modal",
    title: "Three Appointments for Modal",
    description: "Modal showing three different appointment types.",
  },
] as const;
