import { MOCK_VEHICLE_DATASET } from "../__fixtures__/autocomplete.fixture";
import type { AutocompleteRequest } from "../contracts/autocomplete-request.schema";
import type {
  AutocompleteResponse,
  AutocompleteService,
  Suggestion,
} from "../contracts/autocomplete-response.schema";
import { mockDelay } from "../lib/mock-delay";

/** Base network delay for the mock service in ms; jittered when MOCK_LATENCY is on. */
const MOCK_DELAY_MS = 100;

/** Maximum results returned by the mock service. */
const MOCK_MAX_RESULTS = 10;

/**
 * Mock implementation of the autocomplete BFF service.
 * Filters the mock vehicle dataset by case-insensitive substring match.
 * Applies a randomized network delay when MOCK_LATENCY is enabled.
 *
 * Used by the BFF use-case (server-side route handler).
 */
export async function mockGetAutocomplete(
  request: AutocompleteRequest
): Promise<AutocompleteResponse> {
  await mockDelay(MOCK_DELAY_MS);

  const normalized = request.q.toLowerCase().trim();
  const suggestions = MOCK_VEHICLE_DATASET.filter((item) =>
    item.label.toLowerCase().includes(normalized)
  ).slice(0, MOCK_MAX_RESULTS);

  return {
    suggestions,
    meta: {
      traceId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Mock implementation of AutocompleteService for client-side component injection.
 * Components accept this via prop — never hardcode a specific implementation.
 */
export const mockAutocompleteService: AutocompleteService = {
  async getSuggestions(query: string): Promise<Suggestion[]> {
    await mockDelay(MOCK_DELAY_MS);

    const normalized = query.toLowerCase().trim();
    return MOCK_VEHICLE_DATASET.filter((item) =>
      item.label.toLowerCase().includes(normalized)
    ).slice(0, MOCK_MAX_RESULTS);
  },
};
