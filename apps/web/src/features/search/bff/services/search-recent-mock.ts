import "server-only";

import { SEARCH_RECENT_FIXTURE } from "../__fixtures__/search-recent.fixture";
import type { SearchRecentResponse } from "../contracts/search-recent-response.schema";
import { mockDelay } from "../lib/mock-delay";

const MOCK_DELAY_MS = 50;

export async function mockSearchRecent(): Promise<SearchRecentResponse> {
  await mockDelay(MOCK_DELAY_MS);
  return SEARCH_RECENT_FIXTURE;
}
