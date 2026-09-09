"use client";

import { Hotspot, HotspotContent, HotspotTrigger } from "@ucmp/ui";
import { useState } from "react";
import { type ImageBounds, normalizedToPixel } from "../lib/image-bounds";
import type { Hotspot as HotspotData } from "../types/composition-v3";

export interface HotspotOverlayProps {
  hotspots: HotspotData[];
  imageBounds: ImageBounds;
}

interface HotspotItemProps {
  hotspot: HotspotData;
  imageBounds: ImageBounds;
}

function HotspotItem({ hotspot, imageBounds }: HotspotItemProps) {
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { left, top } = normalizedToPixel(hotspot.position.x, hotspot.position.y, imageBounds);

  return (
    <Hotspot
      onOpenChange={(open, eventDetails) => {
        setIsHoverOpen(open);
        // On explicit dismissal (Escape, outside click), also clear focus-driven open
        if (!open && eventDetails.reason !== "trigger-hover") {
          setIsFocused(false);
        }
      }}
      open={isHoverOpen || isFocused}
    >
      <HotspotTrigger
        aria-label={hotspot.title}
        className="pointer-events-auto"
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        position={{ top: `${top}px`, left: `${left}px` }}
      />
      <HotspotContent className="max-w-64 flex-col items-start" side="top" surface="light">
        <p className="subhead-sm m-0">{hotspot.title}</p>
      </HotspotContent>
    </Hotspot>
  );
}

export function HotspotOverlay({ hotspots, imageBounds }: HotspotOverlayProps) {
  if (!hotspots.length) {
    return null;
  }

  return (
    <div aria-hidden={false} className="pointer-events-none absolute inset-0">
      {hotspots.map((hotspot) => (
        <HotspotItem
          hotspot={hotspot}
          imageBounds={imageBounds}
          key={`${hotspot.title}-${hotspot.position.x}-${hotspot.position.y}`}
        />
      ))}
    </div>
  );
}
