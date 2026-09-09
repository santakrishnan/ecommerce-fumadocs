import {
  type AutocompleteErrorBody,
  type AutocompleteResponse,
  autocompleteErrorResponse,
  autocompleteRequestSchema,
  getAutocomplete,
} from "@features/search/bff";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/search/autocomplete?q=<query>
 *
 * Returns autocomplete suggestions for the given search query.
 * Validates the `q` query parameter via the BFF contract schema,
 * then delegates to the autocomplete use-case.
 *
 * Errors:
 * - 400: query param fails schema validation (returns empty suggestions for UX)
 * - 500: unexpected server error
 * - 503: upstream unavailable
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AutocompleteResponse | AutocompleteErrorBody>> {
  const raw = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const parsed = autocompleteRequestSchema.safeParse({ q: raw });

  if (!parsed.success) {
    // For autocomplete, return empty suggestions on validation failure
    // rather than a hard error — better UX for progressive typing.
    return NextResponse.json<AutocompleteResponse>({
      suggestions: [],
      meta: {
        traceId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const result = await getAutocomplete(parsed.data);

    if (!result.success) {
      return autocompleteErrorResponse(result.error);
    }

    return NextResponse.json<AutocompleteResponse>(result.data);
  } catch {
    return autocompleteErrorResponse({
      code: "AUTOCOMPLETE_INTERNAL_ERROR",
      message: "An unexpected error occurred while fetching suggestions",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
