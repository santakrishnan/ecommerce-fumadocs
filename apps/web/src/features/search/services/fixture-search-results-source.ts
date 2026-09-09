import { VEHICLE_FIXTURES } from "../bff/__fixtures__/vehicle-results.fixture";
import { SEARCH_CONFIG } from "../data/search-config";
import type {
  SearchResultsParams,
  SearchResultsResponse,
  SearchResultsSource,
} from "./search-results-source";

/**
 * Fixture-based search results source.
 *
 * Uses the deterministic vehicle factory (150 records) with pagination
 * computed in-memory. Async interface matches the future real API contract
 * so swapping sources requires zero refactoring.
 */
export const fixtureSearchResultsSource: SearchResultsSource = {
  async getResults(params?: SearchResultsParams): Promise<SearchResultsResponse> {
    let { page = 1, pageSize = SEARCH_CONFIG.PAGE_SIZE } = params ?? {};

    // Normalize inputs to prevent negative/infinite slicing
    pageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : SEARCH_CONFIG.PAGE_SIZE;

    const totalCount = VEHICLE_FIXTURES.length;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
    const parsedPage = Number.isFinite(page) ? Math.floor(page) : 1;
    page = totalPages === 0 ? 1 : Math.min(totalPages, Math.max(1, parsedPage));

    const startIndex = (page - 1) * pageSize;
    const vehicles = VEHICLE_FIXTURES.slice(startIndex, startIndex + pageSize);

    if (process.env.NODE_ENV === "development") {
      // Simulate variable network latency in dev to surface loading states
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 30));
    }

    return {
      vehicles,
      totalCount,
      totalPages,
      page,
      pageSize,
      headline: "See all results",
    };
  },
};
