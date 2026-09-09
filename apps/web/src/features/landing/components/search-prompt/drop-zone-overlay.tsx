import { Button } from "@ucmp/ui";
import { IconPhotos } from "@ucmp/ui/icons";

/** Props for the DropZoneOverlay component. */
interface DropZoneOverlayProps {
  /** Called when the overlay is clicked (opens file picker). */
  onClick: () => void;
}

/**
 * Full-area overlay shown when dragging files over the search prompt.
 * Provides a visual cue and click target for image upload.
 */
export function DropZoneOverlay({ onClick }: DropZoneOverlayProps) {
  return (
    <Button
      aria-label="Drop images here or click to browse"
      className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl border-2 border-border-primary border-dashed bg-surface-primary/95"
      onClick={onClick}
      surface="dark"
      variant="primary"
    >
      <span className="pointer-events-none flex items-center gap-2 text-sm text-text-subtle">
        <IconPhotos className="size-4" />
        Drop your images here
      </span>
    </Button>
  );
}
