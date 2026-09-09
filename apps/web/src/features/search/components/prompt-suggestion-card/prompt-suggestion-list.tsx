import { ItemGroup } from "@ucmp/ui";
import type { PromptSuggestionCardProps } from "./prompt-suggestion-card";
import { PromptSuggestionCard } from "./prompt-suggestion-card";

/** Props for the PromptSuggestionList container. */
export interface PromptSuggestionListProps {
  /** Accessible label for the list (screen readers). */
  ariaLabel?: string;
  /** Section label displayed above the card list. */
  sectionLabel?: string;
  /** Array of suggestion card data. */
  suggestions: PromptSuggestionCardProps[];
}

/**
 * Renders a labeled, semantic list of prompt suggestion cards.
 *
 * Uses shadcn `<ItemGroup>` (role="list") with `role="listitem"` on each
 * card for screen-reader accessibility. Displays a section label above
 * the cards. Returns null when empty (Server Component — data is resolved
 * before render, no loading state needed).
 *
 * - Server Component — no "use client" directive.
 * - Full width — page layout handles breakpoint sizing.
 */
export function PromptSuggestionList({
  ariaLabel = "Suggestions to get started",
  sectionLabel = "Suggestions to get started",
  suggestions,
}: PromptSuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section data-surface="dark">
      {/* Section label */}
      <p className="body-lg mb-5 text-left text-text-secondary">{sectionLabel}</p>

      {/* Card list — overflow-y-auto scrolls when parent constrains height */}
      <ItemGroup aria-label={ariaLabel} className="gap-2.5 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <PromptSuggestionCard key={suggestion.id} {...suggestion} />
        ))}
      </ItemGroup>
    </section>
  );
}
