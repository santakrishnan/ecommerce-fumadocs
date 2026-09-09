"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { ExpandOverlayPhase, ExpandOverlayRect } from "./use-expand-overlay";

export interface ExpandOverlayProps {
  /** Duration (ms) for expand/collapse motion. Default: 500 */
  animationDuration?: number;
  /** Accessible label for the dialog */
  ariaLabel: string;
  /**
   * Background layer rendered immediately during the expand animation.
   * This is what gives the "card zooming out" visual. Stays visible throughout
   * the entire lifecycle (expand → open → collapse).
   */
  background?: ReactNode;
  /** Content rendered inside the overlay once fully expanded (fades in/out) */
  children: ReactNode;
  /** Duration (ms) for the content fade in/out. Default: 300 */
  contentFadeDuration?: number;
  /** Whether the children should be visible (fading in/out) */
  contentVisible: boolean;
  /** Called when the collapse animation finishes (triggers unmount) */
  onCollapseEnd: () => void;
  /** Called when the user presses Escape or the close button */
  onRequestClose: () => void;
  /** Current animation phase */
  phase: ExpandOverlayPhase;
  /** The rect the overlay animates from/to */
  sourceRect: ExpandOverlayRect;
}

const EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];

/**
 * ExpandOverlay — a generic fullscreen overlay that expands from a source element
 * and collapses back to it on close.
 *
 * This component handles:
 * - Portal rendering to `document.body`
 * - Framer Motion layout animation (expand/collapse)
 * - Body scroll locking
 * - Escape key handling
 * - Content fade-in/out
 *
 * The visual content (background, header, close button) is passed as `children`.
 *
 * NOTE: Focus management is the consumer's responsibility. The overlay does not
 * render a close button — your `children` should include one and focus it when
 * `contentVisible` becomes true (e.g. via `autoFocus` or a ref + useEffect).
 */
export function ExpandOverlay({
  animationDuration = 500,
  ariaLabel,
  background,
  children,
  contentFadeDuration = 300,
  contentVisible,
  onCollapseEnd,
  onRequestClose,
  phase,
  sourceRect,
}: ExpandOverlayProps) {
  const isCollapsing = phase === "collapsing";
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture the previously focused element so we can restore it on close
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      // Restore focus to the trigger when the overlay unmounts
      previousFocusRef.current?.focus();
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Mark the rest of the page inert so assistive tech can't reach background content
  useEffect(() => {
    const root = document.getElementById("__next") ?? document.body.firstElementChild;
    if (!(root instanceof HTMLElement)) {
      return;
    }
    root.inert = true;
    return () => {
      root.inert = false;
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onRequestClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRequestClose]);

  // Focus trap — keep Tab/Shift+Tab within the overlay
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !overlayRef.current) {
        return;
      }

      const focusableElements = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements.at(-1);

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (isCollapsing) {
      onCollapseEnd();
    }
  }, [isCollapsing, onCollapseEnd]);

  const containerAnimate = isCollapsing
    ? {
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        borderRadius: sourceRect.borderRadius,
      }
    : { top: 0, left: 0, width: "100vw", height: "100vh", borderRadius: 0 };

  return createPortal(
    <motion.div
      animate={containerAnimate}
      aria-label={ariaLabel}
      aria-modal="true"
      className="fixed z-50 overflow-hidden"
      initial={{
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        borderRadius: sourceRect.borderRadius,
      }}
      onAnimationComplete={handleAnimationComplete}
      ref={overlayRef}
      role="dialog"
      transition={{ duration: animationDuration / 1000, ease: EASING }}
    >
      {/* Background layer — always visible, gives the "zoom" visual during expand/collapse */}
      {background}

      {/* Content wrapper — fades in after expand, fades out on close */}
      <motion.div
        animate={{ opacity: contentVisible ? 1 : 0 }}
        className="relative h-full w-full"
        initial={{ opacity: 0 }}
        transition={{ duration: contentFadeDuration / 1000, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}
