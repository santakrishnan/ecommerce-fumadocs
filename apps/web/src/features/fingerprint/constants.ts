import { clientEnv } from "@config/client-env";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";

/** True when the public Fingerprint API key is configured. */
export const HAS_FINGERPRINT_KEY = Boolean(clientEnv.NEXT_PUBLIC_FINGERPRINT_API_KEY);

/** TanStack Query key for the server-authoritative fingerprint session. */
export const FINGERPRINT_SESSION_QUERY_KEY = ["fingerprint", "session"] as const;

/** TanStack Query key for the device fingerprint SDK seam (cold only). */
export const FINGERPRINT_QUERY_KEY = ["fingerprint", "sdk"] as const;

/** TanStack Query key prefix for the fingerprint geo-enrichment seam. */
export const FINGERPRINT_GEO_QUERY_KEY = ["fingerprint", "enrich"] as const;

/**
 * Fingerprint source-of-truth cookie (`_ucmp_fp_id`) — **server-set, httpOnly**.
 * Holds the authoritative `visitorId` from the Fingerprint Server API `getEvent`
 * response. This feature only ever sets/reads it server-side — never client JS.
 */
export const FINGERPRINT_ID_COOKIE = TRACKING_COOKIE.FP_ID;

// ─── BFF API Routes ─────────────────────────────────────────────────────────

/** GET — server-authoritative session (reads httpOnly cookies). */
export const FINGERPRINT_SESSION_URL = "/api/v1/fingerprint/session" as const;

/** POST — geo-enrichment from a fresh requestId (cold path). */
export const FINGERPRINT_ENRICH_URL = "/api/v1/fingerprint/enrich" as const;
