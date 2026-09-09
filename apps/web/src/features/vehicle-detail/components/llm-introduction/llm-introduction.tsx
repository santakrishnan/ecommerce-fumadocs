"use client";

import { useWordReveal } from "@shared/hooks/use-word-reveal";
import { cn } from "utils";

export interface LlmIntroductionProps {
  intervalMs?: number;
  onComplete?: () => void;
  text: string;
}

/**
 * Renders a vehicle introduction with a word-by-word reveal.
 *
 * All words stay in the DOM from the first render so layout stays stable.
 */
export function LlmIntroduction({ intervalMs = 50, onComplete, text }: LlmIntroductionProps) {
  const { words, visibleCount } = useWordReveal({ text, intervalMs, onComplete });

  return (
    <p className="body-xl xl:body-xxl whitespace-pre-line text-text-primary">
      <span className="sr-only">{text}</span>
      {words.map(({ globalIndex, separator, word }) => (
        <span
          aria-hidden="true"
          className={cn(
            "transition-colors duration-200",
            globalIndex < visibleCount ? undefined : "text-transparent"
          )}
          data-word-segment
          key={globalIndex}
        >
          {word}
          {separator}
        </span>
      ))}
    </p>
  );
}
