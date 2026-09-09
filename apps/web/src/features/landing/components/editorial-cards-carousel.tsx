import { CARD_HOVER_SCALE, CardCarousel, type CardCarouselProps } from "@shared/components/card";
import { EDITORIAL_SIZE_TOKEN, LinkEditorialCard } from "@shared/components/editorial-card";
import type { IconProps } from "@ucmp/ui/icons";
import { IconBinocular, IconBolt, IconLocation } from "@ucmp/ui/icons";

import type { EditorialCardData, EditorialIconName } from "../data/editorial-cards";

/** Resolves serializable icon names to actual components (client-side only). */
const ICON_MAP: Record<EditorialIconName, React.ComponentType<IconProps>> = {
  bolt: IconBolt,
  binocular: IconBinocular,
  location: IconLocation,
};

interface EditorialCardsCarouselProps {
  /** Array of editorial card data to render in the carousel. */
  cards: EditorialCardData[];
  /** Number of PageGrid columns each carousel item should span. */
  colSpan?: CardCarouselProps<EditorialCardData>["colSpan"];
  /** Card size variant passed to each EditorialCard. Defaults to "medium". */
  size?: "medium" | "large";
}

/**
 * Editorial cards carousel using @ucmp/ui Carousel primitives
 * (Embla-based, no loop, align start). Uses the carousel's native arrow
 * behavior — navigation arrows appear on desktop (lg+) when items overflow.
 *
 * Resolves serializable `iconName` strings to icon components here
 * because React components can't cross the server→client boundary.
 */
export function EditorialCardsCarousel({
  cards,
  colSpan,
  size = "medium",
}: EditorialCardsCarouselProps) {
  return (
    <CardCarousel
      colSpan={colSpan}
      getItemKey={(_, i) => cards[i]?.href ?? String(i)}
      hoverScaleRatio={CARD_HOVER_SCALE[EDITORIAL_SIZE_TOKEN[size]]}
      items={cards}
      renderItem={({ iconName, ...card }) => (
        <LinkEditorialCard {...card} icon={iconName ? ICON_MAP[iconName] : undefined} size={size} />
      )}
    />
  );
}
