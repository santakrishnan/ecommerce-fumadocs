import { readLocationFromCookies } from "@features/location/server";
import { type SearchResultsApiResponse, searchErrorResponse } from "@features/search/bff";
import { getSearchResultsResponse } from "@features/search/services/get-search-results-response";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@shared/lib/http/status-codes";
import { LOCATION_DEFAULTS } from "@ucmp/shared/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/search
 *
 * Returns paginated vehicle search results for the given filters, sort order,
 * and pagination parameters. `location` is resolved server-side from cookies
 * when not provided in the body — clients may omit it.
 *
 * Errors:
 * - 400: request body fails schema validation
 * - 500: unexpected server error
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id") ?? crypto.randomUUID();
  const identity = await readVisitorIdentity();

  try {
    const body: unknown = await request.json().catch(() => ({}));

    // Resolve location from cookies BEFORE validation so that `location`
    // (now required in the schema) is always present. Body wins if supplied.
    // Cookie location is used only when ALL required fields are present —
    // mixing a cookie ZIP with LOCATION_DEFAULTS lat/lng would produce a
    // geographically inconsistent tuple. Fall back to LOCATION_DEFAULTS as
    // a consistent set when cookies are incomplete.
    const rawBody = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    if (!rawBody.location || typeof rawBody.location !== "object") {
      const cookieLocation = await readLocationFromCookies();
      const hasCompleteLocation =
        cookieLocation.zipCode &&
        cookieLocation.latitude != null &&
        cookieLocation.longitude != null;

      rawBody.location = hasCompleteLocation
        ? {
            zipCode: cookieLocation.zipCode,
            latitude: cookieLocation.latitude,
            longitude: cookieLocation.longitude,
          }
        : {
            zipCode: LOCATION_DEFAULTS.ZIP,
            latitude: LOCATION_DEFAULTS.LAT,
            longitude: LOCATION_DEFAULTS.LNG,
          };
    }

    const result = await getSearchResultsResponse({
      request: rawBody,
      traceId,
      identity,
    });

    if (!result.success) {
      return searchErrorResponse(result.error, traceId);
    }

    return NextResponse.json<SearchResultsApiResponse>(result.data);
  } catch {
    return searchErrorResponse(
      {
        code: "SEARCH_INTERNAL_ERROR",
        message: "An unexpected error occurred while processing the search request",
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      },
      traceId
    );
  }
}
