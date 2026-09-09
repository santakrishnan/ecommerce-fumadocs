// @vitest-environment node
import { PAGE_TYPE, resolvePageType } from "../page-types";

describe("resolvePageType", () => {
  describe("homepage", () => {
    it.each(["/"])("returns 'homepage' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.HOMEPAGE);
    });
  });

  describe("search_results", () => {
    it.each([
      "/search",
      "/search/",
      "/search/9d6d3f89-edc6-4cd2-8ba0-cfd48ce2fdfc",
      "/search/9d6d3f89-edc6-4cd2-8ba0-cfd48ce2fdfc/results",
    ])("returns 'search_results' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.SEARCH_RESULTS);
    });
  });

  describe("vehicle_detail", () => {
    it.each([
      "/used-cars/details/toyota/camry/le/2023/1HGBH41JXMN109186",
      "/used-cars/details/ford/f-150/-/2022/1FTFW1ET5DFC10312",
    ])("returns 'vehicle_detail' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.VEHICLE_DETAIL);
    });
  });

  describe("comparison", () => {
    it.each([
      "/profile/comparison",
      "/profile/comparison/",
      "/profile/comparison/abc",
    ])("returns 'comparison' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.COMPARISON);
    });
  });

  describe("saved_vehicles", () => {
    it.each([
      "/profile/watchlist",
      "/profile/watchlist/",
      "/profile/watchlist/abc",
    ])("returns 'saved_vehicles' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.SAVED_VEHICLES);
    });
  });

  describe("dealer_page", () => {
    it.each([
      "/dealers",
      "/dealers/",
      "/dealers/123",
      "/dealers/abc-motors/details",
    ])("returns 'dealer_page' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.DEALER_PAGE);
    });
  });

  describe("account", () => {
    it.each([
      "/profile",
      "/profile/",
      "/profile/settings",
      "/profile/orders",
    ])("returns 'account' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.ACCOUNT);
    });
  });

  describe("landing (fallback)", () => {
    it.each([
      "/welcome-back",
      "/about",
      "/privacy",
      "/purchase",
      "/purchase/1HGBH41JXMN109186",
      "/unknown-route",
      "/used-cars",
      "/used-cars/",
    ])("returns 'landing' for '%s'", (pathname) => {
      expect(resolvePageType(pathname)).toBe(PAGE_TYPE.LANDING);
    });
  });

  describe("near-prefix edge cases", () => {
    it.each([
      // /search prefix must not bleed into unrelated paths
      ["/searching", PAGE_TYPE.LANDING],
      ["/searchresults", PAGE_TYPE.LANDING],
      // /profile/ sub-paths that look like watchlist/comparison but are not
      ["/profile/watchlist-old", PAGE_TYPE.ACCOUNT],
      ["/profile/comparison-tool", PAGE_TYPE.ACCOUNT],
      ["/profile/watchlistfoo", PAGE_TYPE.ACCOUNT],
      // /dealers prefix must not bleed
      ["/dealership", PAGE_TYPE.LANDING],
      // /used-cars/details requires the full prefix
      ["/used-cars/", PAGE_TYPE.LANDING],
      ["/used-cars/dev-flags", PAGE_TYPE.LANDING],
    ] as const)("maps '%s' → '%s'", (pathname, expected) => {
      expect(resolvePageType(pathname)).toBe(expected);
    });
  });
});
