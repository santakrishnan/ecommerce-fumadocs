/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusCardStickyCta } from "../status-card-sticky-cta";

type IntersectionCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observerCallback: IntersectionCallback;

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(cb: IntersectionCallback) {
    observerCallback = cb;
  }
  observe = mockObserve;
  unobserve = vi.fn();
  disconnect = mockDisconnect;
}

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

let mqMatches = true;
const mqChangeListeners = new Set<(e: MediaQueryListEvent) => void>();

function setupMatchMediaMock(initialMatches = true) {
  mqMatches = initialMatches;
  mqChangeListeners.clear();

  const mediaQueryList = {
    get matches() {
      return mqMatches;
    },
    media: "(max-width: 767px)",
    addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        mqChangeListeners.add(handler);
      }
    }),
    removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        mqChangeListeners.delete(handler);
      }
    }),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQueryList),
  });
}

function fireMqChange(matches: boolean) {
  mqMatches = matches;
  const event = { matches, media: "(max-width: 767px)" } as MediaQueryListEvent;
  for (const listener of mqChangeListeners) {
    listener(event);
  }
}

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
  setupMatchMediaMock(true);
});

function simulateScrolledPastDown(sentinel: HTMLElement) {
  vi.spyOn(sentinel, "getBoundingClientRect").mockReturnValue({
    top: -50,
    bottom: -1,
    left: 0,
    right: 375,
    width: 375,
    height: 50,
    x: 0,
    y: -50,
    toJSON: () => ({}),
  });
  act(() => {
    observerCallback([{ isIntersecting: false }]);
  });
}

function simulateBelowViewport(sentinel: HTMLElement) {
  vi.spyOn(sentinel, "getBoundingClientRect").mockReturnValue({
    top: 900,
    bottom: 950,
    left: 0,
    right: 375,
    width: 375,
    height: 50,
    x: 0,
    y: 900,
    toJSON: () => ({}),
  });
  act(() => {
    observerCallback([{ isIntersecting: false }]);
  });
}

function getStickyBar() {
  return document.querySelector('[data-testid="sold-card-cta-sticky"]') as HTMLElement;
}

describe("StatusCardStickyCta", () => {
  const DEFAULT_PROPS = {
    ariaLabel: "Search for vehicles similar to this 2023 Highlander Hybrid Limited",
    label: "Search similar to this",
    searchHref:
      "/search?make=Toyota&model=Highlander+Hybrid&trim=Limited&bodyStyle=SUV&yearMin=2021&yearMax=2025&year=2021-2025",
  };

  it("renders the inline CTA button", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    expect(screen.getByTestId("sold-card-cta-sentinel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DEFAULT_PROPS.ariaLabel })).toBeInTheDocument();
  });

  it("keeps the sticky bar hidden from assistive tech when CTA is in view", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(stickyBar).toHaveAttribute("inert", "");
  });

  it("shows the sticky bar when the user scrolls down past the CTA", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "false");
    expect(stickyBar).not.toHaveAttribute("inert");
    expect(stickyBar).toHaveClass("md:hidden");
  });

  it("does NOT activate the sticky bar when the CTA is below the viewport (not yet reached)", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateBelowViewport(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(stickyBar).toHaveAttribute("inert", "");
  });

  it("portals the sticky bar to document.body", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    expect(document.body.querySelector('[data-testid="sold-card-cta-sticky"]')).not.toBeNull();
  });

  it("hides the sticky bar when the CTA scrolls back into view", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "false");

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(stickyBar).toHaveAttribute("inert", "");
    expect(stickyBar?.className).toContain("opacity-0");
  });

  it("applies page grid margin padding to the sticky bar", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("px-(--page-grid-margin)");
  });

  it("accounts for iOS safe-area inset in bottom padding", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("pb-[calc(0.75rem+env(safe-area-inset-bottom))]");
  });

  it("marks the inline sentinel inert and aria-hidden when sticky bar is active", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    expect(sentinel).not.toHaveAttribute("inert");
    expect(sentinel).toHaveAttribute("aria-hidden", "false");

    simulateScrolledPastDown(sentinel);

    expect(sentinel).toHaveAttribute("inert", "");
    expect(sentinel).toHaveAttribute("aria-hidden", "true");
  });

  it("restores inline sentinel accessibility when sticky bar is dismissed", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(sentinel).not.toHaveAttribute("inert");
    expect(sentinel).toHaveAttribute("aria-hidden", "false");
  });

  it("applies fade-in transition classes when visible", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("opacity-100");
    expect(stickyBar?.className).toContain("duration-300");
    expect(stickyBar?.className).not.toContain("pointer-events-none");
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("does not set up the observer on md+ viewport", () => {
    setupMatchMediaMock(false);
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("resets sticky state and disconnects the observer when viewport resizes to md+", () => {
    render(<StatusCardStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("sold-card-cta-sentinel");
    simulateScrolledPastDown(sentinel);
    expect(getStickyBar()).toHaveAttribute("aria-hidden", "false");

    act(() => {
      fireMqChange(false);
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(getStickyBar()).toHaveAttribute("aria-hidden", "true");
    expect(getStickyBar()).toHaveAttribute("inert", "");
    expect(sentinel).toHaveAttribute("aria-hidden", "false");
    expect(sentinel).not.toHaveAttribute("inert");
  });
});
