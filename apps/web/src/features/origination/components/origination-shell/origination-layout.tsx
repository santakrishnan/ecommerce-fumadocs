import { PageGrid } from "@ucmp/ui";
import type { ReactNode } from "react";
import { cn } from "utils";

interface OriginationLayoutProps {
  /** Screen content, rendered into the shared centered column (the surface owns the grid). */
  children: ReactNode;
  /** Surface/background override; defaults to `bg-surface-secondary`. The seam that lets a screen own its background. */
  className?: string;
  /** Extra classes on the content column (e.g. `overflow-y-auto`, `flex-1`). */
  contentClassName?: string;
  /** `data-slot` for the content column, a distinct styling/test hook per screen. Default `origination-screen-content`. */
  contentSlot?: string;
}

/**
 * Shared full-page surface for the origination flow. A full-bleed wrapper owns
 * the viewport-height background (so it fills the margins outside the capped
 * grid), wrapping the `<main>` PageGrid and its centered content column so
 * screens supply only content, never `col-span-*`. Background is per-screen via
 * `className` on the wrapper.
 */
function OriginationLayout({
  children,
  className,
  contentClassName,
  contentSlot = "origination-screen-content",
}: OriginationLayoutProps) {
  return (
    <div
      className={cn("relative h-dvh overflow-hidden bg-surface-secondary", className)}
      data-slot="origination-screen"
    >
      <PageGrid as="main" className="h-full" data-slot="origination-screen-grid">
        <div
          className={cn(
            "col-span-4 flex flex-col md:col-span-8 lg:col-span-6 lg:col-start-4",
            contentClassName
          )}
          data-slot={contentSlot}
        >
          {children}
        </div>
      </PageGrid>
    </div>
  );
}

export type { OriginationLayoutProps };
export { OriginationLayout };
