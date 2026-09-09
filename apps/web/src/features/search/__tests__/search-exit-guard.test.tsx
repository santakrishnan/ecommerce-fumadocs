/// <reference types="@testing-library/jest-dom" />
import { render } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

let mockPathname = "/search/abc-123";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Mock window.location — jsdom doesn't support real navigation. We keep search
// and hash mutable so tests can assert query/hash preservation.
const mockReplace = vi.fn();
let mockSearch = "";
let mockHash = "";

function setLocation(pathname: string, search = "", hash = "") {
  mockSearch = search;
  mockHash = hash;
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      origin: "https://example.com",
      pathname,
      get search() {
        return mockSearch;
      },
      get hash() {
        return mockHash;
      },
      replace: mockReplace,
    },
    writable: true,
    configurable: true,
  });
}

// ─── Navigation API test double ───────────────────────────────────────────────

type NavigateListener = (event: unknown) => void;

function installNavigationApi() {
  const listeners = new Set<NavigateListener>();
  const navigation = {
    addEventListener: (_type: string, listener: NavigateListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: NavigateListener) => {
      listeners.delete(listener);
    },
  };
  Object.defineProperty(window, "navigation", {
    value: navigation,
    writable: true,
    configurable: true,
  });

  // Helper to dispatch a synthetic navigate event.
  const dispatchNavigate = (navigationType: string, url: string) => {
    for (const listener of listeners) {
      listener({ navigationType, destination: { url } });
    }
  };

  return { dispatchNavigate };
}

function removeNavigationApi() {
  Object.defineProperty(window, "navigation", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

// ─── Import after mocks ─────────────────────────────────────────────────────

import { SearchExitGuard } from "../components/search-back-navigation-guard";

// ─── Navigation API path ──────────────────────────────────────────────────────

describe("SearchExitGuard — Navigation API", () => {
  let dispatchNavigate: (navigationType: string, url: string) => void;

  beforeEach(() => {
    mockPathname = "/search/abc-123";
    mockReplace.mockReset();
    setLocation("/search/abc-123");
    ({ dispatchNavigate } = installNavigationApi());
  });

  afterEach(() => {
    removeNavigationApi();
  });

  it("hard-reloads on back/forward from /search to /", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("traverse", "https://example.com/");

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("preserves query params and hash on the destination URL", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("traverse", "https://example.com/?utm_source=email#top");

    expect(mockReplace).toHaveBeenCalledWith("/?utm_source=email#top");
  });

  it("does NOT hard-reload on programmatic push navigations (logo, breadcrumb)", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("push", "https://example.com/");

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does NOT hard-reload on replace navigations", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("replace", "https://example.com/welcome-back");

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does NOT hard-reload when staying within /search", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("traverse", "https://example.com/search/def-456");

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does NOT hard-reload when forward-navigating to a VDP", () => {
    render(<SearchExitGuard />);

    dispatchNavigate("traverse", "https://example.com/used-cars/details/xyz");

    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ─── Fallback path (no Navigation API) ─────────────────────────────────────────

describe("SearchExitGuard — popstate fallback", () => {
  beforeEach(() => {
    mockPathname = "/search/abc-123";
    mockReplace.mockReset();
    setLocation("/search/abc-123");
    removeNavigationApi();
  });

  it("does not trigger hard navigation on initial mount within /search", () => {
    render(<SearchExitGuard />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("hard-reloads when a back/forward (popstate) leaves /search for /", () => {
    const { rerender } = render(<SearchExitGuard />);

    // Browser back fires popstate, then the pathname updates.
    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/";
    setLocation("/");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("preserves query params and hash in the fallback path", () => {
    const { rerender } = render(<SearchExitGuard />);

    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/";
    setLocation("/", "?utm_source=email", "#top");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledWith("/?utm_source=email#top");
  });

  it("does NOT hard-reload on a programmatic soft nav (no popstate) leaving /search", () => {
    const { rerender } = render(<SearchExitGuard />);

    // No popstate — this is a link click / router.push.
    mockPathname = "/";
    setLocation("/");
    rerender(<SearchExitGuard />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not trigger hard navigation when staying within /search routes", () => {
    const { rerender } = render(<SearchExitGuard />);

    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/search/def-456";
    setLocation("/search/def-456");
    rerender(<SearchExitGuard />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not hard-reload when forward-navigating to a VDP", () => {
    const { rerender } = render(<SearchExitGuard />);

    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/used-cars/details/xyz";
    setLocation("/used-cars/details/xyz");
    rerender(<SearchExitGuard />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not trigger hard navigation when navigating TO /search from home", () => {
    mockPathname = "/";
    setLocation("/");

    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  it("triggers hard navigation when transitioning from /search to / via back/forward", () => {
    const { rerender } = render(<SearchExitGuard />);

    // Simulate browser back: /search/abc-123 → /
    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/";
    setLocation("/");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("triggers hard navigation when transitioning from /search to /welcome-back", () => {
    const { rerender } = render(<SearchExitGuard />);

    // Simulate browser back: /search/abc-123 → /welcome-back
    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/welcome-back";
    setLocation("/welcome-back");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledWith("/welcome-back");
  });

  it("triggers hard navigation when transitioning from /search/[id]/results to /", () => {
    mockPathname = "/search/abc-123/results";
    setLocation("/search/abc-123/results");
    const { rerender } = render(<SearchExitGuard />);

    // Simulate browser back from results all the way to home
    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/";
    setLocation("/");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("does not trigger hard navigation when navigating TO /search from a non-search route", () => {
    // Start on home
    mockPathname = "/";
    const { rerender } = render(<SearchExitGuard />);

    // Navigate to search
    mockPathname = "/search/abc-123";
    setLocation("/search/abc-123");
    rerender(<SearchExitGuard />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not trigger hard navigation for non-search to non-search transitions", () => {
    // Start on home
    mockPathname = "/";
    const { rerender } = render(<SearchExitGuard />);

    // Navigate to profile
    mockPathname = "/profile";
    rerender(<SearchExitGuard />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("calls replace exactly once per exit transition (no double-fire)", () => {
    const { rerender } = render(<SearchExitGuard />);

    // First exit from search via back/forward
    window.dispatchEvent(new PopStateEvent("popstate"));
    mockPathname = "/";
    setLocation("/");
    rerender(<SearchExitGuard />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
