import { z } from "zod";

/** POST body for `/api/v1/fingerprint/enrich`. */
export const enrichRequestSchema = z.object({
  requestId: z.string().min(1),
});

export type EnrichRequest = z.infer<typeof enrichRequestSchema>;

/** Coordinates derived from the fingerprint event (client-safe, coarse IP geo). */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Response from `/api/v1/fingerprint/enrich`.
 * `visitorId` is the **server-verified** id from `getEvent` (not the client claim).
 */
export interface EnrichResponse {
  coordinates?: Coordinates;
  visitorId?: string;
  zip?: string;
}

/**
 * Response from `GET /api/v1/fingerprint/session` — the server-authoritative
 * view derived from the httpOnly cookies. Lets the client decide cold vs warm
 * without ever reading a cookie itself.
 */
export interface FingerprintSessionResponse {
  coordinates?: Coordinates;
  /** True when a valid verified-id cookie is present (warm path). */
  hasFingerprint: boolean;
  visitorId?: string;
  zip?: string;
}
