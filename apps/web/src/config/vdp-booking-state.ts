import { z } from "zod";

const VDP_BOOKING_STATE_COOKIE = "demo-vdp-booking-state";

/** Holds the JSON-serialized list of booked appointments — the mock stand-in for the appointments table. */
const VDP_BOOKING_COOKIE = "demo-vdp-booking";

const vdpBookingStateSchema = z.enum([
  "default",
  "no_appointment",
  "this_vin",
  "same_dealer_other_vin",
  "different_dealer",
]);

type VdpBookingState = z.infer<typeof vdpBookingStateSchema>;

/**
 * Canonical shape of the `demo-vdp-booking` cookie payload. Lives here (a
 * side-effect-free shared module) so both the test-drive-booking feature and
 * the profile mock validate the same contract without duplicating it.
 */
const testDriveVehicleSchema = z.object({
  vin: z.string(),
  year: z.number().int(),
  make: z.string(),
  model: z.string(),
  trim: z.string().optional(),
  title: z.string(),
  imageUrl: z.string().optional(),
});

const testDriveAppointmentSchema = z.object({
  id: z.string(),
  dealerCode: z.string(),
  dealerName: z.string(),
  dealerAddress: z.string(),
  date: z.string(),
  dayLabel: z.string(),
  timeSlot: z.string(),
  vehicles: z.array(testDriveVehicleSchema).min(1),
});

const testDriveAppointmentListSchema = z.array(testDriveAppointmentSchema);

type TestDriveVehicle = z.infer<typeof testDriveVehicleSchema>;
type TestDriveAppointment = z.infer<typeof testDriveAppointmentSchema>;

const DEFAULT_VDP_BOOKING_STATE: VdpBookingState = "default";

interface VdpBookingStateOption {
  description: string;
  title: string;
  value: VdpBookingState;
}

const VDP_BOOKING_STATE_OPTIONS: readonly VdpBookingStateOption[] = [
  {
    value: "default",
    title: "Default (use real bookings)",
    description:
      "The VDP reflects the visitor's actual bookings. Scheduling stores the appointment and each VDP behaves accordingly.",
  },
  {
    value: "no_appointment",
    title: "No appointment (forced)",
    description: "Force the empty slot carousel on any VDP, ignoring real bookings.",
  },
  {
    value: "this_vin",
    title: "Appointment for this VIN (forced)",
    description: "Force the confirmed state — appointment details + Manage — on any VDP.",
  },
  {
    value: "same_dealer_other_vin",
    title: "Same dealer, different vehicle(s) (forced)",
    description: "Force the existing-visit + 'Add this car' state on any VDP.",
  },
  {
    value: "different_dealer",
    title: "Different dealer (forced)",
    description: "Force the different-dealer state (same-day reminder on today) on any VDP.",
  },
] as const;

export type { TestDriveAppointment, TestDriveVehicle, VdpBookingState };
export {
  DEFAULT_VDP_BOOKING_STATE,
  testDriveAppointmentListSchema,
  testDriveAppointmentSchema,
  testDriveVehicleSchema,
  VDP_BOOKING_COOKIE,
  VDP_BOOKING_STATE_COOKIE,
  VDP_BOOKING_STATE_OPTIONS,
  vdpBookingStateSchema,
};
