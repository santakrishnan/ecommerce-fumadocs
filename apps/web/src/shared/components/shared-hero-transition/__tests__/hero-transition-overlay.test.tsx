/// <reference types="@testing-library/jest-dom" />
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { SharedHeroSnapshot } from "../config";

// Mock motion/react
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, onAnimationComplete, initial, animate, exit, style, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

// Mock context hook
vi.mock("../utils", () => ({
  useHeroTransitionContext: vi.fn(() => ({
    cardFadeDurationMs: 450,
    postFadePauseMs: 200,
    navigateTimeoutMs: 1800,
    expandDurationSec: 0.85,
    revealDurationSec: 0.55,
    cardDimensionTolerance: 10,
    expandEase: [0.25, 0.1, 0.25, 1] as const,
    revealEase: [0.4, 0, 0.2, 1] as const,
    destinationRoutePrefix: "/used-cars/details/",
    sourceRoutePrefix: "/search/",
    heroImageSrc: "/images/vdp/vdp-hero.png",
    overlayViewTransitionName: "hero-image",
    cardSelector: '[data-slot="card"]',
    snapshotStorageKey: "vdp_hero_snapshot",
    cardRectStorageKey: "vdp_card_rect",
    referrerStorageKey: "vdp_referrer_route",
  })),
}));

// Import after mocks
import { HeroTransitionOverlay } from "../hero-transition-overlay";

const createMockSnapshot = (overrides: Partial<SharedHeroSnapshot> = {}): SharedHeroSnapshot => ({
  alt: "Test Vehicle",
  cardElement: document.createElement("div"),
  href: "/used-cars/details/test",
  imageSrc: "/images/test-vehicle.jpg",
  rect: { top: 100, left: 200, width: 300, height: 400 },
  sourceElement: document.createElement("img"),
  viewport: { width: 1920, height: 1080 },
  ...overrides,
});

describe("HeroTransitionOverlay", () => {
  const mockHandlers = {
    onExpandComplete: vi.fn(),
    onRevealComplete: vi.fn(),
  };

  it("should not render overlay when snapshot is null", () => {
    const { container } = render(
      <HeroTransitionOverlay phase="idle" snapshot={null} {...mockHandlers} />
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it.each(["expanding", "navigating"] as const)("should render overlay for %s phase", (phase) => {
    const snapshot = createMockSnapshot();
    const { container } = render(
      <HeroTransitionOverlay phase={phase} snapshot={snapshot} {...mockHandlers} />
    );
    expect(container.querySelector('img[alt="Test Vehicle"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("should render image with correct attributes", () => {
    const snapshot = createMockSnapshot({
      alt: "Toyota Highlander",
      imageSrc: "/images/toyota-highlander.jpg",
      viewport: { width: 1280, height: 720 },
    });
    const { container } = render(
      <HeroTransitionOverlay phase="expanding" snapshot={snapshot} {...mockHandlers} />
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "Toyota Highlander");
    expect(img).toHaveAttribute("src", "/images/toyota-highlander.jpg");
    expect(img).toHaveAttribute("width", "1280");
    expect(img).toHaveAttribute("height", "720");
  });

  it.each([
    { width: 320, height: 640 },
    { width: 1920, height: 1080 },
  ])("should handle viewport dimensions $width x $height", ({ width, height }) => {
    const snapshot = createMockSnapshot({ viewport: { width, height } });
    const { container } = render(
      <HeroTransitionOverlay phase="expanding" snapshot={snapshot} {...mockHandlers} />
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("width", String(width));
    expect(img).toHaveAttribute("height", String(height));
  });
});
