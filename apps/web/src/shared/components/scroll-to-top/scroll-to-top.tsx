"use client";

import { useLayoutEffect } from "react";

/**
 * Forces scroll position to the top on mount.
 *
 * Disables browser-native scroll restoration (`history.scrollRestoration`)
 * so bfcache and future browser behaviour can't race against the reset.
 * Uses `useLayoutEffect` for synchronous execution before paint, plus a
 * `requestAnimationFrame` pass for View Transition / streaming layout shifts.
 *
 * Place outside <Suspense> in a page to run immediately on navigation.
 */
export function ScrollToTop() {
  useLayoutEffect(() => {
    // Disable browser scroll restoration for this navigation entry
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";

    // Synchronous reset before paint
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;

    // Post-paint reset — catches View Transition or streaming layout shifts
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    return () => {
      cancelAnimationFrame(raf);
      // Restore previous scroll restoration mode so other pages aren't affected
      history.scrollRestoration = prev;
    };
  }, []);

  return null;
}
