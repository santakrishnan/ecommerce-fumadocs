"use server";

import { encodeVisitorId } from "@features/fingerprint/bff/fingerprint-cookie";
import { writeLocationCookies } from "@features/location/lib/location-cookies";
import { buildCookieConfig } from "@shared/lib/http";
import { LOCATION_DEFAULTS, TRACKING_COOKIE, TRACKING_TTL } from "@ucmp/shared/constants";
import { cookies } from "next/headers";

/** Prefix for synthetic fingerprint IDs so they're distinguishable from real ones in cookies. */
const DEMO_FP_PREFIX = "demo_";

export interface GenerateVisitorIdentityResult {
  success: boolean;
  syntheticId: string;
}

/**
 * Generates a synthetic fingerprint ID (`demo_<uuid>`), writes it to _ucmp_fp_id
 * (base64url-encoded, matching the real flow), clears all identity/session
 * tracking cookies, and resets location to the Beverly Hills defaults (90210).
 *
 * Location is reset (not cleared) so the FingerprintProvider sees
 * `hasFingerprint=true` AND `zip=truthy` → takes the warm path → SDK does NOT
 * fire → synthetic ID is preserved.
 *
 * On the next page load, the resolve flow hashes the synthetic ID → VPS receives
 * a new `deviceFingerprintHash` → creates a brand-new visitor profile.
 *
 * The `demo_` prefix makes synthetic IDs instantly distinguishable from real
 * Fingerprint SDK IDs when inspecting the decoded cookie value.
 *
 * Does NOT clear the demo-agent-backend or location cookies.
 */
export async function generateVisitorIdentity(): Promise<GenerateVisitorIdentityResult> {
  const cookieStore = await cookies();

  // Generate a prefixed synthetic fingerprint ID that will produce a unique hash
  const syntheticId = `${DEMO_FP_PREFIX}${crypto.randomUUID()}`;

  // Clear identity/session cookies only. Location cookies are reset to
  // defaults so the FingerprintProvider sees `hasFingerprint=true` AND
  // `zip=truthy` → takes the warm path → SDK does NOT fire → synthetic ID
  // is preserved.
  cookieStore.delete(TRACKING_COOKIE.VISITOR_ID);
  cookieStore.delete(TRACKING_COOKIE.SESSION_ID);
  cookieStore.delete(TRACKING_COOKIE.PROFILE_ID);
  cookieStore.delete(TRACKING_COOKIE.FP_EID);
  cookieStore.delete(TRACKING_COOKIE.FIRST_VISIT_AT);
  cookieStore.delete(TRACKING_COOKIE.LAST_VISIT_AT);

  // Block recent-return until the visitor browses a VDP. No max-age — this is
  // a session cookie, explicitly cleared by `unblockRecentReturn` on VDP visit.
  const {
    name: _rrName,
    maxAge: _rrMaxAge,
    ...rrOptions
  } = buildCookieConfig(TRACKING_COOKIE.RECENT_RETURN_BLOCKED, 0, {
    httpOnly: true,
    sameSite: "lax",
  });
  cookieStore.set(TRACKING_COOKIE.RECENT_RETURN_BLOCKED, "1", rrOptions);

  // Write the synthetic ID to the fingerprint cookie, base64url-encoded to
  // match the format that readFingerprintSession → decodeVisitorId expects.
  const { name: _name, ...fpCookieOptions } = buildCookieConfig(
    TRACKING_COOKIE.FP_ID,
    TRACKING_TTL.FINGERPRINT,
    { httpOnly: true, sameSite: "lax" }
  );
  cookieStore.set(TRACKING_COOKIE.FP_ID, encodeVisitorId(syntheticId), fpCookieOptions);

  // Reset location to Beverly Hills defaults (90210).
  await writeLocationCookies({
    zip: LOCATION_DEFAULTS.ZIP,
    latitude: LOCATION_DEFAULTS.LAT,
    longitude: LOCATION_DEFAULTS.LNG,
    source: "manual",
  });

  return { success: true, syntheticId };
}
