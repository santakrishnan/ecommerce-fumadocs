"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

export type ExpandOverlayPhase = "closed" | "expanding" | "open" | "closing" | "collapsing";

export interface ExpandOverlayRect {
  borderRadius: number;
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface UseExpandOverlayOptions {
  /** Duration (ms) for the expand/collapse motion. Default: 500 */
  animationDuration?: number;
  /** Duration (ms) for content fade-in after expand completes. Default: 300 */
  contentFadeDuration?: number;
  /** Called when the overlay fully closes */
  onClosed?: () => void;
}

export interface UseExpandOverlayReturn {
  /** Close the overlay (triggers closing → collapsing → closed) */
  close: () => void;
  /** Whether the content inside the overlay should be visible */
  contentVisible: boolean;
  /** Whether the overlay container is rendered in the DOM */
  isMounted: boolean;
  /** Call when the collapse animation finishes (from onAnimationComplete) */
  onCollapseEnd: () => void;
  /** Open the overlay from the anchor element */
  open: () => void;
  /** Current animation phase */
  phase: ExpandOverlayPhase;
  /** The rect the overlay animates from/to (snapshot of anchor at open time) */
  sourceRect: ExpandOverlayRect;
}

const DEFAULT_ANIMATION_DURATION = 500;
const DEFAULT_CONTENT_FADE_DURATION = 300;

/**
 * Encapsulates the expand-from-card / collapse-to-card overlay animation logic.
 *
 * Attach `anchorRef` to the trigger element. Call `open()` to expand and `close()` to collapse.
 *
 * Phases:
 * - closed: nothing rendered
 * - expanding: container animating from anchor rect → fullscreen
 * - open: fully expanded, content visible
 * - closing: content fading out
 * - collapsing: container animating from fullscreen → anchor rect
 *
 * Usage:
 * ```tsx
 * const cardRef = useRef<HTMLDivElement>(null);
 * const overlay = useExpandOverlay(cardRef, { onClosed: resetState });
 *
 * // In JSX:
 * <div ref={cardRef}>…trigger…</div>
 * {overlay.isMounted && (
 *   <ExpandOverlay
 *     ariaLabel="My overlay"
 *     contentVisible={overlay.contentVisible}
 *     onCollapseEnd={overlay.onCollapseEnd}
 *     onRequestClose={overlay.close}
 *     phase={overlay.phase}
 *     sourceRect={overlay.sourceRect}
 *   >
 *     ...your overlay content and close button...
 *   </ExpandOverlay>
 * )}
 * ```
 */
export function useExpandOverlay(
  anchorRef: React.RefObject<HTMLElement | null>,
  options: UseExpandOverlayOptions = {}
): UseExpandOverlayReturn {
  const {
    animationDuration = DEFAULT_ANIMATION_DURATION,
    contentFadeDuration = DEFAULT_CONTENT_FADE_DURATION,
    onClosed,
  } = options;

  const [phase, setPhase] = useState<ExpandOverlayPhase>("closed");
  const [sourceRect, setSourceRect] = useState<ExpandOverlayRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderRadius: 16,
  });

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }

  const forceResetIfOpen = useEffectEvent(() => {
    if (phase !== "closed") {
      clearTimers();
      setPhase("closed");
      onClosed?.();
    }
  });

  // Clean up pending timers and reset on any teardown of this instance
  // (unmount or Router Cache deactivation), not just a real navigation event.
  useEffect(() => () => forceResetIfOpen(), []);

  // Fallback for navigation paths the teardown reset above doesn't cover.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        forceResetIfOpen();
      }
    }
    window.addEventListener("popstate", forceResetIfOpen);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", forceResetIfOpen);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const open = useCallback(() => {
    // Guard: only allow opening from the closed state to prevent double-triggers
    if (phase !== "closed") {
      return;
    }

    // Clear any stale timer IDs from previous open/close cycles
    clearTimers();

    // Snapshot the anchor element's position at the moment of opening.
    // This ensures the animation origin stays correct even if the page has scrolled.
    const el = anchorRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setSourceRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 16,
      });
    } else {
      setSourceRect({
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        borderRadius: 0,
      });
    }

    setPhase("expanding");

    // Transition to "open" slightly after the CSS animation duration to ensure
    // the motion.div has finished its expand before we fade in content.
    const t = setTimeout(() => {
      setPhase("open");
    }, animationDuration + 50);
    timersRef.current.push(t);
  }, [phase, anchorRef, animationDuration]);

  const close = useCallback(() => {
    // Allow closing from expanding (Escape during animation) or open state
    if (phase !== "open" && phase !== "expanding") {
      return;
    }

    // Cancel any in-flight timers (e.g. the open() timer that would flip to "open")
    clearTimers();

    if (phase === "expanding") {
      // Skip the fade-out since content isn't visible yet — go straight to collapse
      setPhase("collapsing");
      return;
    }

    // Normal close from open: fade out content, then collapse
    setPhase("closing");

    const t = setTimeout(() => {
      setPhase("collapsing");
    }, contentFadeDuration);
    timersRef.current.push(t);
  }, [phase, contentFadeDuration]);

  // Called by the ExpandOverlay component when the collapse animation completes
  const onCollapseEnd = useCallback(() => {
    if (phase === "collapsing") {
      setPhase("closed");
      onClosed?.();
    }
  }, [phase, onClosed]);

  const isMounted = phase !== "closed";
  const contentVisible = phase === "open";

  return {
    close,
    contentVisible,
    isMounted,
    onCollapseEnd,
    open,
    phase,
    sourceRect,
  };
}
