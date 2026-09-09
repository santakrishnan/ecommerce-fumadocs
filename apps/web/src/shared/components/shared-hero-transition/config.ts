/**
 * Storage keys for VDP navigation.
 */
export const VDP_REFERRER_KEY = "vdp_referrer_route";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Internal types for the shared hero transition.
 *
 * Behaviour:
 *   1. User clicks a card whose link targets the VDP route.
 *   2. The card's text/overlay content fades out (image stays put).
 *   3. The overlay mounts at the card image's rect, already showing the VDP
 *      hero, and grows to fill the viewport.
 *   4. `router.push` fires; the overlay sits on top while the VDP mounts.
 *   5. Once the URL matches, the overlay fades out to reveal the real VDP.
 */

export interface SharedHeroRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface SharedHeroSnapshot {
  /** Alt text for the overlay image (overlay is aria-hidden, so this is not exposed to assistive tech). */
  alt: string;
  /**
   * Reference to the card root (`[data-slot="card"]`). Used to fade the
   * card's text/overlay content before the grow begins.
   */
  cardElement: HTMLElement;
  /** Destination route the user is navigating to. */
  href: string;
  /**
   * The actual image URL captured from the card at click time.
   * Used by the overlay so the transition shows the real vehicle photo
   * rather than a generic placeholder.
   */
  imageSrc: string;
  /** Rect of the source image relative to the viewport at click time. */
  rect: SharedHeroRect;
  /**
   * Reference to the original card image. Hidden while the overlay is in
   * flight so the user never sees two copies on screen.
   */
  sourceElement: HTMLImageElement;
  /** Viewport dimensions captured at click time. */
  viewport: { width: number; height: number };
}

export type SharedHeroPhase =
  | "idle" // nothing happening
  | "expanding" // overlay growing from card rect → viewport
  | "navigating" // overlay covers viewport; router.push fired
  | "view-transitioning" // view transition API active, morphing overlay to VDP hero
  | "revealing" // VDP mounted, overlay fading out
  | "collapsing"; // reverse: overlay shrinking from viewport → card rect

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * Default configuration for hero transitions.
 * Override these values by passing custom config to SharedHeroTransitionProvider.
 */

export interface HeroTransitionConfig {
  /** Dimension tolerance for matching cards in reverse transition */
  cardDimensionTolerance: number;
  // ── Timing (in milliseconds) ────────────────────────────────────────────
  /** Card content fade duration */
  cardFadeDurationMs: number;
  /** Key for storing card rect during transition */
  cardRectStorageKey: string;

  // ── DOM selectors ───────────────────────────────────────────────────────
  /** Selector for card root elements */
  cardSelector: string;
  /** Border-radius (px) the overlay tweens to/from when collapsed to a card */
  collapsedBorderRadiusPx: number;

  // ── Route patterns ──────────────────────────────────────────────────────
  /** Destination route prefix (e.g., "/used-cars/details/") */
  destinationRoutePrefix: string;
  /** Overlay expand/collapse animation duration in seconds */
  expandDurationSec: number;

  // ── Easing curves (cubic-bezier) ────────────────────────────────────────
  /** Smooth expand/collapse easing */
  expandEase: readonly [number, number, number, number];

  // ── Asset URLs ──────────────────────────────────────────────────────────
  /** Hero image URL for the overlay */
  heroImageSrc: string;
  /** Safety net timeout for slow page loads */
  navigateTimeoutMs: number;
  /** Overlay View Transitions API name for morphing effect */
  overlayViewTransitionName: string;
  /** Pause after card fade before overlay starts expanding */
  postFadePauseMs: number;
  /** Key for storing referrer route for back navigation */
  referrerStorageKey: string;
  /** Reveal fade-out duration in seconds */
  revealDurationSec: number;
  /** Fade reveal easing */
  revealEase: readonly [number, number, number, number];

  // ── SessionStorage keys ─────────────────────────────────────────────────
  /** Key for storing snapshot during transition */
  snapshotStorageKey: string;
  /** Source route prefix (e.g., "/search/") */
  sourceRoutePrefix: string;
}

// ── Shared view-transition-name constants ────────────────────────────────────
// Only ONE element on a page may hold a given view-transition-name at any time.
// These are assigned dynamically at click time to the tapped card, then matched
// by the VDP hero/title so the browser morphs one into the other.
export const VIEW_TRANSITION_NAME_HERO = "vehicle-hero";
export const VIEW_TRANSITION_NAME_TITLE = "vehicle-title-hero";

// ── VDP hero readiness signal ────────────────────────────────────────────────
/** DOM attribute set on `<html>` by HeroBackground to signal the real hero is mounted. */
export const VDP_HERO_READY_ATTR = "data-vdp-hero-ready";

// ── Default VDP transition config ────────────────────────────────────────────
export const DEFAULT_HERO_CONFIG: HeroTransitionConfig = {
  cardFadeDurationMs: 450,
  postFadePauseMs: 200,
  navigateTimeoutMs: 30_000,
  expandDurationSec: 0.85,
  revealDurationSec: 0.55,
  cardDimensionTolerance: 10,
  collapsedBorderRadiusPx: 12,
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
} as const;
