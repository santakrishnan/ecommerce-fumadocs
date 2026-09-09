import Image from "next/image";
import type { HotspotData, VehicleImage } from "../../types/image-gallery";
import { GalleryTabBar } from "./gallery-tab-bar";
import { ManifestHotspotOverlay } from "./manifest-hotspot-overlay";

interface GalleryImageProps {
  conditionHotspots?: HotspotData[];
  image: VehicleImage;
  isHero: boolean;
  keyFeaturesHotspots?: HotspotData[];
  priority: boolean;
  threeSixtyManifestUrl: string | null;
}

function GalleryImage({
  conditionHotspots,
  image,
  isHero,
  keyFeaturesHotspots,
  priority,
  threeSixtyManifestUrl,
}: GalleryImageProps) {
  return (
    <div
      className="relative aspect-video max-h-[70vh] w-full overflow-hidden rounded-xl"
      data-slot="gallery-image"
    >
      {isHero ? (
        <GalleryTabBar
          conditionHotspots={conditionHotspots}
          defaultImageAlt={image.alt}
          defaultImageHotspots={image.hotspots}
          defaultImageUrl={image.url}
          hotspotSection={image.type}
          keyFeaturesHotspots={keyFeaturesHotspots}
          threeSixtyManifestUrl={threeSixtyManifestUrl}
        />
      ) : (
        <>
          <Image
            alt={image.alt}
            className="object-cover"
            fill
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            sizes="(min-width: 1024px) 1018px, 100vw"
            src={image.url}
          />
          {image.hotspots && image.hotspots.length > 0 && (
            <ManifestHotspotOverlay hotspots={image.hotspots} />
          )}
        </>
      )}
    </div>
  );
}

export type { GalleryImageProps };
export { GalleryImage };
