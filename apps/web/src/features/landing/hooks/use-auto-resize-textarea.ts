"use client";

import type { RefObject } from "react";
import { useLayoutEffect, useRef, useState } from "react";

/** Height of the collapsed single-line textarea in pixels. */
const SINGLE_LINE_HEIGHT = 44;

/** Maximum height before the textarea scrolls instead of growing. */
const MAX_HEIGHT = 300;

/** scrollHeight above which the textarea is considered multiline (single-line + padding). */
const MULTILINE_THRESHOLD = SINGLE_LINE_HEIGHT + 6;

/**
 * Auto-resizes a textarea element to fit its content and reports
 * whether the content has grown beyond a single line.
 *
 * When `value` is empty the textarea resets to a fixed single-line height and exits multiline mode.
 * Growth is capped at {@link MAX_HEIGHT}px; beyond that the textarea scrolls.
 *
 * Multiline mode is sticky: once the content wraps (scrollHeight > MULTILINE_THRESHOLD),
 * it stays in multiline mode until the input is fully cleared. This minimizes layout shifts
 * as the user edits.
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
): { isMultiline: boolean } {
  const [isMultiline, setIsMultiline] = useState(false);
  const hasWrappedRef = useRef(false);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }

    // Empty input: reset to single-line and exit multiline mode
    if (!value.trim()) {
      textarea.style.height = `${SINGLE_LINE_HEIGHT}px`;
      textarea.style.overflowY = "hidden";
      hasWrappedRef.current = false;
      setIsMultiline(false);
      return;
    }

    // Temporarily zero out minHeight so scrollHeight reflects content only
    const prevMinHeight = textarea.style.minHeight;
    textarea.style.minHeight = "0px";
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.minHeight = prevMinHeight;

    textarea.style.height = `${Math.min(scrollHeight, MAX_HEIGHT)}px`;
    textarea.style.overflowY = scrollHeight > MAX_HEIGHT ? "auto" : "hidden";

    // Detect first wrap
    if (!hasWrappedRef.current && scrollHeight > MULTILINE_THRESHOLD) {
      hasWrappedRef.current = true;
      setIsMultiline(true);
    }
  }, [value]);

  return { isMultiline };
}
