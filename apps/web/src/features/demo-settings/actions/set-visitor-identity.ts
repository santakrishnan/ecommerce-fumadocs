"use server";

import { encodeVisitorId } from "@features/fingerprint/bff/fingerprint-cookie";
import { writeLocationCookies } from "@features/location/lib/location-cookies";
import { buildCookieConfig } from "@shared/lib/http";
import { TRACKING_COOKIE, TRACKING_TTL } from "@ucmp/shared/constants";
import { cookies } from "next/headers";
import type { VisitorIdentityInput } from "../lib/visitor-identity-schema";
import { visitorIdentitySchema } from "../lib/visitor-identity-schema";

export interface SetVisitorIdentityResult {
  error?: string;
  success: boolean;
}

/**
 * Writes explicit cookie values for all five visitor identity fields.
 * Clears the ancillary tracking cookies (profile, event, visit timestamps)
 * so the next page load starts with a clean resolve pass, identical to
 * what generateVisitorIdentity does.
 */
export async function setVisitorIdentity(
  input: VisitorIdentityInput
): Promise<SetVisitorIdentityResult> {
  const parsed = visitorIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { fpId, sessionId, visitorId, geo, zip } = parsed.data;
  const [latRaw, lngRaw] = geo.split(",");
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);

  const cookieStore = await cookies();

  // Clear ancillary cookies so the resolve flow treats this as a fresh visit
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

  // Write fp id (base64url-encoded to match the real flow)
  const { name: _fpName, ...fpOptions } = buildCookieConfig(
    TRACKING_COOKIE.FP_ID,
    TRACKING_TTL.FINGERPRINT,
    { httpOnly: true, sameSite: "lax" }
  );
  cookieStore.set(TRACKING_COOKIE.FP_ID, encodeVisitorId(fpId), fpOptions);

  // Write session id
  const { name: _sessionName, ...sessionOptions } = buildCookieConfig(
    TRACKING_COOKIE.SESSION_ID,
    TRACKING_TTL.SESSION,
    { httpOnly: true, sameSite: "lax" }
  );
  cookieStore.set(TRACKING_COOKIE.SESSION_ID, sessionId, sessionOptions);

  // Write visitor id
  const { name: _visitorName, ...visitorOptions } = buildCookieConfig(
    TRACKING_COOKIE.VISITOR_ID,
    TRACKING_TTL.SESSION,
    { httpOnly: true, sameSite: "lax" }
  );
  cookieStore.set(TRACKING_COOKIE.VISITOR_ID, visitorId, visitorOptions);

  // Write location pair via the canonical writer
  await writeLocationCookies({ zip, latitude, longitude, source: "manual" });

  return { success: true };
}
