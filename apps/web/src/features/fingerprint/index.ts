/**
 * Public surface of the fingerprint feature (client).
 *
 * Owns the device fingerprint SDK gate (once / 24h) and geo enrichment —
 * decoupled from the Visitor Profile Service. Identity is **server-verified**
 * (via the Server API `getEvent`) and stored in an httpOnly `_ucmp_fp_id` cookie
 * that is only ever set/read server-side; the client never touches a cookie. The
 * BFF surface lives under `@features/fingerprint/bff` (server-only).
 */

export {
  FINGERPRINT_GEO_QUERY_KEY,
  FINGERPRINT_QUERY_KEY,
  FINGERPRINT_SESSION_QUERY_KEY,
  HAS_FINGERPRINT_KEY,
} from "./constants";
export {
  useFingerprint,
  useFingerprintEnrich,
  useFingerprintIdentity,
  useFingerprintSession,
} from "./hooks/use-fingerprint";
export { FingerprintProvider } from "./providers/fingerprint-provider";
export type { FingerprintContextValue, FingerprintGeo, FingerprintIdentity } from "./types";
