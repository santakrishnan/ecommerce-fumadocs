import { PolyCard } from "@ucmp/ui";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "utils";
import type { CardLinkProps } from "./card-types";

export interface LinkCardProps extends Omit<ComponentProps<"div">, "children" | "className"> {
  /**
   * Interactive elements that must live outside the `<a>` for valid HTML
   * (e.g. SaveButton). Rendered as positioned siblings above the card.
   */
  adornments?: ReactNode;
  /** Card content (CardHeader, CardContent, images, badges, etc.) */
  children: ReactNode;
  /** Classes applied to the PolyCard surface (the link element). */
  className?: string;
  /**
   * All valid Next.js `<Link>` props — spread directly onto the link.
   * `href` is required.
   */
  linkProps: CardLinkProps;
  /** Classes applied to the outer wrapper div (sizing, shrink, etc.). */
  wrapperClassName?: string;
}

/**
 * A navigable card — PolyCard rendered as a Next.js Link inside a wrapper.
 *
 * `linkProps` is spread entirely onto the `<Link>` element, giving consumers
 * full control over href, aria-label, onNavigate, prefetch, scroll, etc.
 *
 * Additional props (e.g. `data-surface`) are forwarded to the wrapper div.
 */
export function LinkCard({
  adornments,
  children,
  className,
  linkProps,
  wrapperClassName,
  ...wrapperProps
}: LinkCardProps) {
  return (
    <div
      className={cn("group/card relative rounded-xl", wrapperClassName)}
      data-slot="card-root"
      {...wrapperProps}
    >
      <PolyCard
        className={cn("h-full w-full", className)}
        render={<Link data-carousel-focus {...linkProps} />}
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
