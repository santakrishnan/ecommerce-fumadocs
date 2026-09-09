import { render, screen } from "@ucmp/vitest-config/test-utils";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useBackHref } from "~/shared/hooks/use-back-href";
import {
  navigationBarCompare,
  navigationBarCustomClass,
  navigationBarDefault,
  navigationBarSearch,
  navigationBarSearchResults,
} from "../__fixtures__/navigation-bar";
import { NavigationBar } from "../navigation-bar";

// Override the global plain-function mock with a vi.fn() so individual tests
// can control the pathname via mockReturnValueOnce.
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock useBackHref hook so tests control the entry route without touching sessionStorage.
vi.mock("~/shared/hooks/use-back-href", () => ({
  useBackHref: vi.fn().mockReturnValue("/"),
}));

// Mock auth provider — GuardedLink calls requestAuth.
vi.mock("@features/auth/auth-provider", () => ({
  useAuthContext: vi.fn().mockReturnValue({
    requestAuth: vi.fn(),
  }),
}));

// Mock skip-auth config — GuardedLink reads the cookie name.
vi.mock("@config/skip-auth", () => ({
  SKIP_AUTH_COOKIE: "demo-skip-auth",
}));

// ─── label patterns ───────────────────────────────────────────────────────────
const HOME = /home/i;
const SEARCH = /^search$/i;
const PROFILE = /profile/i;
const BACK_TO_HOME = /back to home/i;
const BACK_TO_SEARCH = /back to search/i;
const BACK_TO_PROFILE = /back to profile/i;
const WATCHLIST = /watchlist/i;
const SAVED = /saved/i;

// ─── default variant ──────────────────────────────────────────────────────────

describe("NavigationBar — default variant", () => {
  it("renders Home, Search, and Profile buttons", () => {
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: HOME })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SEARCH })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PROFILE })).toBeInTheDocument();
  });

  it("navigation items point to correct routes via href", () => {
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: HOME })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: SEARCH })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("button", { name: PROFILE })).toHaveAttribute("href", "/profile");
  });

  it("marks Home as active on '/'", () => {
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: HOME })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: SEARCH })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: PROFILE })).not.toHaveAttribute("aria-current");
  });

  it("marks Search as active on '/search'", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: SEARCH })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: HOME })).not.toHaveAttribute("aria-current");
  });

  it("marks Search as active on '/search/123'", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123");
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: SEARCH })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: HOME })).not.toHaveAttribute("aria-current");
  });

  it("marks Profile as active on '/profile'", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/profile");
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.getByRole("button", { name: PROFILE })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: HOME })).not.toHaveAttribute("aria-current");
  });

  it("renders icons as decorative (aria-hidden)", () => {
    render(<NavigationBar {...navigationBarDefault} />);
    for (const name of [HOME, SEARCH, PROFILE]) {
      const svg = screen.getByRole("button", { name }).querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("does not render Watchlist/Saved nav item", () => {
    render(<NavigationBar {...navigationBarDefault} />);
    expect(screen.queryByRole("button", { name: WATCHLIST })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SAVED })).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<NavigationBar {...navigationBarCustomClass} />);
    expect(container.firstChild).toHaveClass("w-full");
  });
});

// ─── search variant ───────────────────────────────────────────────────────────

describe("NavigationBar — search variant", () => {
  it("renders a single 'Back to Home' button", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SEARCH })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: PROFILE })).not.toBeInTheDocument();
  });

  it("does not render a ButtonGroup", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    const { container } = render(<NavigationBar {...navigationBarSearch} />);
    expect(container.querySelector("[data-slot='button-group']")).not.toBeInTheDocument();
  });

  it("Back to Home defaults to '/' when no entry context is stored", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toHaveAttribute("href", "/");
  });

  it("Back to Home returns to '/' when entry context is '/'", () => {
    vi.mocked(useBackHref).mockReturnValueOnce("/");
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toHaveAttribute("href", "/");
  });

  it("Back to Home returns to '/welcome-back' when entry context is '/welcome-back'", () => {
    vi.mocked(useBackHref).mockReturnValueOnce("/welcome-back");
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toHaveAttribute(
      "href",
      "/welcome-back"
    );
  });

  it("Back to Home returns to '/welcome-back' on nested search routes (/search/123)", () => {
    vi.mocked(useBackHref).mockReturnValueOnce("/welcome-back");
    vi.mocked(usePathname).mockReturnValueOnce("/search/123");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toHaveAttribute(
      "href",
      "/welcome-back"
    );
  });

  it("renders caret and home icons as decorative (aria-hidden)", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    const svgs = screen.getByRole("button", { name: BACK_TO_HOME }).querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("does not render visible text inside the button", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_HOME })).toHaveTextContent("");
  });

  it("auto-detects searchResults on '/search/{id}/results' and shows 'Back to Search'", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    render(<NavigationBar {...navigationBarSearch} />);
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toHaveAttribute(
      "href",
      "/search/123"
    );
    expect(screen.queryByRole("button", { name: BACK_TO_HOME })).not.toBeInTheDocument();
  });
});

// ─── searchResults variant ────────────────────────────────────────────────────

describe("NavigationBar — searchResults variant", () => {
  it("renders a single 'Back to Search' button", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    render(<NavigationBar {...navigationBarSearchResults} />);
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SEARCH })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: PROFILE })).not.toBeInTheDocument();
  });

  it("does not render a ButtonGroup", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    const { container } = render(<NavigationBar {...navigationBarSearchResults} />);
    expect(container.querySelector("[data-slot='button-group']")).not.toBeInTheDocument();
  });

  it("Back to Search navigates to the parent conversation route", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    render(<NavigationBar {...navigationBarSearchResults} />);
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toHaveAttribute(
      "href",
      "/search/123"
    );
  });

  it("Back to Search uses a different conversation id from the pathname", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/abc-456/results");
    render(<NavigationBar {...navigationBarSearchResults} />);
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toHaveAttribute(
      "href",
      "/search/abc-456"
    );
  });

  it("renders caret and search icons as decorative (aria-hidden)", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    render(<NavigationBar {...navigationBarSearchResults} />);
    const svgs = screen.getByRole("button", { name: BACK_TO_SEARCH }).querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("does not render visible text inside the button", () => {
    vi.mocked(usePathname).mockReturnValueOnce("/search/123/results");
    render(<NavigationBar {...navigationBarSearchResults} />);
    expect(screen.getByRole("button", { name: BACK_TO_SEARCH })).toHaveTextContent("");
  });
});

// ─── compare variant ──────────────────────────────────────────────────────────

describe("NavigationBar — compare variant", () => {
  it("renders a single 'Back to Profile' button linking to /profile", () => {
    render(<NavigationBar {...navigationBarCompare} />);
    expect(screen.getByRole("button", { name: BACK_TO_PROFILE })).toHaveAttribute(
      "href",
      "/profile"
    );
  });
});
