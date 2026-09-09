"use client";

import React from "react";

import {
  DEFAULT_BOTTOM_COLOR_CSS,
  sampleBottomAverageColor,
} from "@/lib/bottom-strip-sampling";
import { parseOklchCss, toOklchCss } from "@/lib/color-converters";
import { concreteColorToOklch } from "@/lib/css-color";
import { cn } from "@/lib/utils";

const CSS_VAR_REGEX = /^var\(\s*(--[\w-]+)\s*(?:,[^)]+)?\)$/;

/**
 * Softens how quickly the gradient color ramps from transparent to solid
 * across the fade zone (whose height is controlled by `blendHeightPercent`).
 * - 0   → sharp, near-linear ramp (color comes in early).
 * - 0.5 → stays mostly transparent through the first half, then ramps in.
 * - →1  → very late, soft ramp (color barely appears until the bottom).
 */
const GRADIENT_EASE = 0.5;

/**
 * Builds `linear-gradient` color stops that fade transparent → solid across a
 * region ending at `fadeEndPercent`, then hold solid to 100%. GRADIENT_EASE
 * shifts the ramp later within that region so the color eases in more gently.
 */
function buildBlendStops(fadeEndPercent: number): string {
  const clampedEnd = Math.max(0, Math.min(100, fadeEndPercent));
  // Where the color begins to ramp in (later = softer).
  const holdPoint = clampedEnd * GRADIENT_EASE;
  // Midpoint of the ramp between the hold point and the fully-solid point.
  const midPoint = holdPoint + (clampedEnd - holdPoint) * 0.5;
  const color = "var(--gradient-image-color)";
  return [
    "transparent 0%",
    `color-mix(in oklch, ${color} 15%, transparent) ${holdPoint.toFixed(1)}%`,
    `color-mix(in oklch, ${color} 55%, transparent) ${midPoint.toFixed(1)}%`,
    `${color} ${clampedEnd.toFixed(1)}%`,
    `${color} 100%`,
  ].join(", ");
}

/** Shared props for both image modes. */
interface GradientImageBaseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Target aspect ratio. Accepts a number (`width / height`) or a string in
   * `"w/h"` format matching Tailwind's `aspect-*` convention (e.g. `"16/9"`, `"4/3"`).
   * @default "3/4"
   */
  aspectRatio?: number | string;
  /** Fraction of image height sampled from the bottom edge. @default 0.14 */
  sampleHeightRatio?: number;
  /**
   * Minimum share of the frame height the image box must occupy (0–100).
   * By default the box is sized to the photo's natural aspect ratio so the
   * whole photo shows uncropped; the remaining space becomes gradient. Raising
   * this forces a taller image box — `object-cover` then scales the photo up to
   * fill it, cropping the left/right margins and shrinking the gradient band.
   * @default 0
   */
  minImageHeightPercent?: number;
  /** Height of the blend gradient as a percentage of the image box. @default 10 */
  blendHeightPercent?: number;
  /** Force the bottom gradient overlay to render even when the image fills the frame; sampling stays unchanged. @default false */
  showGradient?: boolean;
  /** Fallback color used before sampling or if sampling fails. */
  fallbackColor?: string;
  /**
   * Explicit color to use for the bottom gradient/filler. When provided,
   * image sampling is skipped entirely. `onColorSampled` will still be called
   * with this value after the image loads.
   */
  overrideColor?: string;
  /** Called with a resolved `oklch(...)` color string after every successful image load. */
  onColorSampled?: (color: string) => void;
}

/** Use a default native `<img>` — provide `src` and `alt`. */
interface GradientImageWithSrc extends GradientImageBaseProps {
  /** Image source URL. */
  src: string;
  /** Alternate text for the image. */
  alt: string;
  /** Classes applied on the `<img>` element. */
  imageClassName?: string;
  image?: never;
}

/** Use a custom image element (e.g. `next/image`) — the element must fire `onLoad`. */
interface GradientImageWithElement extends GradientImageBaseProps {
  /**
   * Custom image element to render (e.g. `next/image` with `fill`).
   * The element must fire `onLoad` with an event whose `currentTarget` is an `HTMLImageElement`.
   */
  image: React.ReactElement;
  src?: never;
  alt?: never;
  imageClassName?: never;
}

export type GradientImageProps = GradientImageWithSrc | GradientImageWithElement;

/**
 * Renders an image within a fixed aspect-ratio frame. When the image does not
 * fill the frame, the remaining area is filled with a gradient sampled from the
 * image's bottom edge, creating a smooth visual transition.
 *
 * @example Default (native img)
 * ```tsx
 * <GradientImage src="/photo.jpg" alt="Product" aspectRatio={4/5} />
 * ```
 *
 * @example With next/image
 * ```tsx
 * <GradientImage
 *   aspectRatio={4/5}
 *   image={<Image src="/photo.jpg" alt="Product" fill sizes="448px" priority />}
 * />
 * ```
 */
function GradientImage({
  aspectRatio = "3/4",
  className,
  sampleHeightRatio = 0.14,
  minImageHeightPercent = 0,
  blendHeightPercent = 10,
  showGradient = false,
  fallbackColor = DEFAULT_BOTTOM_COLOR_CSS,
  overrideColor,
  onColorSampled,
  src,
  alt,
  imageClassName,
  image,
  style,
  ...props
}: GradientImageProps) {
  // Parse aspect ratio to a numeric value for height calculation
  const frameAspectRatio = typeof aspectRatio === "number"
    ? aspectRatio
    : (() => {
        const [w, h] = aspectRatio.split("/").map(Number);
        return (w && h) ? w / h : 3 / 4;
      })();
  // Only track the pixel-sampled color in state; overrideColor is derived each render
  // so that prop changes after mount (e.g. Storybook controls) are reflected immediately.
  const [sampledColor, setSampledColor] = React.useState(fallbackColor);
  const gradientColor = overrideColor ?? sampledColor;
  const [imageHeightPercent, setImageHeightPercent] = React.useState(100);
  // The outer wrapper — used as the cascade context when resolving CSS
  // variables so scoped/inherited custom properties resolve the same way they
  // do when the browser paints this element.
  const rootRef = React.useRef<HTMLDivElement>(null);

  /**
   * Resolve any CSS color the caller passes into a normalized `oklch(...)`
   * string for `onColorSampled`:
   * - A concrete `oklch(...)` (e.g. a pixel-sampled color) is parsed directly.
   * - A `var(--token)` reference is looked up on the element's computed style,
   *   which returns the resolved declared value (honoring scoped/inherited
   *   definitions). Theme tokens authored in `oklch()` compile down to `lab()`
   *   or hex, so `concreteColorToOklch` rasterizes them back to a color.
   */
  function resolveOklchColor(color: string): string | undefined {
    const direct = parseOklchCss(color);
    if (direct) {
      return toOklchCss(direct);
    }

    const cssVarMatch = color.match(CSS_VAR_REGEX);
    if (cssVarMatch && typeof window !== "undefined") {
      const varName = cssVarMatch[1]!;
      // Prefer the element's own computed style (honors scoped ancestors like
      // `[data-surface]`), then fall back to documentElement.
      for (const scope of [rootRef.current, document.documentElement]) {
        const resolved = scope
          ? concreteColorToOklch(getComputedStyle(scope).getPropertyValue(varName).trim())
          : undefined;
        if (resolved) {
          return resolved;
        }
      }
      return undefined;
    }

    // A concrete non-oklch color (hex, rgb, lab, named) passed directly.
    return concreteColorToOklch(color);
  }

  function getCallbackColor(...candidates: string[]): string {
    for (const candidate of candidates) {
      const resolved = resolveOklchColor(candidate);
      if (resolved) {
        return resolved;
      }
    }
    // Last resort: resolve the theme's neutral fallback, or hand back the CSS
    // var() reference itself (still valid for rendering; consumers that need a
    // concrete color simply skip an unparseable value).
    return resolveOklchColor(DEFAULT_BOTTOM_COLOR_CSS) ?? DEFAULT_BOTTOM_COLOR_CSS;
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;

    if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return;
    }

    // Compare image's intrinsic aspect ratio against the frame
    const sourceAspectRatio = img.naturalWidth / img.naturalHeight;

    // If image is wider (shorter) than the frame it takes less vertical space.
    // `minImageHeightPercent` lets callers force a taller box; object-cover then
    // scales the photo up to fill it, cropping the left/right margins.
    const nextImageHeightPercent = Math.min(
      100,
      Math.max((frameAspectRatio / sourceAspectRatio) * 100, minImageHeightPercent)
    );

    setImageHeightPercent(nextImageHeightPercent);

    // Always fire onColorSampled after a successful load, regardless of whether
    // the image fills the frame, so callers can reliably react to load events.
    if (overrideColor !== undefined) {
      // Defined-check: an empty string is a valid override — skip sampling entirely.
      onColorSampled?.(getCallbackColor(overrideColor, fallbackColor, sampledColor));
    } else if (nextImageHeightPercent < 100 || showGradient) {
      // Sample when the image leaves filler space, or when showGradient forces the
      // overlay to render even on a full-frame image.
      const color = sampleBottomAverageColor(img, { sampleHeightRatio });
      setSampledColor(color);
      onColorSampled?.(getCallbackColor(color, fallbackColor, sampledColor));
    } else {
      // Image fills the frame — no filler needed, report the current fallback color.
      onColorSampled?.(getCallbackColor(sampledColor, fallbackColor));
    }
  }

  // Build the image element — either the consumer-provided element with onLoad
  // merged, or a default native <img>.
  const imageElement = image
    ? React.cloneElement(
        image as React.ReactElement<Record<string, unknown>>,
        {
          onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => {
            handleImageLoad(event);
            const originalOnLoad = (image.props as { onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void }).onLoad;
            originalOnLoad?.(event);
          },
        }
      )
    : (
        <img
          alt={alt ?? ""}
          className={cn("size-full object-cover object-bottom", imageClassName)}
          data-slot="gradient-image-img"
          loading="lazy"
          onLoad={handleImageLoad}
          src={src ?? ""}
        />
      );

  return (
    <div
      {...props}
      ref={rootRef}
      className={cn("relative w-full overflow-hidden", className)}
      data-slot="gradient-image"
      style={
        {
          ...style,
          aspectRatio: typeof aspectRatio === "number" ? `${aspectRatio}` : aspectRatio.replace("/", " / "),
          "--gradient-image-color": gradientColor,
          "--gradient-image-blend-height": `${Math.max(0, Math.min(100, blendHeightPercent))}%`,
          backgroundColor: "var(--gradient-image-color)",
        } as React.CSSProperties
      }
    >
      <div className="relative h-full w-full" data-slot="gradient-image-frame">
        {/* Image — constrained to its natural height within the frame */}
        <div
          className="absolute top-0 right-0 left-0"
          data-slot="gradient-image-media"
          style={{ height: `${imageHeightPercent}%` }}
        >
          {imageElement}

          {/* Blend gradient overlaying the bottom of the image */}
          {(showGradient || imageHeightPercent < 100) && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0"
              data-slot="gradient-image-blend"
              style={{
                height: "var(--gradient-image-blend-height)",
                background: `linear-gradient(to bottom, ${buildBlendStops(100)})`,
              }}
            />
          )}
        </div>

        {/* Gradient overlay — spans from inside the image edge to the frame bottom.
         * No separate filler = no seam during scale transforms. */}
        {(showGradient || imageHeightPercent < 100) && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0"
            data-slot="gradient-image-blend"
            style={{
              top: `${Math.max(0, imageHeightPercent - blendHeightPercent)}%`,
              background: `linear-gradient(to bottom, ${buildBlendStops(
                Math.round(
                  (blendHeightPercent / (100 - Math.max(0, imageHeightPercent - blendHeightPercent))) *
                    100
                )
              )})`,
            }}
          />
        )}
      </div>

      {/* Hidden — kept for data-slot backwards compat */}
      <div
        aria-hidden="true"
        className="hidden"
        data-slot="gradient-image-filler"
      />
    </div>
  );
}

export { GradientImage };
