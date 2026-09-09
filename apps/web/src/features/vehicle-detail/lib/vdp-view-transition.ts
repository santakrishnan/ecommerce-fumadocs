import { flushSync } from "react-dom";

/**
 * Minimal typed interface for the View Transitions API.
 */
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
}

interface DocumentWithViewTransition {
  startViewTransition(callback: () => void): ViewTransition;
}

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/** CSS injected during modal transitions to freeze the root layer. */
const ROOT_FREEZE_CSS = [
  "::view-transition-group(root){animation-duration:0s!important;}",
  "::view-transition-old(root){animation:none!important;opacity:1!important;}",
  "::view-transition-new(root){animation:none!important;opacity:1!important;}",
  "::view-transition-image-pair(root){isolation:auto!important;mix-blend-mode:normal!important;}",
].join("");

/**
 * VDP-specific selectors for elements that have VIN-based viewTransitionName
 * values (set during card→VDP navigation). These must be temporarily suppressed
 * during modal transitions to prevent fixed-position compositing artifacts
 * at scrolled positions.
 */
const VDP_SUPPRESS_SELECTORS = [
  "[data-slot='hero-background'] [style*='view-transition-name']",
  "[data-column='right-rail'] [style*='view-transition-name']",
];

/** Guard against overlapping transitions corrupting restore state. */
let isTransitioning = false;

/**
 * Wraps a VDP state update in a View Transition so the browser morphs shared
 * elements (viewTransitionName) between old and new DOM snapshots.
 * Falls back to an instant update when the API is unavailable.
 *
 * Prevents background blink by:
 * 1. Keeping root captured (so the page stays visible as a backdrop)
 * 2. Injecting styles that freeze root animation (instant swap, no crossfade)
 * 3. Temporarily suppressing VDP hero/title viewTransitionNames to avoid
 *    compositing artifacts at scrolled positions
 */
export function withVdpViewTransition(update: () => void) {
  if (!supportsViewTransitions()) {
    update();
    return;
  }

  // Prevent double-fire: if a transition is already in progress, just run the update directly.
  if (isTransitioning) {
    update();
    return;
  }

  isTransitioning = true;

  // Inject root-freeze style before the transition captures snapshots.
  const style = document.createElement("style");
  style.setAttribute("data-vdp-modal-transition", "");
  style.textContent = ROOT_FREEZE_CSS;
  document.head.appendChild(style);

  // Suppress VDP elements with VIN-based viewTransitionNames.
  const suppressedElements: { el: HTMLElement; prev: string }[] = [];
  for (const selector of VDP_SUPPRESS_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      suppressedElements.push({ el, prev: el.style.viewTransitionName });
      el.style.viewTransitionName = "none";
    }
  }

  const transition = (document as unknown as DocumentWithViewTransition).startViewTransition(() => {
    flushSync(update);
  });

  // Restore everything after the transition completes (success or abort).
  transition.finished
    .catch(() => {
      /* transition aborted — no-op */
    })
    .finally(() => {
      style.remove();
      for (const { el, prev } of suppressedElements) {
        el.style.viewTransitionName = prev;
      }
      isTransitioning = false;
    });
}
