import { PolyCard } from "@ucmp/ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "utils";

export interface StaticCardProps extends Omit<ComponentProps<"div">, "children" | "className"> {
  /**
   * Interactive elements that must live outside the card surface
   * (e.g. SaveButton). Rendered as positioned siblings above the card.
   */
  adornments?: ReactNode;
  /** Card content (CardHeader, CardContent, images, badges, etc.) */
  children: ReactNode;
  /** Classes applied to the PolyCard surface (the div element). */
  className?: string;
  /** Classes applied to the outer wrapper div (sizing, shrink, etc.). */
  wrapperClassName?: string;
}

/**
 * A non-interactive card — PolyCard rendered as a plain div inside a wrapper.
 *
 * Shares the same wrapper + adornments structure as LinkCard/ButtonCard so
 * adornments are consistently positioned across all card modes.
 *
 * Additional props (e.g. `data-surface`) are forwarded to the wrapper div.
 */
export function StaticCard({
  adornments,
  children,
  className,
  wrapperClassName,
  ...wrapperProps
}: StaticCardProps) {
  return (
    <div
      className={cn("relative rounded-xl", wrapperClassName)}
      data-slot="card-root"
      {...wrapperProps}
    >
      <PolyCard className={cn("h-full w-full", className)} render={<div />}>
        {children}
      </PolyCard>
      {adornments && (
        <div className="pointer-events-none absolute inset-0 z-20 *:pointer-events-auto">
          {adornments}
        </div>
      )}
    </div>
  );
}
