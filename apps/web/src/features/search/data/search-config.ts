/**
 * Search feature configuration constants.
 */

export const SEARCH_RESULTS_PAGE_SIZE = 24;

export const SEARCH_CONFIG = {
  /** Debounce delay for autocomplete requests in ms. */
  DEBOUNCE_MS: 200,
  /** Minimum characters before fetching suggestions. */
  MIN_CHARS: 2,
  /** Maximum suggestions shown in the dropdown. */
  MAX_SUGGESTIONS: 6,
  /** Maximum number of cards rendered per page in the results grid. */
  PAGE_SIZE: SEARCH_RESULTS_PAGE_SIZE,
} as const;
