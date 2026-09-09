import { locationCookieNames } from "@config/cookies";
import { decodeVisitorId } from "@features/fingerprint/bff/fingerprint-cookie";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { cookies } from "next/headers";
import { VisitorIdentityCard } from "./visitor-identity-card";

/**
 * Async server wrapper that reads HttpOnly and non-HttpOnly cookies and passes
 * them to the client `VisitorIdentityCard` as a JSON snapshot for the debug
 * textarea. The fp id is decoded from its base64url storage form so the
 * textarea always shows the plain id — matching what setVisitorIdentity expects.
 */
export async function VisitorIdentityCardLoader() {
  const jar = await cookies();

  const rawFpId = jar.get(TRACKING_COOKIE.FP_ID)?.value ?? null;

  const snapshot = {
    fpId: rawFpId ? (decodeVisitorId(rawFpId) ?? rawFpId) : null,
    sessionId: jar.get(TRACKING_COOKIE.SESSION_ID)?.value ?? null,
    visitorId: jar.get(TRACKING_COOKIE.VISITOR_ID)?.value ?? null,
    geo: jar.get(locationCookieNames.GEO)?.value ?? null,
    zip: jar.get(locationCookieNames.ZIP)?.value ?? null,
  };

  return <VisitorIdentityCard cookieSnapshot={snapshot} />;
}
