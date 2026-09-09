import type { Surface } from "@/lib/types";
import type { OklchColor } from "@/lib/bottom-average-color-types";

/**
 * Local type for normalized linear sRGB channels.
 * We keep this private to avoid reusing `RgbColor`, which is used elsewhere for 0-255 sRGB.
 */
type LinearRgb = {
  r: number;
  g: number;
  b: number;
};

/** Clamp to [0, 1] to keep luminance and contrast math valid. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(value, 1));
}

/** Convert OKLCH -> linear sRGB channels in the [0, 1] range. */
function oklchToLinearRgb({ l, c, h }: OklchColor): LinearRgb {
  const hueRadians = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRadians);
  const b = c * Math.sin(hueRadians);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  return {
    r: clamp01(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: clamp01(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: clamp01(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

/** Relative luminance (WCAG 2.x) from linear sRGB channels in the [0, 1] range. */
function relativeLuminanceFromLinearRgb({ r, g, b }: LinearRgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Classifies an OKLCH color as a light or dark surface by choosing
 * whichever text polarity yields better contrast.
 */
export function getSurfaceFromOklch(color: OklchColor): Surface {
  const luminance = relativeLuminanceFromLinearRgb(oklchToLinearRgb(color));
  const contrastWithDarkText = (luminance + 0.05) / 0.05;
  const contrastWithLightText = 1.05 / (luminance + 0.05);

  return contrastWithLightText > contrastWithDarkText ? "dark" : "light";
}
