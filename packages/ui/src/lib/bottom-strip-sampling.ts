import type { BottomStripSamplingOptions } from "@/lib/bottom-average-color-types";
import { rgbToOklch, toOklchCss } from "@/lib/color-converters";
import { averageRgbFromPixelData } from "@/lib/pixel-averaging";

/**
 * Fallback color as a CSS var() reference to the theme's neutral[600] token.
 * This keeps the fallback in sync with the active theme and avoids hardcoded values.
 */
export const DEFAULT_BOTTOM_COLOR_CSS = "var(--color-neutral-600)";

/**
 * Samples the bottom strip of an already-loaded image and returns a CSS oklch() color.
 * Returns a fallback when dimensions are invalid or pixel reads are blocked.
 */
export function sampleBottomAverageColor(
  image: HTMLImageElement,
  options: BottomStripSamplingOptions = {}
): string {
  const sampleHeightRatio = options.sampleHeightRatio ?? 0.14;
  const sampleWidth = options.sampleWidth ?? 160;

  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return DEFAULT_BOTTOM_COLOR_CSS;
  }

  const clampedHeightRatio = Math.max(0.01, Math.min(sampleHeightRatio, 1));
  const stripHeight = Math.max(1, Math.round(image.naturalHeight * clampedHeightRatio));
  const targetWidth = Math.max(1, Math.min(sampleWidth, image.naturalWidth));
  const targetHeight = Math.max(1, Math.round((stripHeight / image.naturalWidth) * targetWidth));

  try {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return DEFAULT_BOTTOM_COLOR_CSS;
    }

    context.drawImage(
      image,
      0,
      image.naturalHeight - stripHeight,
      image.naturalWidth,
      stripHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
    const rgb = averageRgbFromPixelData(imageData.data);

    if (!rgb) {
      return DEFAULT_BOTTOM_COLOR_CSS;
    }

    return toOklchCss(rgbToOklch(rgb));
  } catch {
    return DEFAULT_BOTTOM_COLOR_CSS;
  }
}

