"use client";

import { Button, Card, CardContent } from "@ucmp/ui";
import { IconToyotaX } from "@ucmp/ui/icons";
import type { ReactNode } from "react";
import { cn } from "utils";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Visual variant controlling surface color, layout density, and pill styling.
 *
 * - `"dark"`: VDP — dark glass card, large heading (h2), stacked pills, full-width.
 * - `"light"`: Compare — light card, compact heading (body-md), horizontal scrolling pills.
 * - `"light-horizontal"`: Watchlist — light card, larger heading (body-xl), side-by-side heading + pills layout.
 */
export type AskQuestionPromptVariant = "dark" | "light" | "light-horizontal";

export interface AskQuestionPromptProps {
  /** Catch-all button label (e.g. "Something else", "Ask something else"). */
  catchAllLabel?: string;
  /** Additional CSS classes for the outer card. */
  className?: string;
  /** Section heading (e.g. "Questions about this Highlander Hybrid?") */
  heading: string;
  /** HTML heading level for the title. Defaults to `"h3"`. */
  headingLevel?: "h2" | "h3";
  /** Called when the user selects a suggested question or the catch-all. Receives the question text, or `null` for catch-all. */
  onSelect?: (question: string | null) => void;
  /** Suggested question pills. */
  questions: string[];
  /** Visual variant. Defaults to `"light"`. */
  variant?: AskQuestionPromptVariant;
  /** Optional wrapper around the card for consumer-controlled animation (e.g. motion.div, ref forwarding). */
  wrapper?: (children: ReactNode) => ReactNode;
}

// ─── Variant-specific config ──────────────────────────────────────────────────

const CARD_CLASSES: Record<AskQuestionPromptVariant, string> = {
  dark: "rounded-2xl border border-white/20 bg-opacity-black-26 shadow-none ring-0",
  light: "rounded-xl border-0 bg-surface-inactive shadow-none ring-0",
  "light-horizontal": "rounded-xl border-0 bg-surface-primary shadow-none ring-0",
};

const CONTENT_CLASSES: Record<AskQuestionPromptVariant, string> = {
  dark: "flex flex-1 flex-col justify-between gap-12 px-6 py-10 lg:gap-24 lg:px-8 xl:gap-32",
  light: "flex flex-col gap-4 py-8 pr-0 pl-5 md:py-8 md:pr-0 md:pl-6 lg:px-8 lg:py-10",
  "light-horizontal":
    "flex flex-col gap-14 px-6 py-8 md:gap-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-10",
};

const HEADING_CLASSES: Record<AskQuestionPromptVariant, string> = {
  dark: "h2 text-text-primary",
  light: "body-md font-medium text-text-primary",
  "light-horizontal": "body-xl text-text-primary",
};

const PILL_CONTAINER_CLASSES: Record<AskQuestionPromptVariant, string> = {
  dark: "flex flex-col gap-1.5",
  light:
    "scrollbar-none flex gap-2 overflow-x-auto pr-5 md:pr-6 lg:flex-wrap lg:overflow-x-visible lg:pr-0",
  "light-horizontal": "flex flex-col gap-2",
};

const PILL_CLASSES: Record<AskQuestionPromptVariant, string> = {
  dark: "body-lg w-fit whitespace-normal text-left [--typo-font-weight:var(--font-weight-normal)]",
  light: "shrink-0 whitespace-nowrap text-left [--typo-font-weight:var(--font-weight-normal)]",
  "light-horizontal": "w-fit whitespace-normal text-left",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AskQuestionPrompt — shared presentational component for the "ask a question"
 * pattern used across VDP, Compare, and Watchlist pages.
 *
 * Renders a brand-themed card with a heading, suggested-question pills, and a
 * catch-all button. Selection is exposed through a plain `onSelect` callback —
 * the component has no knowledge of overlays, search orchestrators, or routing.
 *
 * Visual differences between pages are handled by the `variant` prop, not by
 * consumer-side class overrides.
 */
export function AskQuestionPrompt({
  catchAllLabel = "Ask something else",
  className,
  heading,
  headingLevel = "h3",
  onSelect,
  questions,
  variant = "light",
  wrapper,
}: AskQuestionPromptProps) {
  const surface = variant === "dark" ? "dark" : undefined;
  const HeadingTag = headingLevel;

  const content = (
    <Card
      className={cn("relative flex flex-col", CARD_CLASSES[variant], className)}
      data-surface={surface}
    >
      <CardContent className={CONTENT_CLASSES[variant]}>
        {/* Heading block */}
        {variant === "dark" ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-5">
              <IconToyotaX aria-hidden className="size-3.5 text-text-primary" />
              <HeadingTag className={HEADING_CLASSES[variant]}>{heading}</HeadingTag>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              variant === "light-horizontal" ? "flex flex-col gap-2 lg:w-64" : "flex flex-col gap-4"
            )}
          >
            <IconToyotaX aria-hidden className="size-3.5 text-brand" />
            <HeadingTag className={HEADING_CLASSES[variant]}>{heading}</HeadingTag>
          </div>
        )}

        {/* Pills block */}
        <div className={PILL_CONTAINER_CLASSES[variant]}>
          {questions.map((question) => (
            <Button
              aria-disabled={onSelect === undefined ? true : undefined}
              className={PILL_CLASSES[variant]}
              key={question}
              onClick={() => onSelect?.(question)}
              size={variant === "light" ? "sm" : undefined}
              surface={surface}
              tabIndex={onSelect === undefined ? -1 : undefined}
              variant={variant === "light-horizontal" ? "tertiary" : "secondary"}
            >
              {question}
            </Button>
          ))}

          <Button
            aria-disabled={onSelect === undefined ? true : undefined}
            className={PILL_CLASSES[variant]}
            onClick={() => onSelect?.(null)}
            size={variant === "light" ? "sm" : undefined}
            surface={surface}
            tabIndex={onSelect === undefined ? -1 : undefined}
            variant={variant === "light-horizontal" ? "tertiary" : "secondary"}
          >
            {catchAllLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return wrapper ? wrapper(content) : content;
}
