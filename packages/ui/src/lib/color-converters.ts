import type { OklchColor, RgbColor } from "@/lib/bottom-average-color-types";

/** Regex for the CSS `oklch()` function with lightness in percent or unitless form. */
const OKLCH_CSS_REGEX =
  /^oklch\(\s*([0-9.]+)(%)?\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*[0-9.]+)?\s*\)$/i;

/**
 * Regex for the CSS `rgb()`/`rgba()` function. Accepts both comma- and
 * space-separated channels (`rgb(255, 0, 0)` and `rgb(255 0 0)`); any alpha
 * value is matched but ignored.
 */
const RGB_CSS_REGEX = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;

/** Convert a hex color string to RGB (0-255). Returns `undefined` when invalid. */
export function hexToRgb(hex: string): RgbColor | undefined {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return undefined;
  }
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

/** Parse a CSS `oklch()` string into an `OklchColor`. Returns `undefined` when invalid. */
export function parseOklchCss(color: string): OklchColor | undefined {
  const result = OKLCH_CSS_REGEX.exec(color.trim());
  if (!result) {
    return undefined;
  }

  const lightness = Number.parseFloat(result[1]!);
  return {
    l: result[2] === "%" ? lightness / 100 : lightness,
    c: Number.parseFloat(result[3]!),
    h: Number.parseFloat(result[4]!),
  };
}

/**
 * Parse a CSS `rgb()`/`rgba()` string into an `RgbColor` (0-255). Alpha is
 * ignored. Returns `undefined` when invalid. Useful for reading back the
 * concrete color a browser produces from `getComputedStyle(...).color`.
 */
export function parseRgbCss(color: string): RgbColor | undefined {
  const result = RGB_CSS_REGEX.exec(color.trim());
  if (!result) {
    return undefined;
  }

  const r = Math.round(Number.parseFloat(result[1]!));
  const g = Math.round(Number.parseFloat(result[2]!));
  const b = Math.round(Number.parseFloat(result[3]!));
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return undefined;
  }
  return { r, g, b };
}

function srgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Linear RGB -> OKLab (Bjorn Ottosson's method) */
function linearRgbToOklab(r: number, g: number, b: number) {
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** OKLab -> OKLCH */
function oklabToOklch(L: number, a: number, b: number): OklchColor {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;

  if (h < 0) {
    h += 360;
  }

  return { l: L, c, h };
}

/** Convert an sRGB triplet (0-255) to OKLCH. */
export function rgbToOklch({ r, g, b }: RgbColor): OklchColor {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const { L, a, b: labB } = linearRgbToOklab(lr, lg, lb);

  return oklabToOklch(L, a, labB);
}

/** Format an OKLCH color as a CSS oklch() value. */
export function toOklchCss({ l, c, h }: OklchColor): string {
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${h.toFixed(2)})`;
}

/** Convert a numeric rgb triplet into CSS color syntax. */
export function toRgbCss({ r, g, b }: RgbColor): string {
  return `rgb(${r} ${g} ${b})`;
}

