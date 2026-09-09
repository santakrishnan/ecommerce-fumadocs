import "server-only";

import { FILTERS_SCOPED_FIXTURE, FILTERS_SUCCESS_FIXTURE } from "../__fixtures__/filters.fixture";
import type { FiltersRequest } from "../contracts/filters-request.schema";
import type { FiltersResponse } from "../contracts/filters-response.schema";
import { mockDelay } from "../lib/mock-delay";

const MOCK_DELAY_MS = 50;

/**
 * Mock filters service for local development when API_UPSTREAM_URL is not set.
 *
 * When `searchId` is provided, returns session-scoped filters with reduced
 * counts and `selectedContextFilters`. Otherwise returns the generic catalog.
 */
export async function mockGetFilters(request: FiltersRequest): Promise<FiltersResponse> {
  await mockDelay(MOCK_DELAY_MS);

  if (request.searchId) {
    return FILTERS_SCOPED_FIXTURE;
  }

  return FILTERS_SUCCESS_FIXTURE;
}
