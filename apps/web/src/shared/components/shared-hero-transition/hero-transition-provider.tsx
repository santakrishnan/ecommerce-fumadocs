"use client";

import { startViewTransitionIfAvailable } from "@shared/lib/view-transition";
import { useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_HERO_CONFIG,
  type HeroTransitionConfig,
  type SharedHeroPhase,
  type SharedHeroSnapshot,
  VDP_HERO_READY_ATTR,
  VIEW_TRANSITION_NAME_HERO,
  VIEW_TRANSITION_NAME_TITLE,
} from "./config";
import { HeroTransitionOverlay } from "./hero-transition-overlay";
import { buildSnapshot, findVdpAnchor, HeroTransitionContext } from "./utils";

interface HeroTransitionProviderProps {
  children: ReactNode;
  config?: Partial<HeroTransitionConfig>;
}

/**
 * Provider for the forward hero transition (search → VDP).
 *
 * Intercepts clicks on inventory card links targeting VDP routes, runs
 * a card-expand animation, then navigates. Backward (VDP → search)
 * transition is not implemented — back navigation goes directly to home.
 */
export function HeroTransitionProvider({
  children,
  config: customConfig,
}: HeroTransitionProviderProps) {
  const config: HeroTransitionConfig = { ...DEFAULT_HERO_CONFIG, ...customConfig };

  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const [snapshot, setSnapshot] = useState<SharedHeroSnapshot | null>(null);
  const [phase, setPhase] = useState<SharedHeroPhase>("idle");

  const targetPathnameRef = useRef<string | null>(null);
  const expansionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionActiveRef = useRef(false);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // No static prefetch needed — the overlay uses the card's already-loaded image.

  // Forward phase progression: detect when navigation completes and reveal VDP.
  // Waits for the real hero to mount (signalled via data-vdp-hero-ready) before
  // revealing, so the skeleton never flashes behind the overlay.
  // This loop polls indefinitely — the safety-net timeout (navigateTimeoutMs)
  // is the single authority that force-reveals if the network is too slow.
  useEffect(() => {
    if ((phase !== "navigating" && phase !== "view-transitioning") || !targetPathnameRef.current) {
      return;
    }

    const POLL_INTERVAL_MS = 50;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    function tryReveal() {
      const current = pathname?.split("?")[0]?.split("#")[0] ?? "";
      const target = targetPathnameRef.current?.split("?")[0]?.split("#")[0] ?? "";

      if (current !== target && !current.startsWith(target)) {
        // Pathname hasn't updated yet — keep polling.
        // The safety-net timeout will force-reveal if this takes too long.
        timerId = setTimeout(tryReveal, POLL_INTERVAL_MS);
        return;
      }

      // Pathname matches — now wait for the hero component to mount
      const heroReady = document.documentElement.hasAttribute(VDP_HERO_READY_ATTR);
      if (heroReady) {
        setPhase("revealing");
        targetPathnameRef.current = null;
      } else {
        // Hero not ready yet — keep polling until it is or safety net fires.
        timerId = setTimeout(tryReveal, POLL_INTERVAL_MS);
      }
    }

    // Start polling after a minimal initial delay
    timerId = setTimeout(tryReveal, POLL_INTERVAL_MS);

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [pathname, phase]);

  // Safety net: only force-reveal if the page is truly stuck (image error,
  // network failure). Set very high so users never see grey on slow networks.
  // Under normal conditions the polling loop will reveal as soon as the hero
  // image loads — this is purely a last-resort escape hatch.
  useEffect(() => {
    if (phase !== "navigating" && phase !== "view-transitioning") {
      return;
    }
    const id = setTimeout(() => {
      setPhase("revealing");
      targetPathnameRef.current = null;
    }, configRef.current.navigateTimeoutMs);
    return () => clearTimeout(id);
  }, [phase]);

  // Hide the original card image while the overlay covers it.
  useEffect(() => {
    if (
      !(snapshot && ["expanding", "navigating", "view-transitioning", "revealing"].includes(phase))
    ) {
      return;
    }
    const el = snapshot.sourceElement;
    const prev = el.style.visibility;
    el.style.visibility = "hidden";
    return () => {
      el.style.visibility = prev;
    };
  }, [phase, snapshot]);

  // Global click interception: starts forward transitions.
  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    /** Returns true if the click event should be ignored (modifier keys, non-primary button). */
    function isModifiedClick(event: MouseEvent): boolean {
      return (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      );
    }

    /** Returns true if the anchor is a valid in-app VDP link. */
    function isEligibleAnchor(anchor: HTMLAnchorElement): boolean {
      if (anchor.target && anchor.target !== "_self") {
        return false;
      }
      if (anchor.hasAttribute("download")) {
        return false;
      }
      return true;
    }

    /** Assigns collision-safe view-transition-name to the clicked card's image and title. */
    function assignTransitionNames(snap: SharedHeroSnapshot) {
      snap.sourceElement.style.viewTransitionName = VIEW_TRANSITION_NAME_HERO;
      const cardTitle = snap.cardElement.querySelector("h3");
      if (cardTitle instanceof HTMLElement) {
        cardTitle.style.viewTransitionName = VIEW_TRANSITION_NAME_TITLE;
      }
    }

    function onClick(event: MouseEvent) {
      if (isModifiedClick(event)) {
        return;
      }

      // Re-entrancy guard: ignore clicks while a transition is in progress.
      if (transitionActiveRef.current) {
        return;
      }

      const anchor = findVdpAnchor(event.target, configRef.current.destinationRoutePrefix);
      if (!(anchor && isEligibleAnchor(anchor))) {
        return;
      }
      const snap = buildSnapshot(anchor, configRef.current);
      if (!snap) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      transitionActiveRef.current = true;
      targetPathnameRef.current = snap.href;
      setSnapshot(snap);

      // Eagerly prefetch the VDP route as soon as the user clicks so the
      // server starts resolving data while the expand animation plays.
      // This significantly reduces perceived latency on slow networks.
      router.prefetch?.(snap.href);

      assignTransitionNames(snap);

      const cardElement = anchor.closest(configRef.current.cardSelector) as HTMLElement | null;
      if (cardElement) {
        cardElement.setAttribute("data-fading-out", "true");
      }

      const expansionDelay =
        configRef.current.cardFadeDurationMs + configRef.current.postFadePauseMs;

      if (expansionTimeoutRef.current) {
        clearTimeout(expansionTimeoutRef.current);
      }

      expansionTimeoutRef.current = setTimeout(() => {
        setPhase("expanding");
        expansionTimeoutRef.current = null;
      }, expansionDelay);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      if (expansionTimeoutRef.current) {
        clearTimeout(expansionTimeoutRef.current);
        expansionTimeoutRef.current = null;
      }
    };
  }, [prefersReducedMotion]);

  function handleExpandComplete() {
    if (phase !== "expanding" || !snapshot) {
      return;
    }
    const href = targetPathnameRef.current;
    if (!href) {
      return;
    }

    // Store the current page as the VDP referrer so the VDP back button
    // can show "Back to Search" when navigating from a search page.
    try {
      sessionStorage.setItem(config.referrerStorageKey, window.location.pathname);
    } catch {
      // sessionStorage unavailable
    }

    if ("startViewTransition" in document) {
      setPhase("view-transitioning");
      startViewTransitionIfAvailable(() => {
        router.push(href);
      });
    } else {
      setPhase("navigating");
      router.push(href);
    }
  }

  function handleRevealComplete() {
    snapshot?.cardElement?.removeAttribute("data-fading-out");
    // Clean up dynamically assigned view-transition-names
    if (snapshot?.sourceElement) {
      snapshot.sourceElement.style.viewTransitionName = "";
    }
    if (snapshot?.cardElement) {
      const cardTitle = snapshot.cardElement.querySelector("h3");
      if (cardTitle instanceof HTMLElement) {
        cardTitle.style.viewTransitionName = "";
      }
    }
    transitionActiveRef.current = false;
    setPhase("idle");
    setSnapshot(null);
    targetPathnameRef.current = null;
    if (expansionTimeoutRef.current) {
      clearTimeout(expansionTimeoutRef.current);
      expansionTimeoutRef.current = null;
    }
  }

  return (
    <HeroTransitionContext value={config}>
      {children}
      <HeroTransitionOverlay
        onExpandComplete={handleExpandComplete}
        onRevealComplete={handleRevealComplete}
        phase={phase}
        snapshot={snapshot}
      />
    </HeroTransitionContext>
  );
}
