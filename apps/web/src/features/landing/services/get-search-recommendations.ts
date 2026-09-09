import "server-only";

import { type BecauseYouViewedResponse, getBecauseYouViewed } from "@features/recommendations";
import type { Vehicle } from "@shared/components/inventory-card";
import { normalizeImageUrl } from "@shared/lib/media";
import { cacheLife } from "next/cache";

type InventoryItem = BecauseYouViewedResponse["results"][number];

/**
 * Maps an upstream inventory DTO to the UI-facing Vehicle shape.
 */
function toVehicle(item: InventoryItem): Vehicle {
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return {
    id: item.id,
    make: item.make,
    model: item.model,
    year: item.year,
    trim: item.trim ?? "",
    price: item.price,
    mileage: item.mileage,
    imageUrl,
    href: item.ctaLink,
    surface: item.surface ?? "light",
    ...(item.vin ? { vin: item.vin } : {}),
    showBadge: false,
  };
}

/**
 * Cached RSC data service for "Because You Viewed" recommendations (Welcome Back page).
 *
 * Consumes the same in-process use-case the `/api/v1/recommendations/because-you-viewed`
 * route handler calls — `getBecauseYouViewed` from `@features/recommendations` —
 * instead of self-fetching the HTTP endpoint. Calling the shared use-case in-process
 * avoids a network hop, preserves cookies, and is safe during build/ISR.
 *
 * Maps the validated `InventoryItem[]` into the carousel's `Vehicle[]`
 * view-model and caches with the "profile" profile (user-specific, shorter TTL).
 */
export async function getSearchRecommendations(visitorId = "anonymous"): Promise<Vehicle[]> {
  "use cache";
  cacheLife("profile");

  const result = await getBecauseYouViewed({}, visitorId);

  if (!result.success) {
    return [];
  }

  return result.data.results.map(toVehicle);
}
