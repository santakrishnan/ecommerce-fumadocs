import { devConsole } from "@shared/lib/dev-console";
import { getEditorialCards } from "../services/get-editorial-cards";
import { EditorialCardsCarousel } from "./editorial-cards-carousel";

/**
 * Editorial Cards section — async Server Component.
 *
 * Fetches up to 4 curated editorial cards and renders them in a no-loop
 * carousel (drag/swipe — no arrow controls). Returns `null` when data is
 * unavailable — the section is completely hidden from the DOM.
 *
 * Wrapped in `<Suspense fallback={<EditorialCardsSkeleton />}>` by the
 * parent page/layout to enable streaming without blocking the static shell.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<EditorialCardsSkeleton />}>
 *   <EditorialCardsSection className={CAROUSEL_BLEED} />
 * </Suspense>
 * ```
 */
export async function EditorialCardsSection({ className }: { className?: string } = {}) {
  let cards: Awaited<ReturnType<typeof getEditorialCards>>["data"] = [];
  let hasCards = false;

  try {
    const result = await getEditorialCards();
    cards = result.data;
    hasCards = result.success && result.data.length > 0;
  } catch (error) {
    devConsole.error("[EditorialCardsSection] Failed to load cards", error);
  }

  if (!hasCards) {
    return null;
  }

  return (
    <section aria-label="Curated collections" className={className}>
      <EditorialCardsCarousel cards={cards} colSpan={{ sm: 3, lg: 3 }} size="medium" />
    </section>
  );
}
