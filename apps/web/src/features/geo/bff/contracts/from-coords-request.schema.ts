import { z } from "zod";

/**
 * Input schema for the fromCoords geo resolution request.
 * Accepts latitude/longitude (already truncated by the caller) to resolve
 * the nearest location.
 */
export const fromCoordsRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type FromCoordsRequest = z.infer<typeof fromCoordsRequestSchema>;
