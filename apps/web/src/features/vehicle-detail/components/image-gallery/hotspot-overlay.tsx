"use client";

import type { Surface } from "@ucmp/ui";
import { Hotspot, HotspotContent, HotspotTrigger } from "@ucmp/ui";
import { useState } from "react";
import type { HotspotData, ImageSection } from "../../types/image-gallery";

interface HotspotOverlayProps {
  hotspots: HotspotData[];
  /** Filter hotspots by section — only renders pins matching this section */
  section?: ImageSection;
  surface?: Surface;
}

/**
 * Renders positioned hotspot pins over a relatively-positioned image container.
 * Only one tooltip can be open at a time — opening one closes the previous.
 * Coordinates are percentages (0–100) clamped to valid bounds.
 */
function HotspotOverlay({ hotspots, section, surface = "light" }: HotspotOverlayProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleOpenChange = (index: number, open: boolean) => {
    setActiveIndex(open ? index : null);
  };

  const filtered = section ? hotspots.filter((h) => h.section === section) : hotspots;

  if (!filtered || filtered.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Feature hotspots"
      className="pointer-events-none absolute inset-0 z-10"
      data-slot="hotspot-overlay"
    >
      {/* pointer-events-none on section prevents blocking image interactions;
          each HotspotTrigger re-enables via pointer-events-auto */}
      {filtered.map((hotspot, index) => {
        const x = Math.min(Math.max(hotspot.x, 0), 100);
        const y = Math.min(Math.max(hotspot.y, 0), 100);

        return (
          <Hotspot
            key={`${hotspot.label}-${x}-${y}`}
            onOpenChange={(open) => handleOpenChange(index, open)}
            open={activeIndex === index}
          >
            <HotspotTrigger
              aria-label={hotspot.label}
              className="pointer-events-auto"
              position={{ top: `${y}%`, left: `${x}%` }}
            />
            <HotspotContent surface={surface}>{hotspot.label}</HotspotContent>
          </Hotspot>
        );
      })}
    </section>
  );
}

export type { HotspotOverlayProps };
export { HotspotOverlay };
