import { getPersonalizedSearchCards, PersonalizedSearchCarousel } from "@features/landing";
import { SectionHeader } from "@shared/components/section-header";
import { IconCaretRight } from "@ucmp/ui/icons";
import { cn } from "utils";

interface WatchlistSavedSearchesSectionProps {
  /** Outer wrapper class (e.g. carousel bleed). Applied only when data exists. */
  className?: string;
}

/**
 * Watchlist Saved Searches section — async Server Component.
 *
 * Reuses the existing PersonalizedSearchCarousel and getPersonalizedSearchCards
 * data path but lifts the 3-card restriction so all saved searches render.
 * Returns `null` when no saved searches exist (no empty header).
 *
 * Wrapped in `<Suspense fallback={<PersonalizedSearchSkeleton />}>` by the
 * parent page to enable streaming without blocking the static shell.
 */
export async function WatchlistSavedSearchesSection({
  className,
}: WatchlistSavedSearchesSectionProps) {
  const { success, data: cards } = await getPersonalizedSearchCards({
    limit: Number.POSITIVE_INFINITY,
  });

  if (!success || cards.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="watchlist-saved-searches-heading"
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="inline-flex items-center gap-1">
        <SectionHeader
          id="watchlist-saved-searches-heading"
          subtitle=""
          title="YOUR SAVED SEARCHES"
        />
        <IconCaretRight aria-hidden="true" className="mb-0.5 size-5 shrink-0 text-text-primary" />
      </div>
      <PersonalizedSearchCarousel cards={cards} colSpan={{ sm: 4, lg: 4 }} />
    </section>
  );
}
