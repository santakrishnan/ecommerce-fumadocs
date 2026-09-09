"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const DURATION_MS = 300;

/**
 * Subscribes to the prefers-reduced-motion media query reactively.
 * Re-evaluates when the user toggles the OS setting.
 */
const reducedMotionQuery =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

function subscribeToReducedMotion(callback: () => void) {
  reducedMotionQuery?.addEventListener("change", callback);
  return () => reducedMotionQuery?.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return reducedMotionQuery?.matches ?? false;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Animates a numeric value from its previous value to the target.
 * Respects `prefers-reduced-motion` reactively — if toggled mid-session,
 * behaviour updates immediately without remount.
 *
 * @param target - The current target value to animate toward
 * @returns The current displayed (animating) value
 */
export function useAnimatedValue(target: number): number {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const [displayed, setDisplayed] = useState(target);
  // Mirrors `displayed` so a new animation can pick up from the current visual
  // value when `target` changes mid-flight, instead of jumping to the previous target.
  const displayedRef = useRef(target);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(target);
      displayedRef.current = target;
      return;
    }

    const from = displayedRef.current;
    const to = target;

    if (from === to) {
      return;
    }

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      // Ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);
      displayedRef.current = current;

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [target, prefersReducedMotion]);

  return displayed;
}
