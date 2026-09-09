"use client";

import { GradientImage, getSurfaceFromOklch, parseOklchCss } from "@ucmp/ui";
import Image from "next/image";
import { useRef } from "react";

/**
 * Minimum share of the card height the vehicle photo should fill (0–100).
 * The photo's natural ratio only fills ~56% of the portrait card, leaving a
 * large gradient band below. Raising this makes the image box taller so
 * `object-cover` scales the vehicle up to fill it — cropping the empty
 * turntable margins on the left/right and pushing the vehicle near the bottom.
 * Higher = more of the photo shown / smaller gradient, but more side crop.
 */
const IMAGE_FILL_PERCENT = 65;

export interface GradientCardImageProps {
  alt: string;
  aspectRatio: number | string;
  /** Mark as LCP image — loads eagerly without lazy loading. */
  priority?: boolean;
  sizes: string;
  src: string;
  style?: React.CSSProperties;
}

/**
 * Client island that renders a GradientImage and dynamically sets
 * `data-surface` on the nearest `[data-slot="card-root"]` ancestor
 * based on the sampled gradient color's luminance.
 *
 * - Light sampled color → `data-surface="light"` → dark text
 * - Dark sampled color → `data-surface="dark"` → light text
 */
export function GradientCardImage({
  alt,
  aspectRatio,
  priority,
  sizes,
  src,
  style,
}: GradientCardImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleColorSampled(color: string) {
    const parsedColor = parseOklchCss(color);
    if (!parsedColor) {
      return;
    }

    const surface = getSurfaceFromOklch(parsedColor);

    // Set data-surface on the card-root for text color contrast.
    const cardRoot = containerRef.current?.closest('[data-slot="card-root"]');
    if (cardRoot) {
      cardRoot.setAttribute("data-surface", surface);
    }

    // Match wrapper bg to prevent card surface color leaking during hover scale.
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = color;
    }
  }

  return (
    <div className="absolute inset-0" ref={containerRef}>
      <GradientImage
        aspectRatio={aspectRatio}
        blendHeightPercent={25}
        className="size-full"
        image={
          <Image
            alt={alt}
            className="object-cover object-top"
            fill
            priority={priority}
            sizes={sizes}
            src={src}
            style={style}
          />
        }
        minImageHeightPercent={IMAGE_FILL_PERCENT}
        onColorSampled={handleColorSampled}
        overrideColor="var(--carcutter-gradient-color)"
      />
    </div>
  );
}
