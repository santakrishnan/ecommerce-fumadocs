import { buildCookieConfig } from "@shared/lib/http";
import type { ResolveResponse } from "@ucmp/sdk-visitor-profile-api";
import { TRACKING_COOKIE, TRACKING_TTL } from "@ucmp/shared/constants";
import type { NextResponse } from "next/server";

function buildCookieOptions(baseName: string, ttl: number) {
  const { name: _computedName, ...options } = buildCookieConfig(baseName, ttl, {
    httpOnly: true,
    sameSite: "lax",
  });
  return options;
}

export function setProfileResolveIdentityCookies(
  response: NextResponse<ResolveResponse>,
  data: ResolveResponse["data"]
): void {
  // Keep canonical tracking cookie names for read/write compatibility across
  // existing middleware/routes that consume TRACKING_COOKIE constants directly.
  const sessionCookieOptions = buildCookieOptions(TRACKING_COOKIE.SESSION_ID, TRACKING_TTL.SESSION);
  response.cookies.set(TRACKING_COOKIE.VISITOR_ID, data.visitorId, sessionCookieOptions);
  response.cookies.set(TRACKING_COOKIE.SESSION_ID, data.sessionId, sessionCookieOptions);

  if (data.customerId) {
    const profileCookieOptions = buildCookieOptions(
      TRACKING_COOKIE.PROFILE_ID,
      TRACKING_TTL.PROFILE
    );
    response.cookies.set(TRACKING_COOKIE.PROFILE_ID, data.customerId, profileCookieOptions);
  } else {
    response.cookies.delete(TRACKING_COOKIE.PROFILE_ID);
  }

  response.cookies.set(
    TRACKING_COOKIE.LAST_VISIT_AT,
    new Date().toISOString(),
    sessionCookieOptions
  );
}
