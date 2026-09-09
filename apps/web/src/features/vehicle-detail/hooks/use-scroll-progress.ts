"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseScrollProgressOptions {
  /** Breakpoint (px) that separates mobile from desktop. @default 1024 */
  breakpoint?: number;
  /** Scroll position (px) where the effect completes on desktop. @default 500 */
  endDesktop?: number;
  /** Scroll position (px) where the effect completes on mobile. @default 280 */
  endMobile?: number;
  /** Scroll position (px) where the effect begins. @default 0 */
  start?: number;
}

/**
 * Maps the current window scroll position to a 0–1 progress value.
 *
 * Returns 0 when scrollY <= start, 1 when scrollY >= end, and a linear
 * interpolation in between. Uses requestAnimationFrame for jank-free updates.
 *
 * Automatically selects the scroll threshold based on viewport width:
 * - Desktop (≥1024px): 0–500px
 * - Mobile (<1024px): 0–280px
 *
 * Respects `prefers-reduced-motion: reduce` — immediately returns 1 (fully
 * blurred state) without animating.
 */
export function useScrollProgress({
  start = 0,
  endDesktop = 500,
  endMobile = 280,
  breakpoint = 1024,
}: UseScrollProgressOptions = {}): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const getEnd = useCallback(
    () => (window.innerWidth >= breakpoint ? endDesktop : endMobile),
    [endDesktop, endMobile, breakpoint]
  );

  /** Safely compute progress, returning 1 if the range is zero or negative. */
  const computeProgress = useCallback(
    (scrollY: number, end: number) => {
      const range = end - start;
      if (range <= 0) {
        return 1;
      }
      return Math.min(1, Math.max(0, (scrollY - start) / range));
    },
    [start]
  );

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      const end = getEnd();
      setProgress(computeProgress(window.scrollY, end));
      rafRef.current = null;
    });
  }, [getEnd, computeProgress]);

  useEffect(() => {
    // Respect reduced motion preference — skip animation, show final state
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    // Set initial value based on current scroll position
    const end = getEnd();
    setProgress(computeProgress(window.scrollY, end));

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, start, getEnd]);

  return progress;
}
