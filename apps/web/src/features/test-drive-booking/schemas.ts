import { testDriveAppointmentSchema as appointmentSchema } from "@config/vdp-booking-state";
import { isValidContact } from "@shared/lib/contact";
import { z } from "zod";

const bookingContactSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  contact: z
    .string()
    .trim()
    .refine((value) => isValidContact(value), { message: "Enter a valid phone number or email" }),
});

const bookTestDriveInputSchema = appointmentSchema;

type BookingContact = z.infer<typeof bookingContactSchema>;

export type { TestDriveAppointment, TestDriveVehicle } from "@config/vdp-booking-state";
export {
  testDriveAppointmentListSchema,
  testDriveAppointmentSchema,
  testDriveVehicleSchema,
} from "@config/vdp-booking-state";
export type { BookingContact };
export { bookTestDriveInputSchema };
