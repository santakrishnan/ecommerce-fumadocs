// @vitest-environment node
import {
  extractMediaSortKey,
  resolveHeroImageUrl,
  sortMediaByFilenamePrefix,
} from "@shared/lib/media";
import { describe, expect, it } from "vitest";

describe("extractMediaSortKey", () => {
  it("extracts a 3-digit prefix (011)", () => {
    expect(extractMediaSortKey("public/hash/011-cfa6d5528918.jpg")).toBe(11);
  });

  it("extracts a 2-digit prefix (01)", () => {
    expect(extractMediaSortKey("public/hash/01-abc123.jpg")).toBe(1);
  });

  it("extracts a 4-digit prefix (0100)", () => {
    expect(extractMediaSortKey("public/hash/0100-foo.jpg")).toBe(100);
  });

  it("extracts a plain numeric prefix (35)", () => {
    expect(extractMediaSortKey("public/hash/35-xyz789.jpg")).toBe(35);
  });

  it("returns Infinity for URLs without a numeric prefix", () => {
    expect(extractMediaSortKey("https://cdn.example.com/image.jpg")).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity for filenames with digits but no dash separator", () => {
    expect(extractMediaSortKey("public/hash/011front.jpg")).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity for filenames that do not start with digits", () => {
    expect(extractMediaSortKey("public/hash/abc-123.jpg")).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity for an empty string", () => {
    expect(extractMediaSortKey("")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("sortMediaByFilenamePrefix", () => {
  it("sorts items by numeric prefix in ascending order", () => {
    const items = [
      { url: "public/hash/013-side.jpg" },
      { url: "public/hash/011-front.jpg" },
      { url: "public/hash/035-detail.jpg" },
      { url: "public/hash/012-front-left.jpg" },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/011-front.jpg",
      "public/hash/012-front-left.jpg",
      "public/hash/013-side.jpg",
      "public/hash/035-detail.jpg",
    ]);
  });

  it("handles variable-length prefixes (01, 011, 0100)", () => {
    const items = [
      { url: "public/hash/0100-wide.jpg" },
      { url: "public/hash/011-front.jpg" },
      { url: "public/hash/01-first.jpg" },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/01-first.jpg",
      "public/hash/011-front.jpg",
      "public/hash/0100-wide.jpg",
    ]);
  });

  it("preserves input order for items with duplicate prefixes (stable sort)", () => {
    const items = [
      { url: "public/hash-a/011-first.jpg", id: "a" },
      { url: "public/hash-b/011-second.jpg", id: "b" },
      { url: "public/hash-c/011-third.jpg", id: "c" },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("pushes non-parseable URLs to the end", () => {
    const items = [
      { url: "https://cdn.example.com/image.jpg" },
      { url: "public/hash/012-front-left.jpg" },
      { url: "public/hash/no-number.jpg" },
      { url: "public/hash/011-front.jpg" },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/011-front.jpg",
      "public/hash/012-front-left.jpg",
      "https://cdn.example.com/image.jpg",
      "public/hash/no-number.jpg",
    ]);
  });

  it("returns a new array (does not mutate input)", () => {
    const items = [{ url: "public/hash/013-side.jpg" }, { url: "public/hash/011-front.jpg" }];
    const original = [...items];
    sortMediaByFilenamePrefix(items);
    expect(items).toEqual(original);
  });

  it("returns an empty array for empty input", () => {
    expect(sortMediaByFilenamePrefix([])).toEqual([]);
  });
});

describe("resolveHeroImageUrl", () => {
  it("returns the URL with the lowest filename prefix", () => {
    const items = [
      { url: "public/hash/013-side.jpg" },
      { url: "public/hash/011-front.jpg" },
      { url: "public/hash/012-front-left.jpg" },
    ];

    expect(resolveHeroImageUrl(items)).toBe("public/hash/011-front.jpg");
  });

  it("returns undefined for an empty array", () => {
    expect(resolveHeroImageUrl([])).toBeUndefined();
  });

  it("returns the single item's URL for a single-item array", () => {
    const items = [{ url: "public/hash/015-rear.jpg" }];
    expect(resolveHeroImageUrl(items)).toBe("public/hash/015-rear.jpg");
  });

  it("handles mixed parseable and non-parseable URLs", () => {
    const items = [
      { url: "https://cdn.example.com/image.jpg" },
      { url: "public/hash/012-front-left.jpg" },
      { url: "public/hash/no-number.jpg" },
    ];

    expect(resolveHeroImageUrl(items)).toBe("public/hash/012-front-left.jpg");
  });

  it("returns first item when all URLs are non-parseable", () => {
    const items = [
      { url: "https://cdn.example.com/a.jpg" },
      { url: "https://cdn.example.com/b.jpg" },
    ];
    // All have Infinity keys; the first one wins (no key < Infinity found)
    expect(resolveHeroImageUrl(items)).toBe("https://cdn.example.com/a.jpg");
  });

  it("prefers displayOrder 12 over lower filename prefix", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/012-left.jpg", displayOrder: 12 },
      { url: "public/hash/013-side.jpg", displayOrder: 13 },
    ];

    expect(resolveHeroImageUrl(items)).toBe("public/hash/012-left.jpg");
  });

  it("follows preferred sequence: 12 → 18 → 14 → 16", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/014-rear-left.jpg", displayOrder: 14 },
      { url: "public/hash/018-right.jpg", displayOrder: 18 },
    ];

    // 12 not present, so first match is 18
    expect(resolveHeroImageUrl(items)).toBe("public/hash/018-right.jpg");
  });

  it("falls back to filename prefix when no preferred displayOrder exists", () => {
    const items = [
      { url: "public/hash/013-side.jpg", displayOrder: 11 },
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
    ];

    // displayOrder 11 is not in preferred list → filename prefix fallback
    expect(resolveHeroImageUrl(items)).toBe("public/hash/011-front.jpg");
  });

  it("works with items that have no displayOrder property", () => {
    const items = [{ url: "public/hash/013-side.jpg" }, { url: "public/hash/011-front.jpg" }];

    expect(resolveHeroImageUrl(items)).toBe("public/hash/011-front.jpg");
  });

  it("treats a null displayOrder the same as undefined (filename fallback)", () => {
    const items = [
      { url: "public/hash/013-side.jpg", displayOrder: null },
      { url: "public/hash/011-front.jpg", displayOrder: null },
    ];

    // null is not a preferred value → falls back to filename prefix
    expect(resolveHeroImageUrl(items)).toBe("public/hash/011-front.jpg");
  });

  it("prefers a preferred displayOrder over items with null displayOrder", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: null },
      { url: "public/hash/012-left.jpg", displayOrder: 12 },
      { url: "public/hash/013-side.jpg", displayOrder: null },
    ];

    expect(resolveHeroImageUrl(items)).toBe("public/hash/012-left.jpg");
  });
});

describe("sortMediaByFilenamePrefix — preferred displayOrder", () => {
  it("places preferred displayOrder items first in sequence order (12, 18, 14, 16)", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/016-right.jpg", displayOrder: 16 },
      { url: "public/hash/012-left.jpg", displayOrder: 12 },
      { url: "public/hash/014-rear.jpg", displayOrder: 14 },
      { url: "public/hash/018-fr.jpg", displayOrder: 18 },
      { url: "public/hash/013-side.jpg", displayOrder: 13 },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.displayOrder)).toEqual([12, 18, 14, 16, 11, 13]);
  });

  it("sorts remaining non-preferred items by filename prefix", () => {
    const items = [
      { url: "public/hash/035-detail.jpg", displayOrder: 35 },
      { url: "public/hash/012-left.jpg", displayOrder: 12 },
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/020-interior.jpg", displayOrder: 20 },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    // 12 first (preferred), then 11, 20, 35 by filename prefix
    expect(sorted.map((i) => i.displayOrder)).toEqual([12, 11, 20, 35]);
  });

  it("falls back entirely to filename prefix when no preferred displayOrder exists", () => {
    const items = [
      { url: "public/hash/013-side.jpg", displayOrder: 13 },
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/015-rear.jpg", displayOrder: 15 },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/011-front.jpg",
      "public/hash/013-side.jpg",
      "public/hash/015-rear.jpg",
    ]);
  });

  it("falls back to filename prefix when items have no displayOrder property", () => {
    const items = [{ url: "public/hash/013-side.jpg" }, { url: "public/hash/011-front.jpg" }];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/011-front.jpg",
      "public/hash/013-side.jpg",
    ]);
  });

  it("treats null displayOrder the same as undefined (filename fallback)", () => {
    const items = [
      { url: "public/hash/013-side.jpg", displayOrder: null },
      { url: "public/hash/011-front.jpg", displayOrder: null },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/011-front.jpg",
      "public/hash/013-side.jpg",
    ]);
  });

  it("places preferred items first when others have null displayOrder", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: null },
      { url: "public/hash/018-fr.jpg", displayOrder: 18 },
      { url: "public/hash/013-side.jpg", displayOrder: null },
      { url: "public/hash/012-left.jpg", displayOrder: 12 },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    // Preferred sequence (12, 18) first, then null items by filename prefix
    expect(sorted.map((i) => i.url)).toEqual([
      "public/hash/012-left.jpg",
      "public/hash/018-fr.jpg",
      "public/hash/011-front.jpg",
      "public/hash/013-side.jpg",
    ]);
  });

  it("handles a single preferred item among many", () => {
    const items = [
      { url: "public/hash/011-front.jpg", displayOrder: 11 },
      { url: "public/hash/013-side.jpg", displayOrder: 13 },
      { url: "public/hash/018-fr.jpg", displayOrder: 18 },
      { url: "public/hash/015-rear.jpg", displayOrder: 15 },
    ];

    const sorted = sortMediaByFilenamePrefix(items);
    // 18 is preferred → comes first, rest by filename prefix
    expect(sorted.map((i) => i.displayOrder)).toEqual([18, 11, 13, 15]);
  });
});
