// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { OptionCard } from "../../agent-search-turns-collection";
import { mapOptionCardToEditorialCard } from "../map-option-card-to-editorial-card";

function makeBaseCard(overrides?: Partial<OptionCard>): OptionCard {
  return {
    id: "opt-hybrid-suvs",
    title: "Hybrid SUVs",
    subtitle: "Best fuel economy in the SUV category.",
    image: "http://localhost:3000/editorial-card/search-editorial.png",
    availableCount: 195,
    nextSearchPlan: {
      searchId: "00000000-0000-0000-0000-000000000001",
      filters: [{ key: "fuelType", values: ["Hybrid"] }],
    },
    attributes: [
      { key: "href", label: "href", value: "/search?fuelType=hybrid&bodyStyle=suv" },
      { key: "iconName", label: "iconName", value: "bolt" },
      { key: "matches", label: "matches", value: "12" },
      { key: "surface", label: "surface", value: "dark" },
    ],
    ...overrides,
  };
}

describe("mapOptionCardToEditorialCard", () => {
  it("maps all fields from a fully-populated card", () => {
    const result = mapOptionCardToEditorialCard(makeBaseCard());

    expect(result).toEqual({
      eyebrow: "Best fuel economy in the SUV category.",
      headline: "Hybrid SUVs",
      href: "/search?fuelType=hybrid&bodyStyle=suv",
      iconName: "bolt",
      imageUrl: "/editorial-card/search-editorial.png",
      matches: 12,
      surface: "dark",
    });
  });

  it("defaults href to '#' when attribute is missing", () => {
    const card = makeBaseCard({
      attributes: [{ key: "iconName", label: "iconName", value: "binocular" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.href).toBe("#");
  });

  it("defaults eyebrow to empty string when subtitle is undefined", () => {
    const card = makeBaseCard({ subtitle: undefined });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.eyebrow).toBe("");
  });

  it("normalizes localhost image URLs", () => {
    const card = makeBaseCard({ image: "http://localhost:3000/images/card.png" });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.imageUrl).toBe("/images/card.png");
  });

  it("handles missing image gracefully with fallback", () => {
    const card = makeBaseCard({ image: undefined });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.imageUrl).toBe("/inventory-card/default.png");
  });
});

describe("mapOptionCardToEditorialCard — iconName validation", () => {
  it.each(["bolt", "binocular", "location"] as const)("accepts valid icon name: %s", (name) => {
    const card = makeBaseCard({
      attributes: [{ key: "iconName", label: "iconName", value: name }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.iconName).toBe(name);
  });

  it("rejects invalid icon names", () => {
    const card = makeBaseCard({
      attributes: [{ key: "iconName", label: "iconName", value: "rocket" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.iconName).toBeUndefined();
  });

  it("returns undefined when iconName attribute is missing", () => {
    const card = makeBaseCard({ attributes: [] });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.iconName).toBeUndefined();
  });
});

describe("mapOptionCardToEditorialCard — matches validation", () => {
  it("parses numeric string to number", () => {
    const card = makeBaseCard({
      attributes: [{ key: "matches", label: "matches", value: "42" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.matches).toBe(42);
  });

  it("returns undefined for non-numeric matches value", () => {
    const card = makeBaseCard({
      attributes: [{ key: "matches", label: "matches", value: "many" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.matches).toBeUndefined();
  });

  it("returns undefined for empty string matches value", () => {
    const card = makeBaseCard({
      attributes: [{ key: "matches", label: "matches", value: "" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.matches).toBeUndefined();
  });

  it("returns undefined when matches attribute is absent", () => {
    const card = makeBaseCard({ attributes: [] });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.matches).toBeUndefined();
  });
});

describe("mapOptionCardToEditorialCard — surface validation", () => {
  it.each(["light", "dark"] as const)("accepts valid surface: %s", (value) => {
    const card = makeBaseCard({
      attributes: [{ key: "surface", label: "surface", value }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.surface).toBe(value);
  });

  it("rejects invalid surface values", () => {
    const card = makeBaseCard({
      attributes: [{ key: "surface", label: "surface", value: "neon" }],
    });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.surface).toBeUndefined();
  });

  it("returns undefined when surface attribute is missing", () => {
    const card = makeBaseCard({ attributes: [] });

    const result = mapOptionCardToEditorialCard(card);

    expect(result.surface).toBeUndefined();
  });
});
