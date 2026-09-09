import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { AutocompleteRequest } from "../contracts/autocomplete-request.schema";
import type { AutocompleteResponse } from "../contracts/autocomplete-response.schema";
import {
  type AutocompleteError,
  createAutocompleteError,
  mapCaughtToAutocompleteError,
} from "../errors/autocomplete.errors";
import { mockGetAutocomplete } from "../services/autocomplete-mock";

export type GetAutocompleteResult =
  | { success: true; data: AutocompleteResponse }
  | { success: false; error: AutocompleteError };

/**
 * Use case: fetch autocomplete suggestions for the given query.
 *
 * - When API_UPSTREAM_URL is set → will call the real upstream (not yet implemented)
 * - When USE_AUTOCOMPLETE_MOCKS is "true" or upstream is not set → returns mock data
 * - Otherwise → fails fast with 503 to surface misconfiguration
 */
export async function getAutocomplete(
  request: AutocompleteRequest
): Promise<GetAutocompleteResult> {
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  // TODO: When upstream is available, call fetchAutocompleteUpstream(upstreamUrl, request)
  if (upstreamUrl && env.USE_AUTOCOMPLETE_MOCKS !== "true") {
    return {
      success: false,
      error: createAutocompleteError(
        "ServiceUnavailable",
        "Autocomplete upstream is not yet implemented",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  try {
    const data = await mockGetAutocomplete(request);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: mapCaughtToAutocompleteError(error) };
  }
}
