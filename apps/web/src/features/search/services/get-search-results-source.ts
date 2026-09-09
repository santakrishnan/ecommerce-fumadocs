import { fixtureSearchResultsSource } from "./fixture-search-results-source";
import type { SearchResultsSource } from "./search-results-source";

/**
 * Resolves the active search results data source.
 *
 * Currently only the fixture source is implemented. When BFF or live API
 * implementations are added, this function will select the source based on
 * config — making the swap a code-free change.
 *
 * @example
 * ```ts
 * const source = getSearchResultsSource();
 * const results = await source.getResults({ page: 1, pageSize: 24 });
 * ```
 */
export function getSearchResultsSource(): SearchResultsSource {
  return fixtureSearchResultsSource;
}
