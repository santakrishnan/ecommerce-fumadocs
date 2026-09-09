import "server-only";
import { cacheLife } from "next/cache";
import type { CreditScoreTier } from "./financing-rate-service";
import { FixtureFinancingRateService } from "./financing-rate-service";

const financingRateService = new FixtureFinancingRateService();

/**
 * Cached fetch for credit score tiers.
 * Uses the "landing" cache profile (15min stale, 15min revalidate, 1hr expire).
 * When the fixture is swapped for a real API, the cache layer is already in place.
 */
export async function getCreditScoreTiers(): Promise<CreditScoreTier[]> {
  "use cache";
  cacheLife("landing");
  return financingRateService.getCreditScoreTiers();
}
