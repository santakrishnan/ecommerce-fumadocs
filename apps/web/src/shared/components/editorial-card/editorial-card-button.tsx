import { Button } from "@ucmp/ui";

export interface EditorialCardButtonProps {
  /** Label text shown in the button (e.g. "9 Found Matches") */
  label: string;
}

/**
 * Save/CTA button for the EditorialCard hover overlay.
 *
 * Carries its own positioning + reveal animation: pinned bottom-left, hidden by
 * default, and faded in on card hover via the parent's `group/editorial`. Sits
 * at `z-20` so it stays above the whole-card link and remains clickable.
 * Rendered through `MediaCard`'s `adornments` slot (outside the link surface)
 * for valid HTML nesting.
 */
export function EditorialCardButton({ label }: EditorialCardButtonProps) {
  return (
    <Button
      aria-label={label}
      className="absolute bottom-6 left-6 z-20 opacity-0 transition-opacity duration-200 group-hover/editorial:opacity-100"
      size="lg"
      surface="dark"
      variant="primary"
    >
      {label}
    </Button>
  );
}
