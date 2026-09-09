/// <reference types="@testing-library/jest-dom" />
import { act, render } from "@ucmp/vitest-config/test-utils";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  DEFAULT_HERO_CONFIG,
  VDP_HERO_READY_ATTR,
  VIEW_TRANSITION_NAME_HERO,
  VIEW_TRANSITION_NAME_TITLE,
} from "../config";
import { HeroTransitionProvider } from "../hero-transition-provider";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/search"),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

vi.mock("motion/react", () => ({
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useReducedMotion: vi.fn(() => false),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    // Fires `onAnimationComplete` on every render so the provider's phase
    // machine (expanding → navigating → revealing → idle) can be driven to
    // completion in tests without a real animation runtime.
    div: ({ children, onAnimationComplete, ...props }: any) => {
      useEffect(() => {
        onAnimationComplete?.();
      });
      return <div {...props}>{children}</div>;
    },
  },
}));

/**
 * Builds a fake card DOM subtree that matches the selectors used by
 * HeroTransitionProvider's click handler (findVdpAnchor + buildSnapshot).
 */
function createCardFixture(href: string) {
  const card = document.createElement("div");
  card.setAttribute("data-slot", "card");

  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  card.appendChild(anchor);

  const img = document.createElement("img");
  img.src = "https://cdn.example.com/car.jpg";
  img.alt = "2023 Highlander";
  // Give the image measurable dimensions for buildSnapshot's zero-size guard
  Object.defineProperty(img, "getBoundingClientRect", {
    value: () => ({ top: 100, left: 50, width: 400, height: 300, right: 450, bottom: 400 }),
  });
  card.appendChild(img);

  const title = document.createElement("h3");
  title.textContent = "HIGHLANDER";
  card.appendChild(title);

  return { card, anchor, img, title };
}

describe("Hero Transition — view-transition-name assignment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("assigns VIEW_TRANSITION_NAME_HERO to the clicked card image on click", () => {
    const { card, anchor, img } = createCardFixture(
      "/used-cars/details/toyota/highlander/xle/2023/ABC123"
    );

    const { container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    // Mount the card fixture inside the document (required for event delegation)
    document.body.appendChild(card);

    expect(img.style.viewTransitionName).toBe("");

    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: anchor });
      anchor.dispatchEvent(event);
    });

    expect(img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);

    document.body.removeChild(card);
    container.remove();
  });

  it("assigns VIEW_TRANSITION_NAME_TITLE to the clicked card h3 on click", () => {
    const { card, anchor, title } = createCardFixture(
      "/used-cars/details/toyota/highlander/xle/2023/ABC123"
    );

    const { container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    document.body.appendChild(card);

    expect(title.style.viewTransitionName).toBe("");

    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: anchor });
      anchor.dispatchEvent(event);
    });

    expect(title.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_TITLE);

    document.body.removeChild(card);
    container.remove();
  });

  it("blocks re-entrant clicks while a transition is in progress", () => {
    const card1 = createCardFixture("/used-cars/details/toyota/highlander/xle/2023/ABC123");
    const card2 = createCardFixture("/used-cars/details/toyota/camry/le/2022/DEF456");

    const { container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    document.body.appendChild(card1.card);
    document.body.appendChild(card2.card);

    // First click — should assign
    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: card1.anchor });
      card1.anchor.dispatchEvent(event);
    });

    expect(card1.img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);

    // Second click while first is in progress — should be ignored
    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: card2.anchor });
      card2.anchor.dispatchEvent(event);
    });

    // Second card should NOT have the name assigned
    expect(card2.img.style.viewTransitionName).toBe("");
    // First card should still have it
    expect(card1.img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);

    document.body.removeChild(card1.card);
    document.body.removeChild(card2.card);
    container.remove();
  });

  it("allows the same VIN card to be re-clicked and reassigned across repeated cycles after the transition completes", () => {
    const vinHref = "/used-cars/details/toyota/highlander/xle/2023/ABC123";

    const { container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    for (let cycle = 0; cycle < 3; cycle++) {
      // Simulate a fresh Search render each cycle — a new card fixture stands in
      // for the same VIN's card being re-rendered after returning from Search.
      const { card, anchor, img, title } = createCardFixture(vinHref);
      document.body.appendChild(card);

      expect(img.style.viewTransitionName).toBe("");

      act(() => {
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "target", { value: anchor });
        anchor.dispatchEvent(event);
      });

      // The same VIN reopens every cycle — the click is never silently ignored.
      expect(img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);
      expect(title.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_TITLE);

      // Drive expand → navigate → (safety-net) reveal → idle so the provider
      // fully resets, exactly as it would once the VDP mounts and cleans up.
      act(() => {
        vi.advanceTimersByTime(
          DEFAULT_HERO_CONFIG.cardFadeDurationMs + DEFAULT_HERO_CONFIG.postFadePauseMs
        );
      });
      expect(mockPush).toHaveBeenCalledWith(vinHref);

      act(() => {
        vi.advanceTimersByTime(DEFAULT_HERO_CONFIG.navigateTimeoutMs);
      });

      // Cleanup (view-transition-name reset) happens on the reveal target,
      // which is this cycle's card image/title — confirms the provider reset
      // rather than leaving a stale re-entrancy guard for the next cycle.
      expect(img.style.viewTransitionName).toBe("");
      expect(title.style.viewTransitionName).toBe("");

      document.body.removeChild(card);
    }

    // Three independent open cycles for the same VIN — none were dropped.
    expect(mockPush).toHaveBeenCalledTimes(3);

    container.remove();
  });

  it("resets the re-entrancy guard after a completed cycle so a different VIN can open next", () => {
    const cardA = createCardFixture("/used-cars/details/toyota/highlander/xle/2023/ABC123");
    const cardB = createCardFixture("/used-cars/details/toyota/camry/le/2022/DEF456");

    const { container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    document.body.appendChild(cardA.card);
    document.body.appendChild(cardB.card);

    // Complete a full cycle for card A.
    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: cardA.anchor });
      cardA.anchor.dispatchEvent(event);
    });
    expect(cardA.img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);

    act(() => {
      vi.advanceTimersByTime(
        DEFAULT_HERO_CONFIG.cardFadeDurationMs + DEFAULT_HERO_CONFIG.postFadePauseMs
      );
    });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_HERO_CONFIG.navigateTimeoutMs);
    });
    expect(cardA.img.style.viewTransitionName).toBe("");

    // A different VIN's card can now open normally — no regression from the
    // repeated same-VIN fix.
    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: cardB.anchor });
      cardB.anchor.dispatchEvent(event);
    });
    expect(cardB.img.style.viewTransitionName).toBe(VIEW_TRANSITION_NAME_HERO);

    document.body.removeChild(cardA.card);
    document.body.removeChild(cardB.card);
    container.remove();
  });

  it("reveals the VDP as soon as the ready signal is set, without waiting for the safety-net timeout", () => {
    const vinHref = "/used-cars/details/toyota/highlander/xle/2023/ABC123";
    const { card, anchor, img, title } = createCardFixture(vinHref);
    document.body.appendChild(card);

    const { rerender, container } = render(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    act(() => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: anchor });
      anchor.dispatchEvent(event);
    });

    act(() => {
      vi.advanceTimersByTime(
        DEFAULT_HERO_CONFIG.cardFadeDurationMs + DEFAULT_HERO_CONFIG.postFadePauseMs
      );
    });
    expect(mockPush).toHaveBeenCalledWith(vinHref);

    // Simulate the router having navigated to the VDP and HeroBackground
    // having mounted with an already-cached hero image — i.e. the real
    // `data-vdp-hero-ready` signal, not the timeout escape hatch.
    (usePathname as unknown as Mock).mockReturnValue(vinHref);
    document.documentElement.setAttribute(VDP_HERO_READY_ATTR, "true");

    rerender(
      <HeroTransitionProvider>
        <div>children</div>
      </HeroTransitionProvider>
    );

    // Advance only past one poll tick (50ms) — far short of the 30s safety
    // net — to prove the reveal happens via the ready signal, not the timeout.
    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(img.style.viewTransitionName).toBe("");
    expect(title.style.viewTransitionName).toBe("");

    document.documentElement.removeAttribute(VDP_HERO_READY_ATTR);
    (usePathname as unknown as Mock).mockReturnValue("/search");
    document.body.removeChild(card);
    container.remove();
  });
});
