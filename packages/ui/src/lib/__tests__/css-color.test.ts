import { afterEach, describe, expect, it, vi } from "vitest";

import { rgbToOklch, toOklchCss } from "@/lib/color-converters";
import { concreteColorToOklch, cssColorToRgb } from "@/lib/css-color";

/**
 * Build a fake canvas whose 2D context returns a controlled pixel, mirroring the
 * mocking pattern in bottom-strip-sampling.test.ts. Pass `context: null` to
 * simulate an environment without a 2D context.
 */
function mockCanvas(options: {
  pixel?: [number, number, number, number];
  context?: "throwing" | null;
}) {
  const fakeContext =
    options.context === "throwing"
      ? {
          fillStyle: "",
          fillRect: vi.fn(),
          getImageData: vi.fn().mockImplementation(() => {
            throw new Error("blocked");
          }),
        }
      : {
          fillStyle: "",
          fillRect: vi.fn(),
          getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(options.pixel ?? [0, 0, 0, 255]),
          }),
        };

  const fakeCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(options.context === null ? null : fakeContext),
  } as unknown as HTMLCanvasElement;

  vi.spyOn(document, "createElement").mockReturnValue(fakeCanvas as unknown as HTMLCanvasElement);
  return { fakeCanvas, fakeContext };
}

describe("cssColorToRgb", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the painted pixel back as sRGB", () => {
    mockCanvas({ pixel: [10, 20, 30, 255] });
    expect(cssColorToRgb("lab(69.97% 0 0)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("returns undefined when a 2D context is unavailable", () => {
    mockCanvas({ context: null });
    expect(cssColorToRgb("lab(69.97% 0 0)")).toBeUndefined();
  });

  it("returns undefined for a fully transparent (unpaintable) value", () => {
    mockCanvas({ pixel: [0, 0, 0, 0] });
    expect(cssColorToRgb("not-a-color")).toBeUndefined();
  });

  it("returns undefined when the pixel read throws", () => {
    mockCanvas({ context: "throwing" });
    expect(cssColorToRgb("lab(69.97% 0 0)")).toBeUndefined();
  });
});

describe("concreteColorToOklch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns undefined for an empty string", () => {
    expect(concreteColorToOklch("")).toBeUndefined();
  });

  it("normalizes an oklch() string without touching the canvas", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    expect(concreteColorToOklch("oklch(80% 0.05 100)")).toBe("oklch(80.00% 0.0500 100.00)");
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it("normalizes an rgb() string via a direct parse (no canvas)", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    expect(concreteColorToOklch("rgb(255, 0, 0)")).toBe(toOklchCss(rgbToOklch({ r: 255, g: 0, b: 0 })));
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it("rasterizes a lab() color the theme compiles to, via canvas", () => {
    mockCanvas({ pixel: [171, 171, 171, 255] });
    expect(concreteColorToOklch("lab(69.9792% -0.00003 0)")).toBe(
      toOklchCss(rgbToOklch({ r: 171, g: 171, b: 171 }))
    );
  });

  it("returns undefined for an unresolved var() token when canvas can't paint it", () => {
    mockCanvas({ context: null });
    expect(concreteColorToOklch("var(--color-neutral-600)")).toBeUndefined();
  });
});
