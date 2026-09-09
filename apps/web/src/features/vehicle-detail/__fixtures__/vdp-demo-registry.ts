import type { OriginationKind } from "../types";
import { VDP_VINS } from "./vehicle-detail.fixtures";

type MockCertificationTier = "gold" | "silver";

/**
 * TEMP DEV — VIN → payment-state registry.
 *
 * The vehicle itself is looked up by VIN from the response fixtures
 * (`VDP_VEHICLE_RESPONSE` + `selectVehicle`); this map only assigns the
 * **payment (origination) state** per demo VIN, so each state has its own URL.
 * Delete this + the `?state=` override in `get-vehicle-detail` when the real
 * Origination API lands.
 *
 * Demo URLs (`/used-cars/details/{make}/{model}/{trim}/{vin}`):
 *   S1 Default  → …/3TMDZ5BN8NM126690
 *   S2 Estimate → …/2T1BURHE8JC039175
 *   S3 Offer    → …/5TDKZRFH8NS112233
 *   S4 Expired  → …/4T1G11AK5NU445566
 *   Sold        → …/JTMRWRFV8ND778899  (payment forced off; vehicle.status = sold)
 */
export const VDP_ORIGINATION_BY_VIN: Record<string, OriginationKind> = {
  [VDP_VINS.highlanderDefault]: "none",
  [VDP_VINS.rav4Estimate]: "estimate",
  [VDP_VINS.highlanderOffer]: "offer",
  [VDP_VINS.highlanderExpired]: "expired",
  [VDP_VINS.highlanderSold]: "none",
  // Upstream VINs — mapped to different origination states for demo
  [VDP_VINS.upstreamCamry1]: "none",
  [VDP_VINS.upstreamCamry2]: "estimate",
  [VDP_VINS.upstreamRav4]: "offer",
  [VDP_VINS.upstreamCamry3]: "expired",
  [VDP_VINS.upstreamSequoia]: "none",
};

/** Default payment state when a VIN isn't in the registry. */
export const DEFAULT_ORIGINATION: OriginationKind = "none";

/**
 * Mock "below market" valuation — a separate signal not present in the vehicle
 * response. Drives the card's badge until the real valuation source lands.
 */
export const BELOW_MARKET_VINS: ReadonlySet<string> = new Set<string>([
  VDP_VINS.highlanderDefault,
  VDP_VINS.rav4Estimate,
  VDP_VINS.highlanderOffer,
  VDP_VINS.highlanderExpired,
]);

/**
 * VINs forced to render as "sold" regardless of upstream vehicleStatus.
 * Used for demo purposes when the upstream API doesn't return sold status.
 */
export const FORCE_SOLD_VINS: ReadonlySet<string> = new Set<string>([
  VDP_VINS.highlanderSold,
  VDP_VINS.upstreamSequoia,
]);

const CERTIFICATION_TIER_BY_VIN: Partial<Record<string, MockCertificationTier>> = {
  [VDP_VINS.highlanderOffer]: "silver",
};

export function resolveMockCertificationTier(
  vin: string,
  isCertified: boolean
): MockCertificationTier | null {
  if (!isCertified) {
    return null;
  }

  return CERTIFICATION_TIER_BY_VIN[vin.toUpperCase()] ?? "gold";
}
