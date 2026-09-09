"use client";

import { useEffect, useState } from "react";
import { TYPEWRITER_CONFIG } from "../data/search-prompt";

/** Return type for the useTypewriterPlaceholder hook. */
export interface UseTypewriterPlaceholderReturn {
  /** The currently visible portion of the placeholder text. */
  displayText: string;
  /** Index of the active phrase in the placeholders array. */
  phraseIndex: number;
}

/**
 * Hook that types out placeholder texts with a typewriter effect, then cycles.
 *
 * Each phrase goes through a type → pause → delete cycle. The `cycleDuration`
 * parameter is a target minimum — actual cycle time may exceed it for longer
 * phrases due to minimum speed constraints (20ms/char typing, 10ms/char deleting)
 * and a minimum 500ms pause between phrases.
 *
 * @param placeholders - Array of strings to rotate through
 * @param cycleDuration - Target minimum time for one full phrase cycle in ms. Default: 5000
 */
export function useTypewriterPlaceholder(
  placeholders: string[],
  cycleDuration = 5000
): UseTypewriterPlaceholderReturn {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (placeholders.length === 0) {
      return;
    }

    const currentPhrase = placeholders[phraseIndex] ?? "";
    const phraseLength = currentPhrase.length;

    const typingSpeed = Math.max(
      TYPEWRITER_CONFIG.MIN_TYPING_SPEED_MS,
      Math.floor(
        (cycleDuration * TYPEWRITER_CONFIG.TYPING_DURATION_RATIO) / Math.max(phraseLength, 1)
      )
    );
    const deleteSpeed = Math.max(
      TYPEWRITER_CONFIG.MIN_DELETE_SPEED_MS,
      Math.floor(typingSpeed / 2)
    );
    const pauseDuration = Math.max(
      TYPEWRITER_CONFIG.MIN_PAUSE_DURATION_MS,
      cycleDuration - phraseLength * typingSpeed - phraseLength * deleteSpeed
    );

    if (!isDeleting && charIndex < phraseLength) {
      // Typing forward
      const timer = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    }

    if (!isDeleting && charIndex === phraseLength) {
      // Pause at end of phrase, then start deleting
      const timer = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timer);
    }

    if (isDeleting && charIndex > 0) {
      // Deleting
      const timer = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, deleteSpeed);
      return () => clearTimeout(timer);
    }

    if (isDeleting && charIndex === 0) {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % placeholders.length);
    }

    return;
  }, [placeholders, phraseIndex, charIndex, isDeleting, cycleDuration]);

  return { displayText, phraseIndex };
}
