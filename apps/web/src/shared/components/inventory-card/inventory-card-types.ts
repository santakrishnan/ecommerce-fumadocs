import type { CardBadgeIconName } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";

/** Badge data shape — mirrors what the API returns for inventory badges. */
export interface InventoryBadgeData {
  iconName?: CardBadgeIconName;
  label: string;
}

/**
 * Flattened vehicle type used across search and landing card components.
 *
 * Fields are mapped from the SDK `InventoryCard` shape by the BFF search mapper.
 * FE-only fields (`badge`, `href`, `surface`) have no SDK counterpart and are
 * populated by the mapper or the component layer.
 *
 * TODO: align the landing feature's `VehicleCard` Zod schema with this interface
 * so the two types share a single source of truth.
 */
export interface Vehicle {
  /** Maps to `VehicleDetail.description` (AI-generated). */
  aiDescription?: string;
  /** FE-only — badge displayed on the card surface. */
  badge?: InventoryBadgeData;
  /** FE-only — detail page URL for the card link. */
  href?: string;
  /** Maps to `InventoryCard.vin`. Kept as `id` for backward compatibility with card components. */
  id: string;
  /** Maps to `InventoryCard.media.photos?.[0]?.url`. */
  imageUrl: string;
  /** Maps to `InventoryCard.vehicleInfo.make`. */
  make: string;
  /** Maps to `InventoryCard.status.mileage`. */
  mileage: number;
  /** Maps to `InventoryCard.vehicleInfo.model`. */
  model: string;
  /** Maps to `InventoryCard.pricing.msrp` when available. */
  originalPrice?: number;
  /** Maps to `InventoryCard.pricing.listPrice`. */
  price: number;
  /** @deprecated Use `showSaveButton` on the card props instead. */
  showBadge?: boolean;
  /** FE-only — controls card color scheme. */
  surface?: Surface;
  /** Maps to `InventoryCard.vehicleInfo.trim`. */
  trim?: string;
  /** Maps to `InventoryCard.vin`. */
  vin?: string;
  /** Maps to `InventoryCard.vehicleInfo.year`. */
  year: number;
}
