import { ROUTES } from "@config/routes/constants";
import type { Vehicle } from "@shared/components/inventory-card";
import { normalizeImageUrl, resolveHeroImageUrl } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing";
import type { InventoryCardResponse } from "../contracts/search-response.schema";

/**
 * Maps an upstream SDK `InventoryCard` response to the flat {@link Vehicle}
 * shape consumed by the client.
 *
 * Responsibilities:
 * - Flattens nested `vehicleInfo` / `pricing` / `status` / `media` fields.
 * - Derives `href` via the canonical VDP route builder (returns `undefined`
 *   when the VIN is absent or fails the ISO 3779 check).
 * - Maps `description` → `aiDescription`.
 * - Normalises image URLs for localhost dev environments.
 * - Falls back to a local vehicle image (by make/model/trim) when the upstream
 *   response carries no usable photo.
 * - FE-only fields (`badge`, `surface`) are not set here — they have no SDK
 *   counterpart and must be provided by the caller if needed.
 */
export function mapInventoryCardResponseToVehicle(card: InventoryCardResponse): Vehicle {
  /*const imageFallback = resolveVehicleImage({
    make: card.vehicleInfo.make,
    model: card.vehicleInfo.model,
    year: card.vehicleInfo.year,
    trim: card.vehicleInfo.trim,
  });*/

  // Pick the photo with the lowest filename prefix as the hero image.
  // The filename prefix (digits before the first dash) is the canonical sort order.
  const heroPhotoUrl = resolveHeroImageUrl(card.media?.photos ?? []);

  // Price precedence: resolved by shared utility (effectivePrice → sellingPrice → listPrice).
  const price = resolveDisplayPrice({
    effectivePrice: card.computed?.effectivePrice,
    sellingPrice: card.pricing.sellingPrice,
    listPrice: card.pricing.listPrice,
  });

  return {
    id: card.vin,
    vin: card.vin,
    make: card.vehicleInfo.make,
    model: card.vehicleInfo.model,
    year: card.vehicleInfo.year,
    trim: card.vehicleInfo.trim,
    price,
    originalPrice: card.pricing.msrp ?? undefined,
    mileage: card.status.mileage,
    imageUrl: normalizeImageUrl(heroPhotoUrl),
    aiDescription: card.description,
    href:
      ROUTES.vdpSafe({
        make: card.vehicleInfo.make,
        model: card.vehicleInfo.model,
        trim: card.vehicleInfo.trim,
        year: card.vehicleInfo.year,
        vin: card.vin,
      }) ?? undefined,
  };
}
