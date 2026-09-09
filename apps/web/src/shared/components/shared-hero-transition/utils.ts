"use client";

import { createContext, use } from "react";
import { DEFAULT_HERO_CONFIG, type HeroTransitionConfig, type SharedHeroSnapshot } from "./config";

// ── Context ─────────────────────────────────────────────────────────────────

export const HeroTransitionContext = createContext<HeroTransitionConfig>(DEFAULT_HERO_CONFIG);

/**
 * Access the hero transition configuration from context.
 * Falls back to default config if the provider is not present.
 */
export function useHeroTransitionContext(): HeroTransitionConfig {
  return use(HeroTransitionContext) ?? DEFAULT_HERO_CONFIG;
}

// ── Snapshot Builders ────────────────────────────────────────────────────────

/**
 * Find an anchor ancestor whose href targets the destination route prefix.
 */
export function findVdpAnchor(
  target: EventTarget | null,
  routePrefix: string
): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return null;
  }
  return anchor.getAttribute("href")?.startsWith(routePrefix) ? anchor : null;
}

/**
 * Build a `SharedHeroSnapshot` from a destination-bound anchor.
 * Pure builder — no side effects. Storage writes happen in handleExpandComplete.
 */
export function buildSnapshot(
  anchor: HTMLAnchorElement,
  config: HeroTransitionConfig
): SharedHeroSnapshot | null {
  const cardRoot = anchor.closest(config.cardSelector);
  if (!(cardRoot instanceof HTMLElement)) {
    return null;
  }
  const img = cardRoot.querySelector("img");
  if (!(img instanceof HTMLImageElement)) {
    return null;
  }
  const rect = img.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }
  const href = anchor.getAttribute("href");
  if (!href) {
    return null;
  }

  return {
    alt: img.alt || "",
    cardElement: cardRoot,
    href,
    imageSrc: img.currentSrc || img.src,
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    sourceElement: img,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}
