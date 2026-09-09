"use client";

import { Carousel, CarouselContent, CarouselItem } from "@ucmp/ui";
import Image from "next/image";

interface DealerGalleryProps {
  /** Static map thumbnail URL. */
  mapThumbnailUrl: string;
  /** Array of dealer photo URLs. */
  photos: string[];
}

/**
 * Dealer photo gallery.
 * - Desktop/Tablet: 2-column grid with the first (storefront) photo spanning
 *   2 rows on the left; map + secondary photo stacked on the right.
 * - Mobile: Carousel that bleeds right edge.
 */
export function DealerGallery({ photos, mapThumbnailUrl }: DealerGalleryProps) {
  const allPhotos = [...photos, ...(mapThumbnailUrl ? [mapThumbnailUrl] : [])];

  return (
    <>
      {/* Desktop/Tablet: left image full height, right 2 stacked */}
      <div className="hidden w-full md:flex md:aspect-728/445 md:gap-2">
        {photos[0] && (
          <div className="relative h-full w-1/2 overflow-hidden rounded-2xl">
            <Image
              alt="Dealership exterior"
              className="object-cover"
              fill
              sizes="50vw"
              src={photos[0]}
            />
          </div>
        )}
        <div className="flex w-1/2 flex-col gap-2">
          {mapThumbnailUrl && (
            <div className="relative h-1/2 w-full overflow-hidden rounded-2xl">
              <Image
                alt="Dealership location on map"
                className="object-cover"
                fill
                sizes="50vw"
                src={mapThumbnailUrl}
              />
            </div>
          )}
          {photos[1] && (
            <div className="relative h-1/2 w-full overflow-hidden rounded-2xl">
              <Image
                alt="Dealership photo 2"
                className="object-cover"
                fill
                sizes="50vw"
                src={photos[1]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Carousel bleeds right — single row, aspect-181/224 (Figma: 402px viewport) */}
      <div className="-mr-4 mb-15 md:hidden">
        <Carousel disableArrows>
          <CarouselContent>
            {allPhotos.map((url, index) => (
              <CarouselItem className="basis-[75vw]" key={url}>
                <div className="relative aspect-181/224 overflow-hidden rounded-2xl">
                  <Image
                    alt={
                      index < photos.length
                        ? `Dealership photo ${index + 1}`
                        : "Dealership location on map"
                    }
                    className="object-cover"
                    fill
                    sizes="75vw"
                    src={url}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </>
  );
}
