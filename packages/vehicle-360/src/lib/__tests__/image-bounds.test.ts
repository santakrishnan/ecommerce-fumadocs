import { describe, expect, it } from "vitest";
import { getImageBounds, normalizedToPixel } from "../image-bounds";

describe("getImageBounds — contain mode (default)", () => {
  it("returns exact canvas dimensions when image and canvas share the same aspect ratio", () => {
    const bounds = getImageBounds(800, 450, 800, 450);
    expect(bounds.drawWidth).toBeCloseTo(800);
    expect(bounds.drawHeight).toBeCloseTo(450);
    expect(bounds.offsetX).toBeCloseTo(0);
    expect(bounds.offsetY).toBeCloseTo(0);
  });

  it("letterboxes horizontally when canvas is wider than image", () => {
    // Image 800×450 inside canvas 1600×450 → scale by height → drawWidth=800, centred
    const bounds = getImageBounds(800, 450, 1600, 450);
    expect(bounds.drawWidth).toBeCloseTo(800);
    expect(bounds.drawHeight).toBeCloseTo(450);
    expect(bounds.offsetX).toBeCloseTo(400); // (1600 - 800) / 2
    expect(bounds.offsetY).toBeCloseTo(0);
  });

  it("letterboxes vertically when canvas is taller than image", () => {
    // Image 800×450 inside canvas 800×900 → scale by width → drawHeight=450, centred
    const bounds = getImageBounds(800, 450, 800, 900);
    expect(bounds.drawWidth).toBeCloseTo(800);
    expect(bounds.drawHeight).toBeCloseTo(450);
    expect(bounds.offsetX).toBeCloseTo(0);
    expect(bounds.offsetY).toBeCloseTo(225); // (900 - 450) / 2
  });

  it("scales image down when canvas is smaller than image", () => {
    const bounds = getImageBounds(1600, 900, 800, 450);
    expect(bounds.drawWidth).toBeCloseTo(800);
    expect(bounds.drawHeight).toBeCloseTo(450);
  });
});

describe("getImageBounds — cover mode", () => {
  it("covers the canvas entirely even when aspect ratios differ", () => {
    // Image 800×450 (16:9) inside square canvas 400×400
    const bounds = getImageBounds(800, 450, 400, 400, true);
    expect(bounds.drawWidth).toBeGreaterThanOrEqual(400);
    expect(bounds.drawHeight).toBeGreaterThanOrEqual(400);
  });

  it("centres the cropped area within the canvas", () => {
    // Image 800×400 inside canvas 400×400 — cover scales by height → drawWidth=800
    const bounds = getImageBounds(800, 400, 400, 400, true);
    expect(bounds.offsetX).toBeCloseTo(-200); // (400 - 800) / 2
    expect(bounds.offsetY).toBeCloseTo(0);
  });
});

describe("normalizedToPixel", () => {
  const bounds = { offsetX: 10, offsetY: 20, drawWidth: 800, drawHeight: 400 };

  it("maps (0, 0) to the top-left corner of the image area", () => {
    const px = normalizedToPixel(0, 0, bounds);
    expect(px.left).toBe(10);
    expect(px.top).toBe(20);
  });

  it("maps (1, 1) to the bottom-right corner of the image area", () => {
    const px = normalizedToPixel(1, 1, bounds);
    expect(px.left).toBe(810); // 10 + 800
    expect(px.top).toBe(420); // 20 + 400
  });

  it("maps (0.5, 0.5) to the centre of the image area", () => {
    const boundsNoOffset = { offsetX: 0, offsetY: 0, drawWidth: 800, drawHeight: 400 };
    const px = normalizedToPixel(0.5, 0.5, boundsNoOffset);
    expect(px.left).toBe(400);
    expect(px.top).toBe(200);
  });
});
