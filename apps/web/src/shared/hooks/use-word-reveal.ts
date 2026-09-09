"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const WORD_SPLIT_REGEX = /\s+/;

export interface WordSegment {
  globalIndex: number;
  separator: string;
  word: string;
}

/**
 * Parses text into a flat word list, assigning each word a stable global index.
 * Whitespace between words (including newlines) is stored in each word's `separator`
 * so the caller can render it verbatim inside a `whitespace-pre-line` container.
 */
function parseText(text: string): { totalWords: number; words: WordSegment[] } {
  const words: WordSegment[] = [];
  let globalIndex = 0;

  for (const token of text.trim().match(/\S+|\s+/g) ?? []) {
    if (WORD_SPLIT_REGEX.test(token)) {
      const last = words.at(-1);
      if (last) {
        last.separator += token;
      }
      continue;
    }

    words.push({ globalIndex, separator: "", word: token });
    globalIndex += 1;
  }

  return { words, totalWords: globalIndex };
}

export interface UseWordRevealOptions {
  /** Milliseconds between each word reveal. Defaults to 50. */
  intervalMs?: number;
  /** Called once when all words have been revealed. */
  onComplete?: () => void;
  /** The text to reveal. Newlines are preserved via each word segment separator. */
  text: string;
}

export interface UseWordRevealResult {
  /** Number of words that are currently visible (revealed so far). */
  visibleCount: number;
  /**
   * Flat list of word segments. Each word carries a stable `globalIndex` and
   * a `separator` string (spaces, newlines) that should be rendered after the
   * word so a `whitespace-pre-line` parent preserves line breaks.
   */
  words: WordSegment[];
}

/**
 * Drives a word-by-word text reveal animation.
 *
 * Returns the parsed word segments and the current `visibleCount` so the
 * caller can render each word's visibility state without duplicating logic.
 * Respects `prefers-reduced-motion` by jumping to fully visible immediately.
 */
export function useWordReveal({
  text,
  intervalMs = 50,
  onComplete,
}: UseWordRevealOptions): UseWordRevealResult {
  const { words, totalWords } = parseText(text);
  const prefersReducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(() => (prefersReducedMotion ? totalWords : 0));
  const [prevText, setPrevText] = useState(text);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  onCompleteRef.current = onComplete;

  // Render-time state reset when text changes — avoids an extra Effect round-trip.
  // React re-renders immediately with the reset state before painting.
  if (text !== prevText) {
    setPrevText(text);
    setVisibleCount(prefersReducedMotion ? totalWords : 0);
    completedRef.current = false;
  }

  useEffect(() => {
    // Reduced motion: jump to fully visible, then let the completion branch fire on the next run.
    if (prefersReducedMotion && visibleCount < totalWords) {
      setVisibleCount(totalWords);
      return;
    }

    // Animation complete (normal or reduced-motion second pass).
    if (visibleCount >= totalWords) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    // Reveal next word after interval.
    const id = window.setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 1, totalWords));
    }, intervalMs);

    return () => window.clearTimeout(id);
  }, [intervalMs, prefersReducedMotion, totalWords, visibleCount]);

  return { words, visibleCount };
}
