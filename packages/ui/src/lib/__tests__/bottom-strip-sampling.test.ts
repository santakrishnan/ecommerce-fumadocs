import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_BOTTOM_COLOR_CSS,
  sampleBottomAverageColor,
} from "@/lib/bottom-strip-sampling";

describe("bottom-strip-sampling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fallback for invalid image dimensions", () => {
    const image = {
      naturalWidth: 0,
      naturalHeight: 0,
    } as HTMLImageElement;

    expect(sampleBottomAverageColor(image)).toBe(DEFAULT_BOTTOM_COLOR_CSS);
  });

  it("returns fallback when 2d context is unavailable", () => {
    const image = {
      naturalWidth: 300,
      naturalHeight: 200,
    } as HTMLImageElement;

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockReturnValue(fakeCanvas as unknown as HTMLCanvasElement);

    expect(sampleBottomAverageColor(image)).toBe(DEFAULT_BOTTOM_COLOR_CSS);
  });

  it("returns sampled OKLCH css value when pixel data is readable", () => {
    const image = {
      naturalWidth: 400,
      naturalHeight: 300,
    } as HTMLImageElement;

    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray([
          255, 0, 0, 255,
          0, 255, 0, 255,
        ]),
      }),
    } as unknown as CanvasRenderingContext2D;

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(fakeContext),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockReturnValue(fakeCanvas as unknown as HTMLCanvasElement);

    const result = sampleBottomAverageColor(image);

    expect(result).toMatch(/^oklch\(\d+\.\d+% \d+\.\d+ \d+\.\d+\)$/);
    expect(fakeContext.drawImage).toHaveBeenCalledTimes(1);
  });

  it("returns fallback when canvas read throws", () => {
    const image = {
      naturalWidth: 400,
      naturalHeight: 300,
    } as HTMLImageElement;

    const fakeContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation(() => {
        throw new Error("blocked");
      }),
    } as unknown as CanvasRenderingContext2D;

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(fakeContext),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockReturnValue(fakeCanvas as unknown as HTMLCanvasElement);

    expect(sampleBottomAverageColor(image)).toBe(DEFAULT_BOTTOM_COLOR_CSS);
  });
});

