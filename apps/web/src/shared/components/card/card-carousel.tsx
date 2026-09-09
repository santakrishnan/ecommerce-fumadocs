import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselItemProps,
  type CarouselProps,
  Skeleton,
} from "@ucmp/ui";
import type { ReactNode } from "react";
import { cn } from "utils";
import { CARD_SIZE, type CardSize } from "./card-size";

/**
 * All carousel props except `children` (which CardCarousel renders internally)
 * pass through to the underlying `<Carousel>` primitive. This replaces the
 * previous manual `Pick<>` list, so any new Carousel feature is automatically
 * available to consumers without maintaining an allowlist.
 */
type CarouselPassthroughProps = Omit<CarouselProps, "children">;

export type CardCarouselProps<T> = CarouselPassthroughProps &
  Pick<CarouselItemProps, "colSpan"> & {
    /** Rendered instead of the track when `items` is empty. */
    emptyState?: ReactNode;
    /** Stable key per item. */
    getItemKey: (item: T, index: number) => string;
    /** Extra classes per CarouselItem (responsive width / peek control). */
    itemClassName?: string;
    /** Items to render. */
    items: T[];
    /** Render a single card. The wrapper owns the CarouselItem around it. */
    renderItem: (item: T, index: number) => ReactNode;
  };

/**
 * Generic, card-agnostic carousel wrapper. Owns all carousel mechanics (snap,
 * gap, a11y region, controls, loop) so every block/section just supplies data +
 * a `renderItem`. Replaces the per-card carousel wrappers.
 */
export function CardCarousel<T>({
  items,
  getItemKey,
  renderItem,
  itemClassName,
  emptyState,
  colSpan,
  buttonProps,
  opts,
  ...carouselProps
}: CardCarouselProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Carousel
      buttonProps={{ surface: "light", ...buttonProps }}
      opts={{ align: "start", ...opts }}
      {...carouselProps}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem
            className={cn(itemClassName)}
            colSpan={colSpan}
            key={getItemKey(item, index)}
          >
            {renderItem(item, index)}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CardCarouselSkeleton — loading placeholder (co-located per shadcn convention)
 * ───────────────────────────────────────────────────────────────────────────── */

export interface CardCarouselSkeletonProps {
  /** Card-local dimension classes (and any per-card extras like background). */
  cardClassName?: string;
  /** Extra classes on the rail (e.g. `mt-4` spacing under a SectionHeader). */
  className?: string;
  /** Number of placeholder cards. Default: 3. */
  count?: number;
  /**
   * Size token — placeholders match the real card dimensions, preventing jump.
   * Omit when sizing via `cardClassName` (cards with card-local profiles, e.g.
   * editorial's aspect-based classes or dealer-offer's 3-breakpoint classes).
   */
  size?: CardSize;
}

/**
 * Loading placeholder that mirrors the carousel item layout AND uses the same
 * `CARD_SIZE` scale (or a card-local class profile), so the skeleton and the
 * loaded cards line up exactly.
 */
export function CardCarouselSkeleton({
  count = 3,
  size,
  cardClassName,
  className,
}: CardCarouselSkeletonProps) {
  const skeletonKeys = Array.from({ length: count }, (_, index) => `card-skeleton-${index}`);

  return (
    <div className={cn("flex gap-2 overflow-hidden", className)}>
      {skeletonKeys.map((key) => (
        <Skeleton
          className={cn("shrink-0 rounded-xl", size && CARD_SIZE[size], cardClassName)}
          key={key}
        />
      ))}
    </div>
  );
}
