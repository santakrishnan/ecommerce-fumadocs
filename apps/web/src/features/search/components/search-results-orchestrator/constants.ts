import type { CardBadgeIconName } from "@shared/components/card/card-badge";

import type { SearchResultItem } from "../../types/search-results";

export const VALID_BADGE_ICON_NAMES: ReadonlySet<string> = new Set<CardBadgeIconName>([
  "binocular",
  "bolt",
  "check-circle",
  "clock",
  "clock-filled",
  "document-filled",
  "dollar",
  "heart",
  "location",
  "price-tag",
  "price-tag-filled",
  "toyota-x",
]);

export function toCardBadgeIconName(value?: string): CardBadgeIconName | undefined {
  if (value && VALID_BADGE_ICON_NAMES.has(value)) {
    return value as CardBadgeIconName;
  }
  return;
}

/**
 * Carousel bleed — extends the scroll track to the right viewport edge.
 * Mobile: undoes the parent's 20px right padding.
 * Desktop: undoes the 40px right page padding + half the remaining viewport
 * space beyond the max-width container.
 *
 * The `overscroll-none` descendant selector targets the actual scroll viewport
 * inside the Carousel (the direct child of `[data-slot=carousel-content]`),
 * since `overscroll-behavior` only applies to scroll containers.
 */
export const CAROUSEL_BLEED_RIGHT =
  "-mr-5 lg:-mr-[calc(--spacing(10)_+_max(0rem,_(100vw_-_var(--max-width-8xl))_/_2))] [&_[data-slot=carousel-next]]:right-4 [&_[data-slot=carousel-next]]:translate-x-0 [&_[data-slot=carousel-content]>div]:overscroll-x-none";

export const getResultItemKey = (item: SearchResultItem) => item.id;
