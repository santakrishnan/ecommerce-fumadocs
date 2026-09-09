import { ROUTES } from "@config/routes/constants";
import { TRACKING_COOKIE, TRACKING_TTL } from "@ucmp/shared/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Recent-return window (ms). Beyond it, a returning visitor is "lapsed". */
const RECENT_RETURN_WINDOW_MS = TRACKING_TTL.RETURNING_VISITOR_THRESHOLD * 1000;

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

/**
 * True when the visitor's last resolved visit is older than the recent-return
 * window.
 *
 * Reads the `_ucmp_last_visit_at` cookie that `/resolve` stamps on every
 * resolution — the cheap, edge-readable projection of the VPS `lastSeenAt`. The
 * VPS stays the source of truth; **no service is called from the edge** and no
 * activity cookie is written here.
 */
function isLapsedReturn(request: NextRequest): boolean {
  const raw = request.cookies.get(TRACKING_COOKIE.LAST_VISIT_AT)?.value;
  if (!raw) {
    return false; // No prior resolved visit — treat as first-visit / new.
  }

  const lastVisitMs = Date.parse(raw);
  if (Number.isNaN(lastVisitMs)) {
    return false; // Malformed timestamp — fail open to the home experience.
  }

  return Date.now() - lastVisitMs >= RECENT_RETURN_WINDOW_MS;
}

/**
 * Proxy (Next.js 16 edge middleware equivalent).
 *
 * Owns **only** the returning-visitor routing so the home routes can be a PPR
 * static shell instead of blocking on `/resolve`:
 * - `/` + lapsed → `/welcome-back`
 * - `/welcome-back` + not-lapsed → `/`
 *
 * The mode *rendering* decision (first-visit vs recent-return) stays in the
 * streamed `HomeBody` leaf. In non-production the `?exp=` override bypasses the
 * redirect so a forced mode isn't bounced.
 */
export function proxy(request: NextRequest): NextResponse {
  // DEV-only `?exp=` drives the mode in the RSC; don't second-guess it at the edge.
  if (process.env.NODE_ENV !== "production" && request.nextUrl.searchParams.has("exp")) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const lapsed = isLapsedReturn(request);

  if (pathname === ROUTES.HOME && lapsed) {
    return redirectTo(request, ROUTES.WELCOME);
  }

  if (pathname === ROUTES.WELCOME && !lapsed) {
    return redirectTo(request, ROUTES.HOME);
  }

  return NextResponse.next();
}

/**
 * Scope the matcher to home and welcome-back routes — `proxy()` runs
 * on every matched request (incl. prefetches), so keep it tight.
 */
export const config = {
  matcher: ["/", "/welcome-back"],
};
