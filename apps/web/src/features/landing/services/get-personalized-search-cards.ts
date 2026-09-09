import "server-only";

import { getSearches } from "@features/profile/searches/bff";
import editorialCardEv from "@public/editorial-card/editorial_card_ev.png";
import editorialCardTrunk from "@public/editorial-card/editorial_card_trunk.png";
import editorialFuel from "@public/editorial-card/editorial_fuel.png";
import type { SearchSession } from "@ucmp/sdk-visitor-profile-api";
import type { EditorialCardData } from "../data/personalized-search-cards";

/** Rotating pool of editorial card background images. */
const CARD_IMAGES = [editorialCardEv.src, editorialCardTrunk.src, editorialFuel.src];

/** Alternating surface per card for visual variety. */
const CARD_SURFACES: Array<"dark" | "light"> = ["dark", "dark", "dark"];

/**
 * Maps a SearchSession from the profile searches BFF to the UI-facing
 * EditorialCardData shape for the personalized search carousel.
 *
 * - Title: uses `name` (custom label) or `query` (original search text)
 * - Image: cycles through 3 static backgrounds (API doesn't return images)
 * - Eyebrow: static "Continue searching" (API doesn't return counts)
 * - No matches button (API doesn't return result counts)
 * - nextSearchPlan seeds a queued turn in IDB for auto-submit on /search/[id]
 */
function toPersonalizedCard(session: SearchSession, index: number): EditorialCardData {
  const imageUrl = CARD_IMAGES[index % CARD_IMAGES.length] ?? CARD_IMAGES[0] ?? "";
  const surface = CARD_SURFACES[index % CARD_SURFACES.length] ?? "dark";
  const headline = session.name?.trim() || session.query?.trim() || "Saved search";
  const query = session.query?.trim() || undefined;

  return {
    eyebrow: "Continue searching",
    headline,
    href: `/search/${session.searchId}`,
    imageUrl,
    surface,
    nextSearchPlan: {
      searchId: session.searchId,
      query,
    },
  };
}

/** Default max personalized search cards (welcome landing). */
const DEFAULT_MAX_CARDS = 3;

export interface GetPersonalizedSearchCardsOptions {
  /**
   * Maximum number of cards to return.
   * Pass `Infinity` (or any large number) to get all available cards.
   * @default 3
   */
  limit?: number;
}

/**
 * RSC data service for Personalized Search cards.
 *
 * Calls the profile searches BFF (`GET /searches` via the visitors service)
 * to fetch the visitor's recent/saved search sessions, then maps them to
 * the carousel's EditorialCardData view-model.
 *
 * Returns `{ success: false, data: [] }` when the service is unavailable
 * or the visitor has no search sessions — the section hides entirely.
 */
export async function getPersonalizedSearchCards(
  options: GetPersonalizedSearchCardsOptions = {}
): Promise<{
  success: boolean;
  data: EditorialCardData[];
}> {
  const { limit = DEFAULT_MAX_CARDS } = options;
  const result = await getSearches();

  if (!result.success) {
    return { success: false, data: [] };
  }

  if (result.data.length === 0) {
    return { success: true, data: [] };
  }

  const sliced =
    limit === Number.POSITIVE_INFINITY
      ? result.data
      : result.data.slice(0, Math.max(0, Number.isFinite(limit) ? limit : DEFAULT_MAX_CARDS));
  return { success: true, data: sliced.map(toPersonalizedCard) };
}
