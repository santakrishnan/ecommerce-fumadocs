import { locationCookieNames } from "@config/cookies";
import { getNewTodayResponse } from "@features/landing/services/get-new-today-response";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/recommendations/today
 *
 * New Today flow — stage 1 of 4 · REQUEST CONTEXT (browser front door)
 * `[request context] → cache boundary → upstream client → validated contract`
 *
 * Where the flow starts for browser-originated calls — the HTTP twin of the
 * `FeaturedVehiclesSection` front door. Extracts per-request values from the
 * incoming request (`request.cookies` → ZIP; future tracking IDs via
 * `extractTrackingIds`), passes them forward as plain arguments, and maps
 * error results to status codes. Skips the cache boundary (no `"use cache"`
 * on this path) and calls the validated contract directly in-process.
 * `fixture=empty` is supported for MVP integration and demo flows.
 */
export async function GET(request: NextRequest) {
  try {
    const fixture =
      process.env.NODE_ENV === "production"
        ? "success"
        : (request.nextUrl.searchParams.get("fixture") ?? "success");

    const zipCode = request.cookies.get(locationCookieNames.ZIP)?.value ?? null;

    // Planned backend swap: this front door also extracts per-request tracking
    // IDs (header first, cookie fallback) and passes them down as arguments —
    // they become outgoing headers inside `apiClient` via its headerMap:
    //
    // const trackingIds = extractTrackingIds(
    //   request,
    //   { sessionId: "x-session-id", visitorId: "x-visitor-id" },
    //   { sessionId: trackingCookieNames.SESSION, visitorId: trackingCookieNames.VISITOR }
    // );
    // const response = await getNewTodayResponse({ fixture, zipCode, trackingIds });

    const response = await getNewTodayResponse({ fixture, zipCode });

    // Our own server-side payload failed validation — a server/data fault,
    // not the client's, so 500 rather than 400.
    if ("error" in response) {
      return NextResponse.json(response, { status: 500 });
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch New Today recommendations",
        },
      },
      { status: 500 }
    );
  }
}
