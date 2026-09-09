"use client";

import { Button, PageGrid } from "@ucmp/ui";
import { IconClose } from "@ucmp/ui/icons";
import type { RefObject } from "react";
import { cn } from "utils";

export interface OverlayHeaderProps {
  /** Additional class names for the header element */
  className?: string;
  /** Accessible label for the close button */
  closeLabel?: string;
  /** Ref forwarded to the close button for focus management */
  closeRef?: RefObject<HTMLButtonElement | null>;
  /** Close handler */
  onClose: () => void;
  /** Vehicle title (e.g. "TOYOTA HIGHLANDER HYBRID LIMITED") */
  title: string;
  /** Vehicle year */
  year?: number | string;
}

/**
 * Shared overlay header for VDP expand overlays (image gallery, ask question).
 *
 * Renders year + vehicle title on the left, close button pinned to the last
 * grid column on the right. Uses PageGrid for consistent page margins.
 */
export function OverlayHeader({
  closeLabel = "Close",
  closeRef,
  className,
  onClose,
  title,
  year,
}: OverlayHeaderProps) {
  return (
    <header className={cn("shrink-0", className)} data-surface="dark">
      <PageGrid className="items-center py-8">
        <div className="col-span-2 flex flex-col gap-1 md:col-span-4 lg:col-span-3">
          {year && <span className="body-sm text-text-secondary">{year}</span>}
          <h2 className="vehicle-title-md text-text-primary">{title}</h2>
        </div>
        <div className="col-start-4 flex items-center justify-end md:col-start-8 lg:col-start-12">
          <Button
            aria-label={closeLabel}
            nativeButton
            onClick={onClose}
            ref={closeRef}
            size="icon"
            surface="dark"
            type="button"
            variant="secondary"
          >
            <IconClose className="size-6" />
          </Button>
        </div>
      </PageGrid>
    </header>
  );
}
