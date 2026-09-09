import { ROUTES } from "@config/routes/constants";
import type { Vehicle } from "@shared/components/inventory-card";
import { normalizeImageUrl, resolveHeroImageUrl } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing";
import type { InventoryCard } from "../agent-search-turns-collection";
import { resolveCardBadge, type V360VehicleData } from "../vehicle-badges";

export function mapInventoryCardToInventoryCard(card: InventoryCard): Vehicle {
  // Derives the card badge from computed.comparisonAxes.keyFeatures / dealRating /
  // certification, ranked by customer value (see vehicle-badges).
  const badge = resolveCardBadge(card as unknown as V360VehicleData);

  // Pick the photo with the lowest filename prefix when falling back from primaryImageUrl.
  const photos = card.media?.photos ?? [];
  return {
    id: card.vin,
    make: card.vehicleInfo.make,
    model: card.vehicleInfo.model,
    year: card.vehicleInfo.year,
    trim: card.vehicleInfo.trim,
    price: resolveDisplayPrice(card.pricing),
    originalPrice: card.pricing.originalPrice,
    mileage: card.status?.mileage ?? card.vehicleInfo.mileage ?? 0,
    imageUrl: normalizeImageUrl(card.media?.primaryImageUrl ?? resolveHeroImageUrl(photos)),
    href:
      ROUTES.vdpSafe({
        make: card.vehicleInfo.make,
        model: card.vehicleInfo.model,
        trim: card.vehicleInfo.trim ?? "",
        year: card.vehicleInfo.year,
        vin: card.vin,
      }) ?? undefined,
    surface: card.surface,
    aiDescription: card.aiDescription,
    badge,
  };
}
