import { describe, expect, it } from "vitest";

import { averageRgbFromPixelData } from "@/lib/pixel-averaging";

describe("pixel-averaging", () => {
  it("returns alpha-weighted average for mixed pixels", () => {
    const data = new Uint8ClampedArray([
      // opaque red
      255, 0, 0, 255,
      // 50% green
      0, 255, 0, 128,
      // transparent blue contributes nothing
      0, 0, 255, 0,
    ]);

    expect(averageRgbFromPixelData(data)).toEqual({ r: 170, g: 85, b: 0 });
  });

  it("returns null when all pixels are fully transparent", () => {
    const data = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(averageRgbFromPixelData(data)).toBeNull();
  });
});

