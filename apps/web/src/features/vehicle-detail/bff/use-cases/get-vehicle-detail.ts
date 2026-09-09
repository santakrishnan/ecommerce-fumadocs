import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import { getFaqForVin } from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { VEHICLE_IMAGES_FIXTURE } from "@features/vehicle-detail/__fixtures__/vehicle-images.fixture";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import { connection } from "next/server";
import { normalizeLocalhostImageUrl } from "utils";
import { BELOW_MARKET_VINS } from "../../__fixtures__/vdp-demo-registry";
import type { Origination } from "../../types";
import type { DealerExtended } from "../contracts/dealer-detail.schema";
import type { VdpApiResponse, VdpSimilarVehicles } from "../contracts/vdp-response.schema";
import { createVdpError, mapCaughtToVdpError, type VdpError } from "../errors/vdp.errors";
import { mapVehicleToVdpData } from "../mappers/vehicle-to-vdp.mapper";
import { mockDealerDetail } from "../services/dealer-detail-mock";
import { fetchDealerDetail } from "../services/dealer-detail-upstream";
import { mockOrigination } from "../services/origination-mock";
import { mockSimilarVehicles } from "../services/similar-vehicles-mock";
import { mockVehicleEnrichment } from "../services/vehicle-enrichment-mock";
import { mockVehicleLookup } from "../services/vehicle-lookup-mock";
import { fetchVehicleLookup } from "../services/vehicle-lookup-upstream";

/**
 * Returns the BFF-relative URL for the 360° manifest proxy.
 * The actual CDN URL and gallery hash live in the Route Handler so they
 * are never exposed in client bundles.
 */
function buildThreeSixtyManifestUrl(vin: string): string {
  return `/api/v1/vehicles/${encodeURIComponent(vin.toUpperCase())}/360`;
}

/** Extract fulfilled value or return a default — removes ternary complexity from the orchestrator. */
function settledOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/** Ensures dealer extended always includes a map-thumbnail image for the purchase card. */
function ensureMapThumbnail(
  dealerExtended: DealerExtended | null,
  dealerInfo: { city?: string; state?: string; zipCode?: string }
): DealerExtended {
  const MAP_THUMBNAIL_FALLBACK = {
    type: "map-thumbnail" as const,
    url: "/images/vdp/purchase-card-map.png",
    alt: "Dealer map thumbnail",
  };

  if (dealerExtended) {
    const hasMapThumb = dealerExtended.images?.some((img) => img.type === "map-thumbnail");
    return {
      ...dealerExtended,
      images: hasMapThumb
        ? dealerExtended.images
        : [...(dealerExtended.images ?? []), MAP_THUMBNAIL_FALLBACK],
    };
  }

  return {
    address: {
      line1: "",
      city: dealerInfo.city ?? "",
      state: dealerInfo.state ?? "",
      zip: dealerInfo.zipCode ?? "",
    },
    images: [MAP_THUMBNAIL_FALLBACK],
  };
}

export interface GetVehicleDetailInput {
  /**
   * Temporary Dealer's Deal workaround that bypasses the VDP mock flag until
   * its requirements and API contract are released. Remove it once supported.
   */
  forceMock?: boolean;
  /** Optional trace ID for upstream correlation. Generated internally if not provided. */
  traceId?: string;
  vin: string;
  visitorId: string | null;
}

export type GetVehicleDetailResult =
  | { success: true; data: VdpApiResponse }
  | { success: false; error: VdpError };

/**
 * VDP orchestrator use-case.
 * Looks up vehicle, fetches dealer/origination in parallel, assembles response.
 * Failures in enrichment calls degrade gracefully to defaults.
 *
 * This is the canonical implementation for all vehicle detail lookups (ADR-9).
 * Both `/api/v1/vdp/[vin]` and `/api/v1/vehicles/[vin]` delegate to this function.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrator with mock/live branching and parallel enrichment
export async function getVehicleDetail(
  input: GetVehicleDetailInput
): Promise<GetVehicleDetailResult> {
  const { vin, visitorId } = input;
  const service = resolveBedService("vehicle-detail");
  const useMocks = input.forceMock === true || env.USE_VDP_MOCKS === "true";

  // ── Step 1: Vehicle lookup ──────────────────────────────────────────────────

  try {
    // Await connection() so crypto.randomUUID() is never called synchronously
    // during Next.js 16 PPR prerender. connection() signals that this function
    // requires a real request and cannot be statically prerendered.
    await connection();
    const traceId = input.traceId ?? crypto.randomUUID();

    let vehicleResult: Awaited<ReturnType<typeof mockVehicleLookup>> | null;

    // Mock toggle WINS over a configured upstream (see .env.local.example:
    // "USE_*_MOCKS=true → mock; else API_UPSTREAM_URL + key → real; else 503").
    // Checking `useMocks` first lets a developer force fixtures for the whole
    // VDP feature, or an independently fixture-backed caller, even when
    // API_UPSTREAM_URL is set for other services.
    if (useMocks) {
      vehicleResult = await mockVehicleLookup(vin);
    } else if (service) {
      vehicleResult = await fetchVehicleLookup(service, vin, traceId, { visitorId });
    } else {
      vehicleResult = null;
    }

    if (!vehicleResult) {
      return {
        success: false,
        error: createVdpError(
          "VDP_UPSTREAM_UNAVAILABLE",
          "API_UPSTREAM_URL is not configured and USE_VDP_MOCKS is not enabled",
          HTTP_STATUS_SERVICE_UNAVAILABLE
        ),
      };
    }

    // VIN not found — return 404 with no response data
    if (!vehicleResult.success) {
      return {
        success: false,
        error: createVdpError("VDP_NOT_FOUND", `Vehicle not found for VIN: ${vin}`, 404),
      };
    }

    const vehicle = vehicleResult.data;
    const dealerCode = vehicle.dealerInfo.dealerCode;

    // ── Step 2: Parallel enrichment (all optional) ──────────────────────────────

    let dealerPromise: Promise<DealerExtended | null>;
    let originationPromise: Promise<Origination>;
    let similarPromise: Promise<VdpSimilarVehicles>;

    // Same precedence as the vehicle lookup above: the mock toggle wins over a
    // configured upstream so enrichment stays consistent with the lookup source.
    if (useMocks) {
      dealerPromise = mockDealerDetail(dealerCode);
      originationPromise = mockOrigination(vin, visitorId);
      similarPromise = mockSimilarVehicles(
        vehicle.vehicleInfo.make,
        vehicle.vehicleInfo.bodyStyle,
        vin
      );
    } else if (service) {
      dealerPromise = fetchDealerDetail(service.baseUrl, dealerCode, traceId);
      // Origination API not yet available upstream — use mock registry for demo states
      originationPromise = mockOrigination(vin, visitorId);
      similarPromise = Promise.resolve({ results: [], totalCount: 0 });
    } else {
      dealerPromise = Promise.resolve(null);
      originationPromise = Promise.resolve({ kind: "none" } as Origination);
      similarPromise = Promise.resolve({ results: [], totalCount: 0 });
    }

    const [dealerResult, originationResult, similarResult] = await Promise.allSettled([
      dealerPromise,
      originationPromise,
      similarPromise,
    ]);

    // Extract results with graceful defaults
    const dealerExtended = settledOr(dealerResult, null);
    const origination = settledOr(originationResult, { kind: "none" } as Origination);
    const similar = settledOr(similarResult, { results: [], totalCount: 0 });

    // Ensure dealer extended always includes a map-thumbnail image for the purchase card
    const ensuredDealerExtended = ensureMapThumbnail(dealerExtended, vehicle.dealerInfo);
    // In production these will come from real upstream services alongside the
    // dealer/origination calls above.
    const enrichment = await mockVehicleEnrichment(vehicle).catch(() => null);
    const belowMarket = BELOW_MARKET_VINS.has(vin.toUpperCase());

    // Mock-only detail card images (exterior/interior/wheels) — excluded from live responses
    const mockVehicleImages =
      useMocks && (vehicle.media?.photos?.length ?? 0) > 0 ? VEHICLE_IMAGES_FIXTURE : undefined;

    // ── Step 3: Assemble response ─────────────────────────────────────────────

    const vehicleData = mapVehicleToVdpData(vehicle, {
      belowMarket,
      certification: enrichment?.certification ?? null,
      computed: vehicle.computed ?? enrichment?.computed ?? {},
      aiContent: enrichment?.aiContent ?? null,
    });

    const response: VdpApiResponse = {
      data: {
        vehicle: vehicleData,
        pricingCard: enrichment?.pricingCard ?? null,
        dealer: {
          dealerCode: vehicle.dealerInfo.dealerCode,
          dealerName: vehicle.dealerInfo.dealerName,
          city: vehicle.dealerInfo.city ?? "",
          state: vehicle.dealerInfo.state ?? "",
          zipCode: vehicle.dealerInfo.zipCode ?? "",
          latitude: vehicle.dealerInfo.latitude,
          longitude: vehicle.dealerInfo.longitude,
          extended: ensuredDealerExtended,
        },
        origination,
        similar,
        vehicleImages: mockVehicleImages,
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
        threeSixtyManifestUrl:
          env.USE_VDP_MOCKS === "true" ? buildThreeSixtyManifestUrl(vin) : null,
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
      },
    };

    return { success: true, data: response };
  } catch (error: unknown) {
    return { success: false, error: mapCaughtToVdpError(error) };
  }
}

/**
 * Transform canonical VDP response to Landing/Welcome Back response shape.
 *
 * Documented adapter (ADR-9) that preserves Landing-specific response contract
 * while delegating vehicle lookup to the canonical Vehicle Detail BFF use-case.
 * This ensures a single source of truth for vehicle data retrieval while allowing
 * each route to return the shape its consumers expect.
 *
 * Used by `/api/v1/vehicles/[vin]` to adapt VDP response for Welcome Back consumers.
 */
export function transformVdpToWelcomeBackShape(vdpData: VdpApiResponse) {
  const { data } = vdpData;
  const vehicle = data.vehicle;

  if (!vehicle) {
    return {
      error: {
        code: "VEHICLE_NOT_FOUND",
        message: "Vehicle data unavailable",
      },
    };
  }

  return {
    vin: vehicle.vin,
    vehicleInfo: {
      year: vehicle.vehicleInfo.year,
      make: vehicle.vehicleInfo.make,
      model: vehicle.vehicleInfo.model,
      trim: vehicle.vehicleInfo.trim,
      bodyStyle: vehicle.vehicleInfo.bodyStyle,
      drivetrain: vehicle.vehicleInfo.drivetrain,
      fuelType: vehicle.vehicleInfo.fuelType,
      engine: vehicle.vehicleInfo.engine,
    },
    pricing: {
      msrp: vehicle.pricing.msrp ?? undefined,
      listPrice: vehicle.pricing.listPrice,
      sellingPrice: vehicle.pricing.sellingPrice ?? undefined,
    },
    status: {
      vehicleStatus: vehicle.status.vehicleStatus,
      mileage: vehicle.status.mileage,
    },
    // Prefer enriched dealer data when available; fall back to vehicle.dealerInfo
    // (always present on the upstream VehicleDetail shape) so dealerCode and
    // dealerName are never empty strings, which would violate the
    // vehicleDealerInfoSchema .min(1) constraints.
    dealerInfo: {
      dealerCode: data.dealer?.dealerCode ?? vehicle.dealerInfo.dealerCode,
      dealerName: data.dealer?.dealerName ?? vehicle.dealerInfo.dealerName,
      city: data.dealer?.city ?? vehicle.dealerInfo.city ?? "",
      state: data.dealer?.state ?? vehicle.dealerInfo.state ?? "",
      zipCode: data.dealer?.zipCode ?? vehicle.dealerInfo.zipCode ?? "",
    },
    media: vehicle.media
      ? {
          photos: (vehicle.media.photos ?? []).map((photo, index) => ({
            // Only strip localhost/loopback origins so next/image treats them
            // as local paths. External CDN URLs (and their query params) are
            // preserved as-is.
            url: normalizeLocalhostImageUrl(photo.url),
            // The Welcome Back contract requires a concrete 1-based order.
            // Fall back to array position when the upstream item omits it.
            displayOrder: photo.displayOrder ?? index + 1,
          })),
          videos: (vehicle.media.videos ?? []).map((video, index) => ({
            url: video.url,
            displayOrder: video.displayOrder ?? index + 1,
          })),
        }
      : { photos: [], videos: [] },
  };
}
