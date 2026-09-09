import type { RgbColor } from "@/lib/bottom-average-color-types";
import { parseOklchCss, parseRgbCss, rgbToOklch, toOklchCss } from "@/lib/color-converters";

/**
 * Paint an already-resolved CSS color onto a 1×1 canvas and read the pixel back
 * as sRGB. This converts *any* color the browser can render into concrete RGB —
 * notably `lab()` and hex, which is what the theme's `oklch()` tokens compile
 * down to (`--carcutter-gradient-color: #ababab; ... lab(69.97% ...)`), so a
 * fast `oklch()`/`rgb()` string parse alone can't read them back. Returns
 * `undefined` when a 2D context is unavailable (e.g. jsdom) or the value isn't
 * a paintable color.
 */
export function cssColorToRgb(value: string): RgbColor | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return undefined;
    }
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const { data } = ctx.getImageData(0, 0, 1, 1);
    // A fully transparent pixel means the value wasn't a paintable color.
    if (data[3] === 0) {
      return undefined;
    }
    return { r: data[0]!, g: data[1]!, b: data[2]! };
  } catch {
    return undefined;
  }
}

/**
 * Convert a *concrete* (already var-resolved) CSS color string into a
 * normalized `oklch(...)` value. Tries a cheap `oklch()`/`rgb()` parse first,
 * then falls back to canvas rasterization for other color spaces the browser
 * may emit — `lab()`, `color(...)`, hex, or named colors. Returns `undefined`
 * for anything still unresolved (e.g. a literal `var(...)` token or `""`).
 */
export function concreteColorToOklch(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const oklch = parseOklchCss(value);
  if (oklch) {
    return toOklchCss(oklch);
  }
  const rgb = parseRgbCss(value) ?? cssColorToRgb(value);
  return rgb ? toOklchCss(rgbToOklch(rgb)) : undefined;
}
