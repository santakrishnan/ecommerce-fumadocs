import { IconArrowReturnRight } from "@ucmp/ui/icons";
import { cn } from "@ucmp/ui/lib/utils";
import type React from "react";
import type { Suggestion } from "../../services/autocomplete-service";

interface SuggestionItemProps {
  /** Whether this item is the active (keyboard-highlighted) option. */
  isActive: boolean;
  /** Whether this card is being dismissed (selected sibling triggers fade-out). */
  isDimmed?: boolean;
  /** Whether this specific card was just tapped (triggers scale pulse). */
  isSelected?: boolean;
  /** Called when this item is selected. */
  onSelect: () => void;
  /** The suggestion data to render. */
  suggestion: Suggestion;
}

/** A single selectable suggestion row with arrow icon + label + spring entrance animation. */
export function SuggestionItem({
  isActive,
  onSelect,
  isDimmed = false,
  isSelected = false,
  suggestion,
}: SuggestionItemProps) {
  return (
    <div
      aria-selected={isActive}
      className={cn(
        "flex cursor-pointer items-center gap-1 font-medium text-sm text-text-inverse",
        // Tap feedback via Tailwind active: pseudo-class (no JS library).
        "active:scale-[0.98] motion-reduce:active:scale-100",
        // Keyboard-highlighted dimming (existing behavior).
        !(isDimmed || isSelected) && (isActive ? "opacity-100" : "opacity-70"),
        // Selection: tapped card gets scale pulse.
        isSelected && "animate-suggestion-tap",
        // Dimmed: sibling cards fade out when one is selected.
        isDimmed && "animate-suggestion-dim",
        // Reduced motion: disable all animations.
        "motion-reduce:animate-none"
      )}
      id={`suggestion-${suggestion.value}`}
      onClick={onSelect}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      role="option"
      tabIndex={-1}
    >
      <IconArrowReturnRight className="size-5 shrink-0" />
      <span className="body-md truncate font-medium">{suggestion.label}</span>
    </div>
  );
}
