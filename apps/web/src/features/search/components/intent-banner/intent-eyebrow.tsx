"use client";

import { Button } from "@ucmp/ui";
import { IconCaretDown } from "@ucmp/ui/icons";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "utils";

interface IntentEyebrowProps {
  /** Optional class names for the outer wrapper. */
  className?: string;
  /** Optional leading icon shown before the eyebrow text. */
  leadingIcon?: ReactNode;
  /** The intent text to display. */
  text: string;
}

/**
 * IntentEyebrow — single-line intent text that auto-truncates and exposes
 * a chevron toggle when (and only when) the text overflows its line.
 *
 * Detection runs against the collapsed (truncated) layout via:
 *   - a layout-effect measurement on mount and whenever `text` changes
 *   - a ResizeObserver on the text element to catch container resizes
 *   - a `document.fonts.ready` rerun so custom fonts that swap in after
 *     the initial paint are picked up (otherwise the first measurement
 *     uses the fallback font's narrower glyphs and can miss the overflow)
 *
 * Marked `"use client"` because it relies on layout measurement and local
 * state. Kept as a small leaf so the parent IntentBanner can stay a Server
 * Component.
 */
export function IntentEyebrow({ text, className, leadingIcon }: IntentEyebrowProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Always measure against the collapsed (truncated) layout. When expanded,
  // the text wraps and scrollWidth would equal clientWidth, which would
  // wrongly hide the chevron. We solve this by temporarily forcing the
  // truncate styles onto a clone of the element via inline styles for the
  // duration of measurement — but simpler: only re-measure while collapsed
  // and never clear isOverflowing while expanded.
  const measure = () => {
    const el = textRef.current;
    if (!el || isExpanded) {
      return;
    }
    // +1 px tolerance for sub-pixel rounding in some browsers/zoom levels
    setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
  };

  // Synchronous measurement on mount and whenever text or expansion flips
  // back to collapsed. Using useLayoutEffect to avoid a flash of "no chevron".
  useLayoutEffect(() => {
    measure();
  }, [isExpanded, text]);

  // Re-measure on resize and after web fonts finish loading.
  useEffect(() => {
    const el = textRef.current;
    if (!el) {
      return;
    }

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measure());
      observer.observe(el);
    }

    // document.fonts.ready resolves once all CSS-declared fonts have loaded.
    // Without this, the first measurement runs against the fallback font and
    // a longer-glyph custom font can cause overflow to be missed.
    let cancelled = false;
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    if (fonts && typeof fonts.ready?.then === "function") {
      fonts.ready.then(() => {
        if (!cancelled) {
          measure();
        }
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [isExpanded]);

  // Reset expanded state when the eyebrow text changes (follow-up search).
  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  return (
    <Button
      aria-expanded={isOverflowing ? isExpanded : undefined}
      className={cn(
        "items-start justify-start gap-1 rounded-md text-left",
        "text-text-tertiary-light hover:text-text-tertiary-dark disabled:text-text-tertiary-light aria-disabled:text-text-tertiary-light",
        className
      )}
      data-expanded={isExpanded ? "true" : "false"}
      data-overflow={isOverflowing ? "true" : "false"}
      data-testid="intent-banner-eyebrow"
      disabled={!isOverflowing}
      fullWidth
      onClick={() => isOverflowing && setIsExpanded((prev) => !prev)}
      variant="text"
    >
      {leadingIcon && (
        <span className="shrink-0 leading-none" data-testid="intent-banner-eyebrow-icon">
          {leadingIcon}
        </span>
      )}

      <span
        className={cn(
          "subhead-sm min-w-0 flex-1 text-text-tertiary",
          isExpanded ? "whitespace-normal" : "block truncate"
        )}
        ref={textRef}
      >
        {text}
      </span>

      {isOverflowing && (
        <IconCaretDown
          aria-hidden="true"
          className={cn("size-5 shrink-0 transition-transform", isExpanded && "rotate-180")}
          data-testid="intent-banner-eyebrow-toggle"
        />
      )}
    </Button>
  );
}
