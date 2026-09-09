import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

/** Validated client-facing inventory item schema. */
export const inventorySchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  trim: z.string().max(80).optional(),
  price: z.number().min(0).max(999_999_999),
  mileage: z.number().int().min(0).max(999_999_999),
  imageUrl: z.url(),
  imageAlt: z.string().max(200),
  ctaLink: z.url(),
  /** Surface context for text color on image overlays. */
  surface: z.enum(["light", "dark"]).optional(),
  /** Vehicle Identification Number — optional but recommended for VDP routing. */
  vin: z.string().regex(VIN_PATTERN).optional(),
});

export type InventoryItem = z.infer<typeof inventorySchema>;

/** Loose upstream schema — no validation constraints. */
export const inventoryUpstreamSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  trim: z.string().optional(),
  price: z.number(),
  mileage: z.number(),
  imageUrl: z.string(),
  imageAlt: z.string(),
  ctaLink: z.string(),
  surface: z.enum(["light", "dark"]).optional(),
  vin: z.string().optional(),
});

export type InventoryUpstreamItem = z.infer<typeof inventoryUpstreamSchema>;
