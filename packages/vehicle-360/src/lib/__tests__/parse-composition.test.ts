import { describe, expect, it } from "vitest";
import type { CompositionV3 } from "../../types/composition-v3";
import { extractNext360, parseAspectRatio } from "../parse-composition";

function makeManifest(overrides: Partial<CompositionV3> = {}): CompositionV3 {
  return {
    aspectRatio: "4:3",
    categories: [],
    imageHdWidth: 1600,
    imageSubWidths: [400, 800],
    version: 3,
    ...overrides,
  };
}

describe("parseAspectRatio", () => {
  it("parses 4:3 to the correct numeric ratio", () => {
    expect(parseAspectRatio("4:3")).toBeCloseTo(4 / 3);
  });

  it("parses 16:9 to the correct numeric ratio", () => {
    expect(parseAspectRatio("16:9")).toBeCloseTo(16 / 9);
  });

  it("parses 1:1 to 1", () => {
    expect(parseAspectRatio("1:1")).toBe(1);
  });

  it("falls back to 4/3 when the height part is missing", () => {
    expect(parseAspectRatio("16:")).toBeCloseTo(4 / 3);
  });

  it("falls back to 4/3 for a non-numeric string", () => {
    expect(parseAspectRatio("wide")).toBeCloseTo(4 / 3);
  });

  it("falls back to 4/3 for an empty string", () => {
    expect(parseAspectRatio("")).toBeCloseTo(4 / 3);
  });
});

describe("extractNext360", () => {
  it("returns null when the categories array is empty", () => {
    expect(extractNext360(makeManifest())).toBeNull();
  });

  it("returns null when no category has id 'next360'", () => {
    const manifest = makeManifest({
      categories: [{ id: "other", title: "Other", items: [] }],
    });
    expect(extractNext360(manifest)).toBeNull();
  });

  it("returns null when the next360 category has no spin item", () => {
    const manifest = makeManifest({
      categories: [{ id: "next360", title: "360°", items: [{ type: "image", src: "hero.jpg" }] }],
    });
    expect(extractNext360(manifest)).toBeNull();
  });

  it("returns null when the spin item has an empty images array", () => {
    const manifest = makeManifest({
      categories: [{ id: "next360", title: "360°", items: [{ type: "next360", images: [] }] }],
    });
    expect(extractNext360(manifest)).toBeNull();
  });

  it("returns a Next360Manifest with correct shape when frames are present", () => {
    const frames = [{ src: "frame1.jpg" }, { src: "frame2.jpg" }, { src: "frame3.jpg" }];
    const manifest = makeManifest({
      aspectRatio: "16:9",
      categories: [{ id: "next360", title: "360°", items: [{ type: "next360", images: frames }] }],
    });
    const result = extractNext360(manifest);
    expect(result).not.toBeNull();
    expect(result?.aspectRatio).toBe("16:9");
    expect(result?.frameCount).toBe(3);
    expect(result?.frames).toEqual(frames);
  });

  it("ignores non-spin items in the next360 category", () => {
    const frames = [{ src: "frame1.jpg" }];
    const manifest = makeManifest({
      categories: [
        {
          id: "next360",
          title: "360°",
          items: [
            { type: "image", src: "hero.jpg" },
            { type: "next360", images: frames },
          ],
        },
      ],
    });
    const result = extractNext360(manifest);
    expect(result).not.toBeNull();
    expect(result?.frameCount).toBe(1);
  });
});
