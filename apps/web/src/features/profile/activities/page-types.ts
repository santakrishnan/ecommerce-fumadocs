/**
 * Canonical set of page type values for the `visitorActivity.page.viewed` event.
 *
 * These labels are defined in the visitor profile API spec (PageViewedActivity.pageType)
 * and in the `visitorActivity.page.viewed` event schema description.
 * Use them consistently across the app — do not invent new labels per page.
 */
export const PAGE_TYPE = {
  HOMEPAGE: "homepage",
  SEARCH_RESULTS: "search_results",
  VEHICLE_DETAIL: "vehicle_detail",
  COMPARISON: "comparison",
  SAVED_VEHICLES: "saved_vehicles",
  DEALER_PAGE: "dealer_page",
  LANDING: "landing",
  ACCOUNT: "account",
} as const;

export type PageType = (typeof PAGE_TYPE)[keyof typeof PAGE_TYPE];

/**
 * Resolve the canonical `pageType` value from a Next.js pathname string.
 *
 * Pattern matching is ordered from most-specific to least-specific.
 * Falls back to `"landing"` for any path that doesn't match a known segment.
 *
 * @param pathname - The value returned by `usePathname()` or `headers().get("x-pathname")`.
 *   Should be a bare path (no origin, no query string), e.g. `/search/abc-123/results`.
 */
export function resolvePageType(pathname: string): PageType {
  // Vehicle detail: /used-cars/details/...
  if (pathname.startsWith("/used-cars/details/")) {
    return PAGE_TYPE.VEHICLE_DETAIL;
  }

  // Search results: /search, /search/[id], /search/[id]/results
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return PAGE_TYPE.SEARCH_RESULTS;
  }

  // Comparison: /profile/comparison
  if (pathname === "/profile/comparison" || pathname.startsWith("/profile/comparison/")) {
    return PAGE_TYPE.COMPARISON;
  }

  // Saved vehicles / watchlist: /profile/watchlist
  if (pathname === "/profile/watchlist" || pathname.startsWith("/profile/watchlist/")) {
    return PAGE_TYPE.SAVED_VEHICLES;
  }

  // Dealer listings: /dealers
  if (pathname === "/dealers" || pathname.startsWith("/dealers/")) {
    return PAGE_TYPE.DEALER_PAGE;
  }

  // Account / profile root: /profile (catch-all for remaining /profile/* routes)
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return PAGE_TYPE.ACCOUNT;
  }

  // Homepage
  if (pathname === "/") {
    return PAGE_TYPE.HOMEPAGE;
  }

  // Everything else (/welcome-back, /about, /privacy, unknown routes)
  return PAGE_TYPE.LANDING;
}
