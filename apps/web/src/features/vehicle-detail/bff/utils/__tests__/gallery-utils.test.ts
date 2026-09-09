// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildGalleryImagesFromManifest, extractSourceIdFromManifestSrc } from "../gallery-utils";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const IDENTITY = { year: 2024, make: "Toyota", model: "RAV4" };

/** Minimal Car-Cutter CDN URL containing a known sourceId before _CC_. */
const VALID_SRC =
  "https://cdn.car-cutter.com/gallery/abc123/5YFB4MDE7TP486391/486dad5134-534438565_6a60e832e84b5331b10fa567_CC_d059dbf26d4e54faa7b02516fa9a84d178fa3c02_a.jpg";
const VALID_SOURCE_ID = "6a60e832e84b5331b10fa567";

const ANOTHER_SRC =
  "https://cdn.car-cutter.com/gallery/abc123/5YFB4MDE7TP486391/other-534438565_9b1c4d2a7f8e3c0d5a6b7e89_CC_aabbccdd_a.jpg";
const ANOTHER_SOURCE_ID = "9b1c4d2a7f8e3c0d5a6b7e89";

/** A manifest with two exterior images and one interior image. */
function makeManifest(items: { id: string; srcs: string[] }) {
  return {
    version: 3,
    aspectRatio: "4:3",
    imageHdWidth: 1280,
    imageSubWidths: [640],
    categories: [
      {
        id: items.id,
        title: items.id,
        items: items.srcs.map((src) => ({ type: "image" as const, src })),
      },
    ],
  };
}

// ─── extractSourceIdFromManifestSrc ──────────────────────────────────────────

describe("extractSourceIdFromManifestSrc", () => {
  it("extracts the 24-char hex sourceId from a valid Car-Cutter URL", () => {
    expect(extractSourceIdFromManifestSrc(VALID_SRC)).toBe(VALID_SOURCE_ID);
  });

  it("is case-insensitive for the _CC_ marker", () => {
    const upperCc = VALID_SRC.replace("_CC_", "_cc_");
    expect(extractSourceIdFromManifestSrc(upperCc)).toBe(VALID_SOURCE_ID);
  });

  it("returns null for a URL without the _CC_ marker", () => {
    expect(extractSourceIdFromManifestSrc("https://example.com/image.jpg")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractSourceIdFromManifestSrc("")).toBeNull();
  });

  it("returns null when hex segment is shorter than 24 chars", () => {
    const shortId = "https://cdn.car-cutter.com/gallery/hash/VIN/prefix_abc123_CC_hash_a.jpg";
    expect(extractSourceIdFromManifestSrc(shortId)).toBeNull();
  });
});

// ─── buildGalleryImagesFromManifest – no filtering ───────────────────────────

describe("buildGalleryImagesFromManifest (no allowedSourceIds)", () => {
  it("returns all images when allowedSourceIds is undefined", () => {
    const manifest = makeManifest({ id: "exterior", srcs: [VALID_SRC, ANOTHER_SRC] });
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY);
    expect(images).toHaveLength(2);
  });

  it("maps category id 'exterior' to type 'exterior'", () => {
    const manifest = makeManifest({ id: "exterior", srcs: [VALID_SRC] });
    const [image] = buildGalleryImagesFromManifest(manifest, IDENTITY);
    expect(image?.type).toBe("exterior");
  });

  it("maps category id 'interior' to type 'interior'", () => {
    const manifest = makeManifest({ id: "interior", srcs: [VALID_SRC] });
    const [image] = buildGalleryImagesFromManifest(manifest, IDENTITY);
    expect(image?.type).toBe("interior");
  });

  it("maps category id 'others' to type 'non-vehicle'", () => {
    const manifest = makeManifest({ id: "others", srcs: [VALID_SRC] });
    const [image] = buildGalleryImagesFromManifest(manifest, IDENTITY);
    expect(image?.type).toBe("non-vehicle");
  });

  it("skips the next360 category", () => {
    const manifest = {
      version: 3,
      aspectRatio: "4:3",
      imageHdWidth: 1280,
      imageSubWidths: [640],
      categories: [
        {
          id: "next360",
          title: "360",
          items: [{ type: "next360" as const, images: [{ src: VALID_SRC }] }],
        },
        {
          id: "exterior",
          title: "Exterior",
          items: [{ type: "image" as const, src: VALID_SRC }],
        },
      ],
    };
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY);
    expect(images).toHaveLength(1);
    expect(images[0]?.type).toBe("exterior");
  });
});

// ─── buildGalleryImagesFromManifest – with allowedSourceIds ──────────────────

describe("buildGalleryImagesFromManifest (with allowedSourceIds)", () => {
  it("includes only images whose sourceId is in the allowed set", () => {
    const manifest = makeManifest({ id: "exterior", srcs: [VALID_SRC, ANOTHER_SRC] });
    const allowed = new Set([VALID_SOURCE_ID]);
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, allowed);
    expect(images).toHaveLength(1);
    expect(images[0]?.url).toBe(VALID_SRC);
  });

  it("returns an empty array when no sourceIds match", () => {
    const manifest = makeManifest({ id: "exterior", srcs: [VALID_SRC, ANOTHER_SRC] });
    const allowed = new Set(["000000000000000000000000"]);
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, allowed);
    expect(images).toHaveLength(0);
  });

  it("returns an empty array when allowedSourceIds is an empty set", () => {
    const manifest = makeManifest({ id: "exterior", srcs: [VALID_SRC] });
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, new Set());
    expect(images).toHaveLength(0);
  });

  it("excludes images whose sourceId cannot be extracted from the URL", () => {
    const nonCcSrc = "https://example.com/some-other-cdn/image.jpg";
    const manifest = makeManifest({ id: "exterior", srcs: [nonCcSrc, VALID_SRC] });
    const allowed = new Set([VALID_SOURCE_ID]);
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, allowed);
    expect(images).toHaveLength(1);
    expect(images[0]?.url).toBe(VALID_SRC);
  });

  it("includes all matching images across multiple categories", () => {
    const manifest = {
      version: 3,
      aspectRatio: "4:3",
      imageHdWidth: 1280,
      imageSubWidths: [640],
      categories: [
        {
          id: "exterior",
          title: "Exterior",
          items: [{ type: "image" as const, src: VALID_SRC }],
        },
        {
          id: "interior",
          title: "Interior",
          items: [{ type: "image" as const, src: ANOTHER_SRC }],
        },
      ],
    };
    const allowed = new Set([VALID_SOURCE_ID, ANOTHER_SOURCE_ID]);
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, allowed);
    expect(images).toHaveLength(2);
  });

  it("generates sequential alt text numbering after filtered-out items", () => {
    // ANOTHER_SRC is filtered out, VALID_SRC is index 0 → "exterior photo 1"
    const manifest = makeManifest({ id: "exterior", srcs: [ANOTHER_SRC, VALID_SRC] });
    const allowed = new Set([VALID_SOURCE_ID]);
    const images = buildGalleryImagesFromManifest(manifest, IDENTITY, allowed);
    expect(images[0]?.alt).toBe("2024 Toyota RAV4 — exterior photo 1");
  });
});
