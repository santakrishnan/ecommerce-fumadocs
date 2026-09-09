import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

/** ISO 3779 VIN — 17 chars, no I/O/Q. Normalizes to uppercase before validation. */
const vinSchema = z
  .string()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(VIN_PATTERN, "Invalid VIN format"));

export const vehicleCardSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  trim: z.string().max(80).optional(),
  vin: vinSchema.optional(),
  price: z.number().min(0).max(999_999_999),
  mileage: z.number().int().min(0).max(999_999_999),
  imageUrl: z.url(),
  imageAlt: z.string().max(200),
  detailPageUrl: z.url(),
});

export type VehicleCard = z.infer<typeof vehicleCardSchema>;
