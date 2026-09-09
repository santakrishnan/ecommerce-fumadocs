/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleDetailStickyCta } from "../vehicle-detail-sticky-cta";

// ─── IntersectionObserver Mock ────────────────────────────────────────────────

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

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulate: user scrolled DOWN past the CTA (sentinel is above viewport, rect.bottom <= 0). */
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

/** Simulate: CTA is below the viewport (page load, not yet scrolled to). */
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
  return document.querySelector('[data-testid="vehicle-detail-cta-sticky"]') as HTMLElement;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VehicleDetailStickyCta", () => {
  const DEFAULT_PROPS = {
    ariaLabel: "Get pre-approved for TOYOTA CAMRY XLE",
    label: "Get pre-approved",
  };

  it("renders the inline CTA button", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    expect(screen.getByTestId("vehicle-detail-cta-sentinel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DEFAULT_PROPS.ariaLabel })).toBeInTheDocument();
  });

  it("keeps the sticky bar hidden from assistive tech when CTA is in view", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(stickyBar).toHaveAttribute("inert", "");
  });

  it("shows the sticky bar when the user scrolls down past the CTA", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "false");
    expect(stickyBar).not.toHaveAttribute("inert");
    expect(stickyBar).toHaveClass("lg:hidden");
  });

  it("does NOT activate the sticky bar when the CTA is below the viewport (not yet reached)", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");
    simulateBelowViewport(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar).toHaveAttribute("aria-hidden", "true");
    expect(stickyBar).toHaveAttribute("inert", "");
  });

  it("portals the sticky bar to document.body", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    expect(document.body.querySelector('[data-testid="vehicle-detail-cta-sticky"]')).not.toBeNull();
  });

  it("hides the sticky bar when the CTA scrolls back into view", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");
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
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("px-(--page-grid-margin)");
  });

  it("accounts for iOS safe-area inset in bottom padding", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("pb-[calc(0.75rem+env(safe-area-inset-bottom))]");
  });

  it("marks the inline sentinel inert and aria-hidden when sticky bar is active", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");

    // Before scrolling past — inline CTA is accessible
    expect(sentinel).not.toHaveAttribute("inert");
    expect(sentinel).toHaveAttribute("aria-hidden", "false");

    simulateScrolledPastDown(sentinel);

    // After scrolling past — inline CTA is removed from a11y tree
    expect(sentinel).toHaveAttribute("inert", "");
    expect(sentinel).toHaveAttribute("aria-hidden", "true");
  });

  it("restores inline sentinel accessibility when sticky bar is dismissed", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    // Scroll back into view
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(sentinel).not.toHaveAttribute("inert");
    expect(sentinel).toHaveAttribute("aria-hidden", "false");
  });

  it("applies fade-in transition classes when visible", () => {
    render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    const sentinel = screen.getByTestId("vehicle-detail-cta-sentinel");
    simulateScrolledPastDown(sentinel);

    const stickyBar = getStickyBar();
    expect(stickyBar?.className).toContain("opacity-100");
    expect(stickyBar?.className).toContain("duration-300");
    expect(stickyBar?.className).not.toContain("pointer-events-none");
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<VehicleDetailStickyCta {...DEFAULT_PROPS} />);

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
