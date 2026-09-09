"use client";

import { PolyCard } from "@ucmp/ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "utils";
import type { CardButtonProps } from "./card-types";

export interface ButtonCardProps extends Omit<ComponentProps<"div">, "children" | "className"> {
  /**
   * Interactive elements that must live outside the `<button>` for valid HTML
   * (e.g. SaveButton). Rendered as positioned siblings above the card.
   */
  adornments?: ReactNode;
  /**
   * All valid `<button>` props (except `children` and `type`) — spread
   * directly onto the button element. Include `onClick`, `aria-label`, etc.
   */
  buttonProps: CardButtonProps;
  /** Card content (CardHeader, CardContent, images, badges, etc.) */
  children: ReactNode;
  /** Classes applied to the PolyCard surface (the button element). */
  className?: string;
  /** Classes applied to the outer wrapper div (sizing, shrink, etc.). */
  wrapperClassName?: string;
}

/**
 * A clickable card (no navigation) — PolyCard rendered as a button inside a wrapper.
 *
 * Use for cards that trigger an action (submit a search turn, open a modal)
 * rather than navigating to a new page.
 *
 * `buttonProps` is spread entirely onto the `<button>` element, giving
 * consumers full control over onClick, aria-label, disabled, etc.
 *
 * Additional props (e.g. `data-surface`) are forwarded to the wrapper div.
 */
export function ButtonCard({
  adornments,
  buttonProps,
  children,
  className,
  wrapperClassName,
  ...wrapperProps
}: ButtonCardProps) {
  return (
    <div
      className={cn("group/card relative rounded-xl", wrapperClassName)}
      data-slot="card-root"
      {...wrapperProps}
    >
      <PolyCard
        className={cn("h-full w-full text-left", className)}
        render={<button data-carousel-focus type="button" {...buttonProps} />}
      >
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
