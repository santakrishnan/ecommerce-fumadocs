import { IconCheckmark } from "@ucmp/ui/icons";
import { cn } from "utils";

// Badge circle size differs per card variant; the scrim and checkmark are shared.
const BADGE_SIZE = {
  compact: "size-6",
  full: "size-8",
} as const;

/** Selected-state scrim with a checkmark badge, shown over a vehicle card image. */
export function SelectedOverlay({ variant }: { variant: "compact" | "full" }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-opacity-black-40"
      data-slot="vehicle-card-image-overlay"
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-primary",
          BADGE_SIZE[variant]
        )}
      >
        <IconCheckmark className="size-5 text-text-primary" />
      </div>
    </div>
  );
}
