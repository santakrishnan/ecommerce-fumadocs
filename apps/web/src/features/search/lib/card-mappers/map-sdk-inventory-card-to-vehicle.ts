import { ROUTES } from "@config/routes/constants";
import type { InventoryCardResponse } from "@features/search/bff/contracts/search-response.schema";
import type { Vehicle } from "@shared/components/inventory-card";
import { normalizeImageUrl, resolveHeroImageUrl } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing";
import { deriveInventoryCardSurface } from "../../data/inventory-card-image-surface";

/**
 * Maps an `InventoryCardResponse` (SDK `InventoryCard` + BFF-computed fields)
 * to the flat UI `Vehicle` shape, deriving FE-only fields.
 *
 * Price resolution uses `computed.effectivePrice` when present — the same
 * backend-canonical price the API sorts by — so displayed prices stay
 * consistent with the API's sort order. Falls through to sellingPrice →
 * listPrice → msrp via `resolveDisplayPrice` when `effectivePrice` is absent.
 */
export function mapSdkInventoryCardToVehicle(card: InventoryCardResponse): Vehicle {
  // Pick the photo with the lowest filename prefix as the hero image.
  // The filename prefix (digits before the first dash) is the canonical sort order.
  const primaryImageUrl = resolveHeroImageUrl(card.media?.photos ?? []);
  const resolvedPrice = resolveDisplayPrice({
    effectivePrice: card.computed?.effectivePrice,
    sellingPrice: card.pricing.sellingPrice,
    listPrice: card.pricing.listPrice,
    msrp: card.pricing.msrp,
  });
  return {
    id: card.vin,
    make: card.vehicleInfo.make,
    model: card.vehicleInfo.model,
    year: card.vehicleInfo.year,
    trim: card.vehicleInfo.trim,
    price: resolvedPrice,
    originalPrice:
      card.pricing.msrp != null && card.pricing.msrp > resolvedPrice
        ? card.pricing.msrp
        : undefined,
    mileage: card.status.mileage,
    imageUrl: normalizeImageUrl(primaryImageUrl),
    surface: deriveInventoryCardSurface(primaryImageUrl),
    href:
      ROUTES.vdpSafe({
        make: card.vehicleInfo.make,
        model: card.vehicleInfo.model,
        trim: card.vehicleInfo.trim ?? "",
        year: card.vehicleInfo.year,
        vin: card.vin,
      }) ?? undefined,
  };
}
