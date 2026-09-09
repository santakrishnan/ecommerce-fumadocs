import { type EditorialCardData, EditorialCardsCarousel } from "@features/landing";
import { SectionHeader } from "@shared/components/section-header";

export type EditorialSuggestionCard = EditorialCardData;

export interface EditorialSuggestionsCarouselProps {
  /** List of editorial suggestion cards to render */
  cards: EditorialSuggestionCard[];
}

/**
 * Editorial carousel for the not-found vehicle state.
 *
 * Composes the landing feature's `EditorialCardsCarousel` with a
 * `SectionHeader` and right-edge bleed on mobile/tablet.
 *
 * Shows contextual alternatives under the heading
 * "KEEP SEARCHING WHAT'S AVAILABLE NOW".
 */
export function EditorialSuggestionsCarousel({ cards }: EditorialSuggestionsCarouselProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="sold-editorial-heading"
      className="col-span-full mt-16 pb-20"
      data-section="editorial-suggestions"
    >
      <SectionHeader
        id="sold-editorial-heading"
        subtitle=""
        title="Keep searching what's available now"
      />

      {/* Carousel bleeds to right edge on mobile/tablet, left stays grid-aligned */}
      <div className="mt-6 -mr-5 lg:-mr-10">
        <EditorialCardsCarousel cards={cards} colSpan={{ sm: 3, lg: 4 }} size="large" />
      </div>
    </section>
  );
}
