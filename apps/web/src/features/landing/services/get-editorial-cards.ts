import "server-only";

import { getProfileSuggestions, type ProfileSuggestionsResponse } from "@features/profile";
import { cacheLife } from "next/cache";
import type { EditorialCardData } from "../data/editorial-cards";

type SuggestionCard = ProfileSuggestionsResponse[number];

/**
 * Maps an upstream suggestion DTO to the UI-facing EditorialCardData shape.
 */
function toEditorialCard(card: SuggestionCard): EditorialCardData {
  return {
    eyebrow: card.eyebrow,
    headline: card.headline,
    href: card.href,
    matches: card.matches,
    imageUrl: card.imageUrl,
    iconName: card.iconName as EditorialCardData["iconName"],
    surface: card.surface,
  };
}

/**
 * Cached RSC data service for the Editorial (Curated Collections) section.
 *
 * Consumes the same in-process use-case the `/api/v1/profile/suggestions` route
 * handler calls — `getProfileSuggestions` from `@features/profile` — instead
 * of self-fetching the HTTP endpoint. Calling the shared use-case in-process
 * avoids a network hop, preserves cookies, and is safe during build/ISR; both
 * the route handler and this Server Component share the same validation and
 * contract.
 *
 * Maps the validated `SuggestionCard[]` into the carousel's `EditorialCardData`
 * view-model and caches with the "landing" profile.
 */
export async function getEditorialCards(): Promise<{
  success: boolean;
  data: EditorialCardData[];
}> {
  "use cache";
  cacheLife("landing");

  const result = await getProfileSuggestions({}, undefined);

  if (!result.success) {
    return { success: false as const, data: [] };
  }

  return { success: true as const, data: result.data.slice(0, 4).map(toEditorialCard) };
}
