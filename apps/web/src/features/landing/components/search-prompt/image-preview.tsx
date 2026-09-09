import { Button } from "@ucmp/ui";
import { IconAdd, IconClose } from "@ucmp/ui/icons";
import Image from "next/image";

// ─── Types ──────────────────────────────────────────────────

/** Props for the ImagePreview component. */
interface ImagePreviewProps {
  /** Alt text for the image thumbnail. */
  alt: string;
  /** Called when the remove button is clicked. */
  onRemove: () => void;
  /** Image source URL (object URL or remote). */
  src: string;
}

/** Props for the AddImageButton component. */
interface AddImageButtonProps {
  /** Called when the add button is clicked. */
  onClick: () => void;
}

// ─── Components ─────────────────────────────────────────────

/**
 * Image preview thumbnail with a circular remove button
 * positioned at the top-right corner (overlapping the edge).
 */
export function ImagePreview({ alt, onRemove, src }: ImagePreviewProps) {
  return (
    <div className="relative shrink-0">
      <div className="size-16 overflow-hidden rounded-xl border border-surface-inactive">
        <Image alt={alt} className="size-full object-cover" height={64} src={src} width={64} />
      </div>
      <Button
        aria-label={`Remove ${alt}`}
        className="absolute -top-2 -right-2 size-6 rounded-full bg-surface-secondary text-text-primary shadow-sm hover:bg-surface-muted"
        onClick={onRemove}
        size="icon-sm"
        surface="dark"
        type="button"
        variant="primary"
      >
        <IconClose className="size-3" />
      </Button>
    </div>
  );
}

/** "Add more images" button styled as a thumbnail placeholder. */
export function AddImageButton({ onClick }: AddImageButtonProps) {
  return (
    <Button
      aria-label="Add more images"
      className="size-16 shrink-0 rounded-xl border border-surface-muted border-dashed bg-surface-inactive/30 hover:bg-surface-inactive"
      onClick={onClick}
      size="icon-lg"
      surface="dark"
      type="button"
      variant="primary"
    >
      <IconAdd className="size-5 text-text-muted" />
    </Button>
  );
}
