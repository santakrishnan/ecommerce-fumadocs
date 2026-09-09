"use cache";

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEALER_OFFERS } from "../data/dealer-cards";
import type { DealerOfferData } from "../types";

/**
 * Fetches up to 4 local dealer offers for the given zip code.
 * V1: returns hardcoded seed data.
 * V2: will call a real API with geolocation-based zip.
 *
 * @example
 * ```ts
 * const offers = await getDealerOffers("10001");
 * ```
 */
export async function getDealerOffers(zipCode = "10001"): Promise<DealerOfferData[]> {
  cacheLife("landing");
  cacheTag("dealer-offers", `dealer-offers:${zipCode}`);

  return DEALER_OFFERS.slice(0, 4);
}
