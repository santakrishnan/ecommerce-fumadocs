import type { RgbColor } from "@/lib/bottom-average-color-types";

/**
 * Computes an alpha-weighted average RGB color from image pixel data.
 * Transparent pixels contribute proportionally less than opaque pixels.
 * Returns `null` when all pixels are fully transparent (no color to sample).
 */
export function averageRgbFromPixelData(data: Uint8ClampedArray): RgbColor | null {
  let weightedR = 0;
  let weightedG = 0;
  let weightedB = 0;
  let alphaTotal = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = (data[index + 3] ?? 0) / 255;

    if (alpha <= 0) {
      continue;
    }

    weightedR += (data[index] ?? 0) * alpha;
    weightedG += (data[index + 1] ?? 0) * alpha;
    weightedB += (data[index + 2] ?? 0) * alpha;
    alphaTotal += alpha;
  }

  if (alphaTotal <= 0) {
    return null;
  }

  return {
    r: Math.round(weightedR / alphaTotal),
    g: Math.round(weightedG / alphaTotal),
    b: Math.round(weightedB / alphaTotal),
  };
}

