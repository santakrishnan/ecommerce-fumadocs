"use client";

import type { Surface } from "@ucmp/ui";
import { Tabs, TabsList, TabsTrigger } from "@ucmp/ui";
import { Vehicle360Viewer } from "@ucmp/vehicle-360";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { HotspotData, ImageSection, ManifestHotspot } from "../../types/image-gallery";
import { HotspotOverlay } from "./hotspot-overlay";
import { ManifestHotspotOverlay } from "./manifest-hotspot-overlay";

interface GalleryTabBarProps {
  conditionHotspots?: HotspotData[];
  defaultImageAlt: string;
  /** Manifest hotspots for the fallback static image (when no 360 data). */
  defaultImageHotspots?: ManifestHotspot[];
  defaultImageUrl: string;
  /** Which image section this tab bar is on — filters hotspots accordingly */
  hotspotSection?: ImageSection;
  /** Surface context for hotspot popups — "light" for dark images, "dark" for light images */
  hotspotSurface?: Surface;
  keyFeaturesHotspots?: HotspotData[];
  threeSixtyManifestUrl: string | null;
}

/**
 * Gallery hero widget.
 *
 * Renders a tab bar with a single "360° view" tab (always selected).
 * All hotspot types (feature + condition) are shown together without filtering.
 *
 * Falls back to a static image + hotspot overlay when no 360 manifest is available.
 */
function GalleryTabBar({
  conditionHotspots,
  defaultImageAlt,
  defaultImageHotspots,
  defaultImageUrl,
  hotspotSection = "exterior",
  hotspotSurface = "light",
  keyFeaturesHotspots,
  threeSixtyManifestUrl,
}: GalleryTabBarProps) {
  const [resolvedManifestUrl, setResolvedManifestUrl] = useState(threeSixtyManifestUrl);

  useEffect(() => {
    setResolvedManifestUrl(threeSixtyManifestUrl);
  }, [threeSixtyManifestUrl]);

  return (
    <Tabs
      className="absolute inset-0 flex flex-col gap-0"
      data-slot="gallery-tab-bar"
      defaultValue="360-view"
    >
      {/* Single tab — comes first in DOM so keyboard users reach it before hotspot pins */}
      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
        <TabsList className="h-auto p-1" data-surface="dark" variant="pill">
          <TabsTrigger className="h-10 min-h-0 px-4" value="360-view">
            360° view
          </TabsTrigger>
        </TabsList>
      </div>

      {/*
       * 360 data available: Vehicle360Viewer with ALL hotspot types combined
       *   (no hotspotTypeFilter — feature + condition rendered together).
       * No 360 data: static image fallback with manifest hotspots, or legacy
       *   fixture hotspots (key-features + condition combined) as last resort.
       */}
      <div className="relative m-0 min-h-0 flex-1 p-0">
        {resolvedManifestUrl ? (
          <Vehicle360Viewer
            className="absolute inset-0"
            fillContainer={true}
            manifestUrl={resolvedManifestUrl}
            onError={() => setResolvedManifestUrl(null)}
            showHotspots={true}
          />
        ) : (
          <div className="relative h-full w-full">
            <Image
              alt={defaultImageAlt}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 1018px, 100vw"
              src={defaultImageUrl}
            />
            {/* Prefer manifest hotspots; fall back to combined fixture hotspots */}
            {defaultImageHotspots && defaultImageHotspots.length > 0 ? (
              <ManifestHotspotOverlay hotspots={defaultImageHotspots} />
            ) : (
              <>
                {keyFeaturesHotspots && keyFeaturesHotspots.length > 0 && (
                  <HotspotOverlay
                    hotspots={keyFeaturesHotspots}
                    section={hotspotSection}
                    surface={hotspotSurface}
                  />
                )}
                {conditionHotspots && conditionHotspots.length > 0 && (
                  <HotspotOverlay
                    hotspots={conditionHotspots}
                    section={hotspotSection}
                    surface={hotspotSurface}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Tabs>
  );
}

export type { GalleryTabBarProps };
export { GalleryTabBar };
