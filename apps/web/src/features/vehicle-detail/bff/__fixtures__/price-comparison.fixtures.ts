import { VDP_VINS } from "../../__fixtures__/vehicle-detail.fixtures";
import type { PriceComparisonData } from "../../types";

/**
 * Price Comparison fixtures — market-range data for the PriceRangeIndicator chart.
 *
 * Each entry represents the local market corridor (same make/model/year/trim)
 * for a given demo VIN. Values are intentionally realistic for a 2023–2024
 * Toyota Highlander / RAV4 in the $26K–$42K range.
 *
 * @see https://www.figma.com/design/S84HaAL9hckSZcWm8k2Vk2/Handoff?node-id=4331-99368
 */
export const PRICE_COMPARISON_BY_VIN: Record<string, PriceComparisonData> = {
  /** Highlander Default — priced below average (good deal). */
  [VDP_VINS.highlanderDefault]: {
    amountBelowMarketValue: 2587,
    averagePrice: 34_200,
    marketValuePercentage: 7.7,
    nearbyComparedVehiclesCount: 47,
    priceRangeEnd: 42_000,
    priceRangeStart: 26_000,
    thisCarPrice: 30_775,
    valueDirection: "below",
  },
  /** RAV4 Estimate — priced near average. */
  [VDP_VINS.rav4Estimate]: {
    amountBelowMarketValue: 1425,
    averagePrice: 33_500,
    marketValuePercentage: 4.3,
    nearbyComparedVehiclesCount: 12,
    priceRangeEnd: 39_800,
    priceRangeStart: 27_500,
    thisCarPrice: 32_075,
    valueDirection: "below",
  },
  /** Highlander Offer — priced slightly above average. */
  [VDP_VINS.highlanderOffer]: {
    amountBelowMarketValue: 1700,
    averagePrice: 34_200,
    marketValuePercentage: 5,
    nearbyComparedVehiclesCount: 12,
    priceRangeEnd: 42_000,
    priceRangeStart: 26_000,
    thisCarPrice: 35_900,
    valueDirection: "above",
  },
  /** Highlander Expired — priced well above average (overpriced). */
  [VDP_VINS.highlanderExpired]: {
    amountBelowMarketValue: 5300,
    averagePrice: 34_200,
    marketValuePercentage: 15.5,
    nearbyComparedVehiclesCount: 12,
    priceRangeEnd: 42_000,
    priceRangeStart: 26_000,
    thisCarPrice: 39_500,
    valueDirection: "above",
  },
  /** Highlander Sold — chart still renders for reference. */
  [VDP_VINS.highlanderSold]: {
    amountBelowMarketValue: 3425,
    averagePrice: 34_200,
    marketValuePercentage: 10,
    nearbyComparedVehiclesCount: 12,
    priceRangeEnd: 42_000,
    priceRangeStart: 26_000,
    thisCarPrice: 30_775,
    valueDirection: "below",
  },
  /** Highlander No Photos — same market corridor, priced below average. */
  [VDP_VINS.highlanderNoPhotos]: {
    amountBelowMarketValue: 2587,
    averagePrice: 34_200,
    marketValuePercentage: 7.7,
    nearbyComparedVehiclesCount: 47,
    priceRangeEnd: 42_000,
    priceRangeStart: 26_000,
    thisCarPrice: 30_775,
    valueDirection: "below",
  },
};

/** Default fixture for stories / tests when a specific VIN isn't needed. */
export const PRICE_COMPARISON_DEFAULT: PriceComparisonData =
  // biome-ignore lint/style/noNonNullAssertion: key is statically defined above
  PRICE_COMPARISON_BY_VIN[VDP_VINS.highlanderDefault]!;
