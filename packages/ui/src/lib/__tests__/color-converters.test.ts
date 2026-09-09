import { describe, expect, it } from "vitest";

import { hexToRgb, rgbToOklch, toOklchCss, toRgbCss } from "@/lib/color-converters";

describe("color-converters", () => {
  it("converts a hex color string to rgb channels", () => {
    expect(hexToRgb("#2d73dc")).toEqual({ r: 45, g: 115, b: 220 });
  });

  it("returns undefined when the hex color string is invalid", () => {
    expect(hexToRgb("not-a-color")).toBeUndefined();
  });

  it("converts rgb triplets to CSS rgb() syntax", () => {
    expect(toRgbCss({ r: 10, g: 20, b: 30 })).toBe("rgb(10 20 30)");
  });

  it("converts rgb to OKLCH CSS syntax", () => {
    const result = toOklchCss(rgbToOklch({ r: 255, g: 0, b: 0 }));
    expect(result).toMatch(/^oklch\(\d+\.\d+% \d+\.\d+ \d+\.\d+\)$/);
  });
});

