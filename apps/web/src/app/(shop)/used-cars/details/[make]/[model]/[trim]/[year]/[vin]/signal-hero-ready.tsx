"use client";

import { useEffect } from "react";

/**
 * Signals hero-transition readiness on mount so the shared-hero-transition
 * overlay fades away when the not-found page renders after a client navigation.
 *
 * Without this, the overlay polls indefinitely for `data-vdp-hero-ready`
 * (normally set by HeroBackground on image load) and stays stuck on screen
 * until the safety-net timeout fires — leaving users staring at the card image.
 */
const HERO_READY_ATTR = "data-vdp-hero-ready";

export function SignalHeroReady() {
  useEffect(() => {
    document.documentElement.setAttribute(HERO_READY_ATTR, "true");
    return () => {
      document.documentElement.removeAttribute(HERO_READY_ATTR);
    };
  }, []);

  return null;
}
