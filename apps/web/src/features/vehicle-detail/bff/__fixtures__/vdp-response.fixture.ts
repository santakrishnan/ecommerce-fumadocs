import {
  getFaqForVin,
  VDP_VEHICLES_BY_VIN,
  VDP_VINS,
} from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { VEHICLE_IMAGES_FIXTURE } from "@features/vehicle-detail/__fixtures__/vehicle-images.fixture";
import { DEALER_BAY_RIDGE } from "../../__fixtures__/dealer-info-dialog.fixture";
import { ORIGINATION_FIXTURES } from "../../__fixtures__/origination.fixtures";
import { resolveMockCertificationTier } from "../../__fixtures__/vdp-demo-registry";
import { buildVdpCertification } from "../certification-content";
import type { VdpApiResponse } from "../contracts/vdp-response.schema";
import { PRICE_COMPARISON_BY_VIN } from "./price-comparison.fixtures";

// Note: FAQ is consolidated in vehicle-detail.fixtures.ts via getFaqForVin().

function buildFixture(
  vin: string,
  originationKind: keyof typeof ORIGINATION_FIXTURES
): VdpApiResponse {
  const vehicle = VDP_VEHICLES_BY_VIN[vin];
  if (!vehicle) {
    throw new Error(`No fixture for VIN: ${vin}`);
  }

  const priceComparison = PRICE_COMPARISON_BY_VIN[vin];
  if (!priceComparison) {
    throw new Error(`No price comparison fixture for VIN: ${vin}`);
  }

  return {
    data: {
      vehicle: {
        vin: vehicle.vin,
        vehicleId: vehicle.vehicleId,
        stockNumber: vehicle.stockNumber,
        vehicleInfo: vehicle.vehicleInfo,
        pricing: vehicle.pricing,
        status: vehicle.status,
        features: vehicle.features,
        packages: vehicle.packages,
        media: vehicle.media,
        warranty: vehicle.warranty,
        description: vehicle.description,
        updatedAt: vehicle.updatedAt,
        dealerInfo: vehicle.dealerInfo,
        soldAt: vehicle.soldAt ?? null,
        belowMarket: true,
        certification: (() => {
          const tier = resolveMockCertificationTier(
            vehicle.vin,
            vehicle.status.isCertified ?? false
          );
          if (!tier) {
            return null;
          }

          return buildVdpCertification({
            make: vehicle.vehicleInfo.make ?? "Toyota",
            model: vehicle.vehicleInfo.model ?? "Vehicle",
            tier,
          });
        })(),
        computed: {
          effectivePrice: vehicle.pricing.sellingPrice ?? vehicle.pricing.listPrice,
          horsepower: vehicle.vehicleInfo.model?.includes("Highlander") ? 243 : 219,
          seating: vehicle.vehicleInfo.model?.includes("Highlander") ? 7 : 5,
        },
      },
      pricingCard: priceComparison,
      dealer: {
        dealerCode: vehicle.dealerInfo.dealerCode,
        dealerName: vehicle.dealerInfo.dealerName,
        city: vehicle.dealerInfo.city ?? "",
        state: vehicle.dealerInfo.state ?? "",
        zipCode: vehicle.dealerInfo.zipCode ?? "",
        latitude: vehicle.dealerInfo.latitude,
        longitude: vehicle.dealerInfo.longitude,
        extended: {
          address: DEALER_BAY_RIDGE.address,
          phone: DEALER_BAY_RIDGE.phone,
          rating: DEALER_BAY_RIDGE.rating,
          hours: DEALER_BAY_RIDGE.hours,
          images: DEALER_BAY_RIDGE.images,
          testDrive: DEALER_BAY_RIDGE.testDrive ?? null,
        },
      },
      origination: ORIGINATION_FIXTURES[originationKind],
      similar: { results: [], totalCount: 0 },
      vehicleImages: VEHICLE_IMAGES_FIXTURE,
      marketing: {
        heading: "Buy with no hidden surprises",
        image: {
          src: "/images/vdp/buy-with-confidence.png",
          alt: "Two people smiling inside a Toyota vehicle on a coastal drive",
        },
        benefits: [
          {
            id: "seven-day-returns",
            title: "7-Day Returns",
            description: "Not quite a fit? Return it for a full refund, no questions asked.",
          },
          {
            id: "ninety-day-warranty",
            title: "Complimentary 90-Day Warranty",
            description: "Every car includes 90 days of free limited warranty coverage.",
          },
          {
            id: "no-hassle-pricing",
            title: "No-Hassle Pricing",
            description: "Set prices on every listing, so there's no guesswork.",
          },
        ],
      },
      faq: getFaqForVin(vin),
      threeSixtyManifestUrl: null,
    },
    meta: {
      traceId: "fixture-trace-id",
      timestamp: "2026-06-30T12:00:00.000Z",
    },
  };
}

/** S1: Default state — no origination, active vehicle */
export const VDP_RESPONSE_DEFAULT_FIXTURE = buildFixture(VDP_VINS.highlanderDefault, "none");

/** S2: Estimate state — payment estimate in progress */
export const VDP_RESPONSE_ESTIMATE_FIXTURE = buildFixture(VDP_VINS.rav4Estimate, "estimate");

/** S3: Offer state — active approved offer */
export const VDP_RESPONSE_OFFER_FIXTURE = buildFixture(VDP_VINS.highlanderOffer, "offer");

/** S4: Expired state — expired offer */
export const VDP_RESPONSE_EXPIRED_FIXTURE = buildFixture(VDP_VINS.highlanderExpired, "expired");

/** Sold state — vehicle sold, no origination */
export const VDP_RESPONSE_SOLD_FIXTURE = buildFixture(VDP_VINS.highlanderSold, "none");

/**
 * No-photos state — dealer has not uploaded gallery images.
 * Color data is read directly from vehicle.vehicleInfo (hex in exteriorColor / interiorColor).
 */
export const VDP_RESPONSE_NO_PHOTOS_FIXTURE = buildFixture(VDP_VINS.highlanderNoPhotos, "none");
