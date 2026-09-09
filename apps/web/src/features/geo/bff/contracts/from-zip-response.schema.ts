import { z } from "zod";
import { ZIP_PATTERN } from "./geo.constants";

/**
 * Response schema for the fromZip geo BFF endpoint.
 * This is the shape returned to the frontend — transformed from the upstream response.
 */
export const fromZipResponseSchema = z.object({
  city: z.string(),
  state: z.string(),
  stateCode: z.string().length(2),
  zip: z.string().regex(ZIP_PATTERN),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type FromZipResponse = z.infer<typeof fromZipResponseSchema>;

/**
 * Upstream response shape — what the external backend's /geo/v1/fromZip returns
 * inside the `data` field of the response envelope.
 */
export const fromZipUpstreamResponseSchema = z.object({
  city: z.string(),
  state: z.string(),
  stateCode: z.string(),
  zipCode: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export type FromZipUpstreamResponse = z.infer<typeof fromZipUpstreamResponseSchema>;

/**
 * The full upstream response envelope — `{ data, meta }`.
 * The geo API wraps all responses in this shape.
 */
export const fromZipUpstreamEnvelopeSchema = z.object({
  data: fromZipUpstreamResponseSchema,
  meta: z
    .object({
      traceId: z.string(),
      timestamp: z.string(),
    })
    .optional(),
});
