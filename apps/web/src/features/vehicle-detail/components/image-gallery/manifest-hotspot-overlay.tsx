"use client";

import { Hotspot, HotspotContent, HotspotTrigger } from "@ucmp/ui";
import { useState } from "react";
import type { ManifestHotspot } from "../../types/image-gallery";

interface ManifestHotspotOverlayProps {
  hotspots: ManifestHotspot[];
}

interface ManifestHotspotItemProps {
  hotspot: ManifestHotspot;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

/**
 * Single hotspot pin — opens on hover/focus, shows the full title.
 */
function ManifestHotspotItem({
  hotspot,
  isActive,
  onActivate,
  onDeactivate,
}: ManifestHotspotItemProps) {
  const left = Math.min(Math.max(hotspot.x * 100, 0), 100);
  const top = Math.min(Math.max(hotspot.y * 100, 0), 100);

  return (
    <Hotspot
      onOpenChange={(open) => {
        if (open) {
          onActivate();
        } else {
          onDeactivate();
        }
      }}
      open={isActive}
    >
      <HotspotTrigger
        aria-label={hotspot.title}
        className="pointer-events-auto"
        position={{ top: `${top}%`, left: `${left}%` }}
      />
      <HotspotContent className="max-w-64 flex-col items-start" side="top" surface="light">
        <p className="subhead-sm m-0">{hotspot.title}</p>
      </HotspotContent>
    </Hotspot>
  );
}

/**
 * Renders Car-Cutter manifest hotspot pins over a relatively-positioned image container.
 * Coordinates are normalized 0–1 and converted to CSS percentages.
 *
 * Only one popover is open at a time. The full hotspot title is shown on hover.
 */
function ManifestHotspotOverlay({ hotspots }: ManifestHotspotOverlayProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (hotspots.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Vehicle feature hotspots"
      className="pointer-events-none absolute inset-0 z-10"
      data-slot="manifest-hotspot-overlay"
    >
      {hotspots.map((hotspot, index) => (
        <ManifestHotspotItem
          hotspot={hotspot}
          isActive={activeIndex === index}
          key={`${hotspot.title}-${hotspot.x}-${hotspot.y}`}
          onActivate={() => setActiveIndex(index)}
          onDeactivate={() => setActiveIndex(null)}
        />
      ))}
    </section>
  );
}

export type { ManifestHotspotOverlayProps };
export { ManifestHotspotOverlay };
