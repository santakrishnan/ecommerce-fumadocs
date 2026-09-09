import type { Vehicle } from "@shared/components/inventory-card";

/**
 * Shared contract for paginated search results.
 *
 * All data sources (fixtures, future BFF, future live API) return this shape.
 * Adding a new field is a one-line change here — every source picks it up.
 */
export interface SearchResultsResponse {
  /** Headline describing the results set. */
  headline: string;
  /** Current page number (1-indexed). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Total number of matching records across all pages. */
  totalCount: number;
  /** Total number of pages available. */
  totalPages: number;
  /** The paginated slice of vehicles for the current page. */
  vehicles: Vehicle[];
}

/** Parameters for fetching search results. */
export interface SearchResultsParams {
  /** Page number (1-indexed). Defaults to 1. */
  page?: number;
  /** Number of results per page. Defaults to 24. */
  pageSize?: number;
}

/**
 * Contract for any search results data source.
 *
 * Current implementation:
 * - `fixtureSearchResultsSource` — deterministic seeded factory (dev/test)
 *
 * Future implementations (add when needed):
 * - BFF proxy layer (staging)
 * - Direct live API (production)
 *
 * All methods are async even for fixtures so the shape matches a real fetch
 * and nothing needs refactoring when swapping sources.
 */
export interface SearchResultsSource {
  getResults(params?: SearchResultsParams): Promise<SearchResultsResponse>;
}
