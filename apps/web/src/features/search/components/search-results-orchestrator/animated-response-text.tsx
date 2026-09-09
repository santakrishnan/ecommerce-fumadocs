"use client";

import { useWordReveal } from "@shared/hooks/use-word-reveal";
import { cn } from "utils";

export interface AnimatedResponseTextProps {
  /** Interval between each word reveal in ms. Default: 30. */
  intervalMs?: number;
  /** Called once all words are visible. */
  onComplete?: () => void;
  /** Full response text to reveal word by word. */
  text: string;
}

/**
 * Reveals an agent response one word at a time.
 *
 * Reuses the shared `useWordReveal` hook (also used by the VDP `LlmIntroduction`)
 * so the word-by-word behaviour stays consistent across surfaces. All words stay
 * in the DOM from the first render so layout stays stable, and the full text is
 * exposed to assistive tech via an `sr-only` copy.
 */
export function AnimatedResponseText({
  text,
  intervalMs = 30,
  onComplete,
}: AnimatedResponseTextProps) {
  const { words, visibleCount } = useWordReveal({ text, intervalMs, onComplete });

  return (
    <p className="body-xl whitespace-pre-line text-text-primary">
      <span className="sr-only">{text}</span>
      {words.map(({ globalIndex, separator, word }) => {
        const isWordVisible = globalIndex < visibleCount;

        return (
          <span
            aria-hidden="true"
            className={cn(
              "transition-colors duration-200",
              isWordVisible ? undefined : "text-transparent"
            )}
            data-word-segment
            key={globalIndex}
          >
            {word}
            {separator}
          </span>
        );
      })}
    </p>
  );
}
