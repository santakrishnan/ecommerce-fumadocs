import { describe, expect, it } from "vitest";

import { getSurfaceFromOklch } from "@/lib/color-contrast";
import { rgbToOklch } from "@/lib/color-converters";

describe("color-contrast", () => {
  it("classifies very dark colors as dark surfaces", () => {
    expect(getSurfaceFromOklch(rgbToOklch({ r: 20, g: 20, b: 20 }))).toBe("dark");
  });

  it("classifies very light colors as light surfaces", () => {
    expect(getSurfaceFromOklch(rgbToOklch({ r: 245, g: 245, b: 245 }))).toBe("light");
  });

  it("classifies mid-tone neutral as light when dark text has more contrast", () => {
    expect(getSurfaceFromOklch(rgbToOklch({ r: 140, g: 140, b: 140 }))).toBe("light");
  });

  it("classifies highly luminous colors as light surfaces", () => {
    expect(getSurfaceFromOklch(rgbToOklch({ r: 0, g: 255, b: 0 }))).toBe("light");
  });
});
