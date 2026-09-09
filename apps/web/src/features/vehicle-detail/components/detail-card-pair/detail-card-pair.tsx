import type { VehicleImages } from "@features/vehicle-detail/__fixtures__";
import type { VehicleColorData } from "@features/vehicle-detail/bff/mappers/vehicle-info-to-color-data.mapper";
import { DetailImageCard } from "@features/vehicle-detail/components/detail-image-card";
import { COLOR_NOT_AVAILABLE_LABEL } from "@features/vehicle-detail/data/vdp-constants";

export interface DetailCardPairProps {
  /** Whether dealer-provided photos are available. */
  hasPhotos: boolean;
  /**
   * Color data from the /api/v1/vdp/{vin} response (vehicle.vehicleInfo).
   * When present and hasPhotos is false, provides hex swatches and display labels.
   */
  vehicleColorData?: VehicleColorData;
  /** Vehicle image data — used for interior/wheels cards when photos are available. */
  vehicleImages?: VehicleImages;
}

/**
 * DetailCardPair — a 2-column grid of medium detail cards.
 *
 * When photos are available, renders interior and wheels image cards.
 * When no photos exist, renders exterior and interior color swatch cards
 * using sanitized data from the BFF mapper (`vehicleColorData`).
 */
export function DetailCardPair({
  hasPhotos,
  vehicleColorData,
  vehicleImages,
}: DetailCardPairProps) {
  // Labels from API colorFamily fields
  const exteriorLabel = vehicleColorData?.exteriorColorFamily ?? COLOR_NOT_AVAILABLE_LABEL;
  const interiorLabel = vehicleColorData?.interiorColorFamily ?? COLOR_NOT_AVAILABLE_LABEL;

  // Swatch values — already validated/normalized by BFF mapper
  const exteriorSwatch = vehicleColorData?.exteriorColor;
  const interiorHex = vehicleColorData?.interiorColor;
  const interiorTextureImage = vehicleColorData?.interiorTextureImage;

  const cards =
    hasPhotos && vehicleImages
      ? [
          {
            badge: vehicleImages.interior.badge,
            imageAlt: vehicleImages.interior.label,
            imageUrl: vehicleImages.interior.imageUrl,
            label: vehicleImages.interior.label,
            subLabel: vehicleImages.interior.subLabel,
          },
          {
            badge: vehicleImages.wheels.badge,
            imageAlt: vehicleImages.wheels.label,
            imageUrl: vehicleImages.wheels.imageUrl,
            label: vehicleImages.wheels.label,
            subLabel: vehicleImages.wheels.subLabel,
          },
        ]
      : [
          {
            imageAlt: `Exterior color: ${exteriorLabel}`,
            label: exteriorLabel,
            subLabel: "Exterior color",
            swatchColor: exteriorSwatch,
          },
          {
            imageAlt: `Interior color: ${interiorLabel}`,
            label: interiorLabel,
            subLabel: "Interior",
            swatchColor: interiorTextureImage ? undefined : interiorHex || undefined,
            swatchImageUrl: interiorTextureImage || undefined,
          },
        ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <DetailImageCard key={`${card.subLabel}-${card.label}`} size="medium" {...card} />
      ))}
    </div>
  );
}
