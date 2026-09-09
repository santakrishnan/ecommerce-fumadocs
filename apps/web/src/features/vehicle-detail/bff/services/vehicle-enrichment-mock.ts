import "server-only";

import { IMAGE_BASE_URL } from "@config/images";
import { resolveMockCertificationTier } from "../../__fixtures__/vdp-demo-registry";
import { PRICE_COMPARISON_BY_VIN } from "../__fixtures__/price-comparison.fixtures";
import { buildVdpCertification } from "../certification-content";
import type {
  VdpAiContent,
  VdpCertification,
  VdpComputed,
  VdpPricingCard,
} from "../contracts/vdp-response.schema";
import type { VehicleDetailWithSoldAt } from "../contracts/vehicle-detail-with-sold-at";

export interface VehicleEnrichment {
  aiContent: VdpAiContent | null;
  certification: VdpCertification | null;
  computed: VdpComputed;
  pricingCard: VdpPricingCard | null;
}

/**
 * Mock vehicle enrichment service — generates certification,
 * computed, and AI content fields that don't yet have a
 * real upstream API.
 */
export async function mockVehicleEnrichment(
  vehicle: VehicleDetailWithSoldAt
): Promise<VehicleEnrichment> {
  return {
    certification: mockCertification(vehicle),
    computed: mockComputed(vehicle),
    pricingCard: PRICE_COMPARISON_BY_VIN[vehicle.vin] ?? null,
    aiContent: mockAiContent(vehicle),
  };
}

/**
 * Certification tier mock — maps boolean `isCertified` to a full card payload.
 * Until the backend supports tiered certification, assume gold when certified.
 */
function mockCertification(vehicle: VehicleDetailWithSoldAt): VdpCertification | null {
  const tier = resolveMockCertificationTier(vehicle.vin, vehicle.status.isCertified ?? false);
  if (!tier) {
    return null;
  }

  const model = vehicle.vehicleInfo.model ?? "Vehicle";
  const make = vehicle.vehicleInfo.make ?? "Toyota";

  return buildVdpCertification({
    badgeUrl: `${IMAGE_BASE_URL}/images/certification/certification-${tier}.svg`,
    make,
    model,
    tier,
  });
}

/**
 * Computed fields mock — horsepower, seating, and comparisonProfile derived from known models.
 * In production, these would come from a vehicle specs database / v360 pipeline.
 */
function mockComputed(vehicle: VehicleDetailWithSoldAt): VdpComputed {
  const model = vehicle.vehicleInfo.model?.toLowerCase() ?? "";
  const { make, trim } = vehicle.vehicleInfo;
  const city = vehicle.dealerInfo.city ?? "your area";

  let horsepower: number | undefined;
  let seating: number | undefined;
  let comparisonProfile: string | undefined;

  if (model.includes("highlander")) {
    horsepower = 243;
    seating = 7;
    comparisonProfile = `It has everything you're looking for, including plenty of space inside, while still compact enough to be perfect for getting around ${city}.`;
  } else if (model.includes("rav4")) {
    horsepower = 219;
    seating = 5;
    comparisonProfile = `This ${make} ${vehicle.vehicleInfo.model}${trim ? ` ${trim}` : ""} offers a great combination of reliability and value for its price point. It features all-wheel drive, heated seats, and Apple CarPlay.`;
  }

  return { comparisonProfile, horsepower, seating };
}

/**
 * AI content mock — generates contextual paragraphs based on vehicle attributes.
 * In production, this would come from an LLM service personalized to the visitor.
 */
function mockAiContent(vehicle: VehicleDetailWithSoldAt): VdpAiContent {
  const { make, model, trim } = vehicle.vehicleInfo;
  const city = vehicle.dealerInfo.city ?? "your area";
  const tier = resolveMockCertificationTier(vehicle.vin, vehicle.status.isCertified ?? false);
  const certTier = tier ? `${tier.charAt(0).toUpperCase()}${tier.slice(1)}` : null;

  const paragraphs: string[] = [];

  paragraphs.push(
    `It has everything you're looking for, including plenty of space inside, while still compact enough to be perfect for getting around ${city}.`
  );

  if (certTier) {
    paragraphs.push(
      `The other thing to note is that it's a one-owner vehicle with ${make} ${certTier} Certification, which means it comes with added warranty coverage.`
    );
  } else {
    paragraphs.push(
      `This ${make} ${model}${trim ? ` ${trim}` : ""} offers a great combination of reliability and value for its price point.`
    );
  }

  return {
    paragraphs,
    generatedBy: "mock-enrichment-v1",
    generatedAt: new Date().toISOString(),
  };
}
