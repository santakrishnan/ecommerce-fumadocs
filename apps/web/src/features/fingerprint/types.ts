/**
 * Device fingerprint domain types.
 *
 * The fingerprint feature is **decoupled** from the Visitor Profile Service:
 * it owns the SDK gate (once / 24h) and the geo-enrichment call. Identity is
 * server-verified and stored in an httpOnly `_ucmp_fp_id` cookie set/read only
 * server-side; the client never reads or writes a cookie. Its context is the
 * single client source of truth for the device fingerprint id and geo.
 */

/** Result of the client fingerprint SDK gate. */
export interface FingerprintIdentity {
  /** Stable device fingerprint id (hash) from the FP SDK. */
  fingerprintId: string;
  /**
   * Fresh-event correlation id — present only on a **cold** resolution
   * (drives geo enrichment). `null` on the warm (cookie) path.
   */
  requestId: string | null;
}

/** Geo derived from the fingerprint event (via the enrich endpoint). */
export interface FingerprintGeo {
  /** Coordinates — exposed via the enrich response, cookie stays sealed. */
  coordinates?: { lat: number; lng: number };
  /** Postal / zip code (safe to expose to the client). */
  zip?: string;
}

/** Composed value exposed by `FingerprintProvider` / `useFingerprint()`. */
export interface FingerprintContextValue {
  /** Coordinates from geo enrichment (cold path). */
  coordinates?: { lat: number; lng: number };
  /** Device fingerprint id, once resolved. */
  fingerprintId?: string;
  /** Identity resolution errored. */
  isError: boolean;
  /** Identity resolution in flight. */
  isLoading: boolean;
  /** True once the fingerprint id has resolved. */
  isReady: boolean;
  /** Fresh-event id (cold path only). */
  requestId?: string | null;
  /** Zip from geo enrichment (cold path) or a prior sealed cookie. */
  zip?: string;
}
