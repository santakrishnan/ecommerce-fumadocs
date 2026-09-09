import type {
  VdpAiContent,
  VdpCertification,
  VdpComputed,
  VdpVehicleData,
} from "../contracts/vdp-response.schema";
import type { VehicleDetailWithSoldAt } from "../contracts/vehicle-detail-with-sold-at";

export interface VdpEnrichmentInput {
  aiContent: VdpAiContent | null;
  belowMarket: boolean;
  certification: VdpCertification | null;
  computed: VdpComputed;
}

/**
 * Pure mapper — transforms an upstream VehicleDetail + pre-resolved enrichments
 * into the VDP response shape. Image URLs are expected to already be absolute
 * (prefixed with NEXT_PUBLIC_IMAGE_BASE_URL at the fixture/mock layer).
 *
 * Color data is passed through verbatim from vehicleInfo — the API now returns
 * hex values directly in exteriorColor / interiorColor, and interiorTextureImage
 * as a fallback when the interior hex is absent.
 */
export function mapVehicleToVdpData(
  vehicle: VehicleDetailWithSoldAt,
  enrichment: VdpEnrichmentInput
): VdpVehicleData {
  return {
    aiContent: enrichment.aiContent,
    belowMarket: enrichment.belowMarket,
    certification: enrichment.certification,
    computed: enrichment.computed,
    dealerInfo: vehicle.dealerInfo,
    description: vehicle.description,
    features: vehicle.features,
    media: vehicle.media,
    packages: vehicle.packages,
    pricing: vehicle.pricing,
    soldAt: vehicle.soldAt ?? null,
    status: vehicle.status,
    stockNumber: vehicle.stockNumber,
    updatedAt: vehicle.updatedAt,
    vehicleId: vehicle.vehicleId,
    vehicleInfo: vehicle.vehicleInfo,
    vin: vehicle.vin,
    warranty: vehicle.warranty,
  };
}
