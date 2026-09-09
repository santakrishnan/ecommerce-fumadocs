import { connection } from "next/server";
import { getPersonalizedSearchCards } from "../services/get-personalized-search-cards";
import { PersonalizedSearchCarousel } from "./personalized-search-carousel";

interface PersonalizedSearchSectionProps {
  /** Outer wrapper class (e.g. carousel bleed). Applied only when data exists. */
  className?: string;
}

/**
 * Personalized Search Recommendation section — async Server Component.
 *
 * Fetches the visitor's recent search sessions from the profile searches BFF
 * and renders them as editorial cards. Returns `null` when no sessions exist
 * or the service is unavailable — the section is completely hidden.
 *
 * Wrapped in `<Suspense fallback={<PersonalizedSearchSkeleton />}>` by the
 * parent page/layout to enable streaming without blocking the static shell.
 */
export async function PersonalizedSearchSection({
  className,
}: PersonalizedSearchSectionProps = {}) {
  await connection();
  const { success, data: cards } = await getPersonalizedSearchCards();

  if (!success || cards.length === 0) {
    return null;
  }

  return (
    <section aria-label="Personalized search recommendations" className={className}>
      <PersonalizedSearchCarousel cards={cards} colSpan={{ sm: 4, lg: 4 }} />
    </section>
  );
}
