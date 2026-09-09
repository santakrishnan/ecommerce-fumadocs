import { z } from "zod";

/**
 * Zod schemas for the profile appointment BFF response.
 *
 * The upstream contract is not yet finalized. These schemas define the
 * validated client-facing shape and will be used to safeParse upstream
 * responses once the real service is integrated.
 *
 * Vehicle fields align with `VehicleRef` from @ucmp/sdk-visitor-profile-api
 * (title, year, mileage) but are shaped for display purposes.
 */

// ─── Vehicle Schema ──────────────────────────────────────────────────

export const profileAppointmentVehicleSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  mileage: z.number().int().nonnegative(),
  imageUrl: z.string().optional(),
  /** VIN — required for VDP navigation. */
  vin: z.string(),
  /** Vehicle make (e.g. "Toyota") — required for VDP navigation. */
  make: z.string(),
  /** Vehicle model (e.g. "Highlander") — required for VDP navigation. */
  model: z.string(),
  /** Vehicle trim (e.g. "Hybrid Limited") — optional for VDP navigation. */
  trim: z.string().optional(),
});

export type ProfileAppointmentVehicle = z.infer<typeof profileAppointmentVehicleSchema>;

// ─── Appointment Schema ──────────────────────────────────────────────

export const profileAppointmentSchema = z.object({
  id: z.string(),
  type: z.enum(["test_drive", "offer", "vehicle_sold"]),
  label: z.string(),
  vehicles: z.array(profileAppointmentVehicleSchema).min(1),
  dealershipName: z.string(),
  dealershipAddress: z.string(),

  // test_drive + offer with appointment
  scheduledAt: z.string().datetime().optional(),

  // offer fields
  expiresAt: z.string().datetime().optional(),
  monthlyPayment: z.number().nonnegative().optional(),
  apr: z.number().nonnegative().optional(),
  loanTermMonths: z.number().int().positive().optional(),
  downPayment: z.number().nonnegative().optional(),
  tradeInValue: z.number().nonnegative().optional(),
  coBorrowerName: z.string().optional(),

  // vehicle_sold fields
  soldMessage: z.string().optional(),
});

export type ProfileAppointment = z.infer<typeof profileAppointmentSchema>;

// ─── Response Schema (array of appointments) ─────────────────────────

export const profileAppointmentResponseSchema = z.array(profileAppointmentSchema);

export type ProfileAppointmentResponse = z.infer<typeof profileAppointmentResponseSchema>;

// ─── Upstream Schema (loose — accepts extra fields) ──────────────────

export const profileAppointmentUpstreamVehicleSchema = z.object({
  title: z.string(),
  year: z.number(),
  mileage: z.number(),
  imageUrl: z.string().optional(),
  vin: z.string(),
  make: z.string(),
  model: z.string(),
  trim: z.string().optional(),
});

export const profileAppointmentUpstreamSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  vehicles: z.array(profileAppointmentUpstreamVehicleSchema),
  dealershipName: z.string(),
  dealershipAddress: z.string(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
  monthlyPayment: z.number().optional(),
  apr: z.number().optional(),
  loanTermMonths: z.number().optional(),
  downPayment: z.number().optional(),
  tradeInValue: z.number().optional(),
  coBorrowerName: z.string().optional(),
  soldMessage: z.string().optional(),
});

export const profileAppointmentUpstreamResponseSchema = z.array(profileAppointmentUpstreamSchema);

export type ProfileAppointmentUpstreamResponse = z.infer<
  typeof profileAppointmentUpstreamResponseSchema
>;
