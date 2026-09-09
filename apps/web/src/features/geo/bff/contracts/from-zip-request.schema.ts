import { z } from "zod";
import { ZIP_PATTERN } from "./geo.constants";

/**
 * Input schema for the fromZip geo resolution request.
 * Accepts a 5-digit US zip code to resolve location.
 */
export const fromZipRequestSchema = z.object({
  zip: z.string().regex(ZIP_PATTERN, { message: "Must be a valid 5-digit zip code" }),
});

export type FromZipRequest = z.infer<typeof fromZipRequestSchema>;
