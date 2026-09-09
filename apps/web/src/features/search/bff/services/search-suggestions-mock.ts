import "server-only";

import { SEARCH_SUGGESTIONS_ENTRY_FIXTURE } from "../__fixtures__/agent.fixture";
import type { SearchSuggestionsResponse } from "../contracts";
import { mockDelay } from "../lib/mock-delay";

const MOCK_DELAY_MS = 50;

export async function mockSearchSuggestions(): Promise<SearchSuggestionsResponse> {
  await mockDelay(MOCK_DELAY_MS);

  return SEARCH_SUGGESTIONS_ENTRY_FIXTURE;
}
