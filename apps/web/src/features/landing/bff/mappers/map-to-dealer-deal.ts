import { resolveHeroImageUrl } from "@shared/lib/media";
import type { DealerDeal } from "../../data/schemas/dealer-deal";
import type { VehicleDealResponse, VehicleDetail } from "../contracts/vehicle-deal.schema";

/**
 * Maps upstream vehicle detail + deal response into the DealerDeal UI contract.
 *
 * This mapper is a pure function — no side effects, no validation.
 * Validation is handled by the use-case layer after mapping.
 */
export function mapToDealerDeal(vehicle: VehicleDetail, deal: VehicleDealResponse): DealerDeal {
  const { vehicleInfo, pricing, status, media } = vehicle;

  return {
    vehicleId: vehicle.vin,
    year: vehicleInfo.year,
    make: vehicleInfo.make,
    model: vehicleInfo.model,
    trim: vehicleInfo.trim,
    mileage: status.mileage,
    imageUrl: resolveHeroImageUrl(media?.photos ?? []) ?? "/images/deal/four-runner-img.png",
    imageAlt:
      `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.trim ?? ""}`.trim(),
    askingPrice: pricing.sellingPrice ?? pricing.listPrice,
    financing: deal.financing,
    urgencyMessage: deal.urgencyMessage,
    buyNowHref: deal.buyNowHref,
  };
}
