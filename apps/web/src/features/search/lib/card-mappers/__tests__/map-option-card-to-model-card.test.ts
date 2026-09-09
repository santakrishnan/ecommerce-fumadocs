// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { OptionCard } from "../../agent-search-turns-collection";
import { mapOptionCardToModelCard } from "../map-option-card-to-model-card";

function makeBaseCard(): OptionCard {
  return {
    id: "opt-rav4-hybrid",
    title: "RAV4 Hybrid",
    subtitle: "Model recommendation",
    image: "http://localhost:3000/images/model/rav4_hybrid.png",
    availableCount: 12,
    nextSearchPlan: {
      searchId: "00000000-0000-0000-0000-000000000001",
      filters: [{ key: "make", values: ["Toyota"] }],
    },
    attributes: [
      { key: "year", label: "Year", value: "2024" },
      { key: "fuelEfficiency", label: "Fuel efficiency", value: "40 MPG city" },
      { key: "capacity", label: "Capacity", value: "5 passengers" },
      { key: "averagePrice", label: "Average price", value: "$28k avg" },
    ],
  };
}

describe("mapOptionCardToModelCard color swatches", () => {
  it("uses metadata.imageUrl for swatches when provided", () => {
    const card: OptionCard = {
      ...makeBaseCard(),
      attributes: [
        ...(makeBaseCard().attributes ?? []),
        {
          key: "colors",
          label: "Colors",
          options: [
            {
              value: "Gray",
              label: "Gray",
              metadata: {
                imageUrl: "http://localhost:3000/images/search/Ellipse-2392.svg",
              },
            },
          ],
        },
      ],
    };

    const mapped = mapOptionCardToModelCard(card);

    expect(mapped.colors).toBeDefined();
    expect(mapped.colors?.[0]?.label).toBe("Gray");
    expect(mapped.colors?.[0]?.svgSrc).toBe("/images/search/Ellipse-2392.svg");
  });

  it("falls back to option.value when it is already an image path", () => {
    const card: OptionCard = {
      ...makeBaseCard(),
      attributes: [
        ...(makeBaseCard().attributes ?? []),
        {
          key: "colors",
          label: "Colors",
          options: [
            {
              value: "http://localhost:3000/images/search/Ellipse-2393.svg",
              label: "White",
            },
          ],
        },
      ],
    };

    const mapped = mapOptionCardToModelCard(card);

    expect(mapped.colors?.[0]?.label).toBe("White");
    expect(mapped.colors?.[0]?.svgSrc).toBe("/images/search/Ellipse-2393.svg");
  });
});

describe("mapOptionCardToModelCard year resolution", () => {
  it("uses parsed year from attributes when numeric", () => {
    const mapped = mapOptionCardToModelCard(makeBaseCard());
    expect(mapped.year).toBe(2024);
  });

  it("falls back to current year when year attribute is missing", () => {
    const currentYear = new Date().getFullYear();
    const card: OptionCard = {
      ...makeBaseCard(),
      attributes: (makeBaseCard().attributes ?? []).filter((attr) => attr.key !== "year"),
    };

    const mapped = mapOptionCardToModelCard(card);
    expect(mapped.year).toBe(currentYear);
  });

  it("falls back to current year when year attribute is non-numeric", () => {
    const currentYear = new Date().getFullYear();
    const card: OptionCard = {
      ...makeBaseCard(),
      attributes: [
        ...(makeBaseCard().attributes ?? []).filter((attr) => attr.key !== "year"),
        { key: "year", label: "Year", value: "N/A" },
      ],
    };

    const mapped = mapOptionCardToModelCard(card);
    expect(mapped.year).toBe(currentYear);
  });
});
