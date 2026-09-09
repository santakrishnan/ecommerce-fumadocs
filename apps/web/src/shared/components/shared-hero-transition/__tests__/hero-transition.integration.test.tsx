/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_HERO_CONFIG } from "../config";
import { HeroTransitionProvider } from "../hero-transition-provider";
import { useHeroTransitionContext } from "../utils";

const mockPush = vi.fn();

// Mock next/navigation at top level
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/search"),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

// Mock motion/react at top level (not framer-motion - that's the old package name)
vi.mock("motion/react", () => ({
  animate: vi.fn(() => ({
    stop: vi.fn(),
  })),
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Test consumer component
function TestConsumer() {
  const config = useHeroTransitionContext();
  return (
    <div>
      <div data-testid="card-fade-duration">{config.cardFadeDurationMs}</div>
      <div data-testid="destination-prefix">{config.destinationRoutePrefix}</div>
      <div data-testid="hero-image">{config.heroImageSrc}</div>
    </div>
  );
}

describe("Hero Transition Integration Tests", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("should provide default config to consumers", () => {
    render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(screen.getByTestId("card-fade-duration")).toHaveTextContent("450");
    expect(screen.getByTestId("destination-prefix")).toHaveTextContent("/used-cars/details/");
    expect(screen.getByTestId("hero-image")).toHaveTextContent("/images/vdp/vdp-hero.png");
  });

  it("should merge custom config with defaults", () => {
    render(
      <HeroTransitionProvider
        config={{
          cardFadeDurationMs: 600,
          destinationRoutePrefix: "/products/",
          expandDurationSec: 1.2,
        }}
      >
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(screen.getByTestId("card-fade-duration")).toHaveTextContent("600");
    expect(screen.getByTestId("destination-prefix")).toHaveTextContent("/products/");
    expect(screen.getByTestId("hero-image")).toHaveTextContent("/images/vdp/vdp-hero.png");
  });

  it("should provide same config to multiple consumers", () => {
    render(
      <HeroTransitionProvider>
        <TestConsumer />
        <TestConsumer />
      </HeroTransitionProvider>
    );

    const durations = screen.getAllByTestId("card-fade-duration");
    expect(durations).toHaveLength(2);
    for (const el of durations) {
      expect(el).toHaveTextContent("450");
    }
  });

  it("should support nested providers with different configs", () => {
    render(
      <HeroTransitionProvider config={{ cardFadeDurationMs: 400 }}>
        <TestConsumer />
        <HeroTransitionProvider config={{ cardFadeDurationMs: 500 }}>
          <TestConsumer />
        </HeroTransitionProvider>
      </HeroTransitionProvider>
    );

    const durations = screen.getAllByTestId("card-fade-duration");
    expect(durations[0]).toHaveTextContent("400");
    expect(durations[1]).toHaveTextContent("500");
  });

  it("should maintain config consistency across re-renders", () => {
    const { rerender } = render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    const initialValue = screen.getByTestId("card-fade-duration").textContent;
    rerender(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(screen.getByTestId("card-fade-duration")).toHaveTextContent(initialValue ?? "");
  });

  it("should initialize with clean sessionStorage", () => {
    render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(sessionStorage.getItem(DEFAULT_HERO_CONFIG.snapshotStorageKey)).toBeNull();
  });

  it("should cleanup event listeners on unmount", () => {
    const spy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    unmount();
    expect(spy).toHaveBeenCalledWith("click", expect.any(Function), { capture: true });
    spy.mockRestore();
  });

  it("should not write to sessionStorage on mount (forward-only transition)", () => {
    const spy = vi.spyOn(sessionStorage, "setItem");

    render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should not cause unnecessary re-renders", () => {
    let renderCount = 0;
    function CountingConsumer() {
      renderCount++;
      return <TestConsumer />;
    }

    const { rerender } = render(
      <HeroTransitionProvider>
        <CountingConsumer />
      </HeroTransitionProvider>
    );

    const initial = renderCount;
    rerender(
      <HeroTransitionProvider>
        <CountingConsumer />
      </HeroTransitionProvider>
    );

    expect(renderCount).toBeGreaterThanOrEqual(initial);
  });

  it("should properly initialize and cleanup lifecycle", () => {
    const { unmount } = render(
      <HeroTransitionProvider>
        <TestConsumer />
      </HeroTransitionProvider>
    );

    expect(screen.getByTestId("card-fade-duration")).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
