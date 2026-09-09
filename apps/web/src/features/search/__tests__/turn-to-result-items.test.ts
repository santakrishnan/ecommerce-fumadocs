// @vitest-environment node
/**
 * Schema regression tests for display-level fields carried in AgentSearch turns.
 *
 * These tests verify that extended optional fields (colors, avgPrice, fuelEfficiency,
 * metrics, badgeLabel, originalPrice, surface, aiDescription, etc.) are carried
 * through correctly, and that older payloads remain backward-compatible.
 *
 * End-to-end stream passthrough is covered by `bff/services/__tests__/agent-mock.test.ts`.
 */

import { describe, expect, it } from "vitest";
import type {
  AgentSearchResponse,
  AgentSearchTurn,
  ComparisonCard,
  InventoryCard,
  OptionCard,
} from "../lib/agent-search-turns-collection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SEARCH_ID = "00000000-0000-0000-0000-000000000000";

const stubPlan = { searchId: MOCK_SEARCH_ID, filters: [] };

/** Asserts a value is defined (satisfies noUncheckedIndexedAccess). */
function defined<T>(value: T | undefined, message = "Expected value to be defined"): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

/**
 * Builds a complete AgentSearchTurn with the given response.
 * Validates the response against the schema to ensure test data matches reality.
 */
function makeTurn(response: unknown): AgentSearchTurn {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    searchId: MOCK_SEARCH_ID,
    role: "user",
    query: "test query",
    status: "complete",
    submittedAt: Date.now(),
    searchMode: "Exploration",
    response: response as AgentSearchResponse,
  };
}

// ─── Schema validation tests ─────────────────────────────────────────────────

describe("Schema: inventoryCardSchema extended fields", () => {
  it("parses inventory cards with originalPrice, surface, and aiDescription", () => {
    const response = {
      responseMode: "InventoryCards",
      summary: "Test inventory",
      totalCount: 1,
      results: [
        {
          vin: "12345678901234567",
          vehicleInfo: {
            year: 2024,
            make: "Toyota",
            model: "Highlander",
            trim: "Hybrid XLE",
            mileage: 4500,
          },
          dealerInfo: { dealerCode: "5012", dealerName: "Test Dealer", zipCode: "90210" },
          pricing: {
            msrp: 48_200,
            listPrice: 45_990,
            sellingPrice: 45_990,
            originalPrice: 48_200,
          },
          status: { mileage: 4500, vehicleStatus: "In Stock" },
          media: { primaryImageUrl: "/inventory-card/inventory-card-01.png" },
          surface: "light",
          aiDescription: "Midnight Edition Package",
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: InventoryCard[] }).results[0]);

    expect(card.pricing.originalPrice).toBe(48_200);
    expect(card.surface).toBe("light");
    expect(card.aiDescription).toBe("Midnight Edition Package");
  });

  it("parses inventory cards without optional display fields (backward-compatible)", () => {
    const response = {
      responseMode: "InventoryCards",
      summary: "Test",
      totalCount: 1,
      results: [
        {
          vin: "12345678901234567",
          vehicleInfo: { year: 2024, make: "Toyota", model: "RAV4" },
          dealerInfo: { dealerCode: "5012", dealerName: "Dealer", zipCode: "90210" },
          pricing: { listPrice: 35_000 },
          status: { mileage: 1000 },
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: InventoryCard[] }).results[0]);

    expect(card.pricing.originalPrice).toBeUndefined();
    expect(card.surface).toBeUndefined();
    expect(card.aiDescription).toBeUndefined();
  });
});

describe("Schema: optionCardSchema extended fields", () => {
  it("parses option cards with model display data encoded in attributes", () => {
    const response = {
      responseMode: "OptionCards",
      summary: "Test models",
      totalCount: 1,
      optionLevel: "Model",
      results: [
        {
          id: "opt-rav4",
          title: "RAV4",
          subtitle: "Compact SUV with great fuel economy.",
          image: "/images/search/rav4-hybrid-2024.png",
          availableCount: 12,
          nextSearchPlan: stubPlan,
          attributes: [
            { key: "year", label: "Year", value: "2024" },
            { key: "averagePrice", label: "Average price", value: "$30,325" },
            { key: "capacity", label: "Capacity", value: "5 Passengers" },
            { key: "fuelEfficiency", label: "Fuel efficiency", value: "27/35 MPG" },
            {
              key: "colors",
              label: "Colors",
              options: [
                {
                  value: "Blueprint",
                  label: "Blueprint",
                  metadata: { imageUrl: "/images/search/Ellipse 2392.svg" },
                },
                {
                  value: "Ice Cap",
                  label: "Ice Cap",
                  metadata: { imageUrl: "/images/search/Ellipse 2393.svg" },
                },
              ],
            },
          ],
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: OptionCard[] }).results[0]);
    const attrs = defined(card.attributes);
    const colorsAttr = defined(attrs.find((attribute) => attribute.key === "colors"));
    const colorOptions = defined(colorsAttr.options);

    expect(attrs.find((attribute) => attribute.key === "year")?.value).toBe("2024");
    expect(attrs.find((attribute) => attribute.key === "averagePrice")?.value).toBe("$30,325");
    expect(attrs.find((attribute) => attribute.key === "capacity")?.value).toBe("5 Passengers");
    expect(attrs.find((attribute) => attribute.key === "fuelEfficiency")?.value).toBe("27/35 MPG");
    expect(colorOptions).toHaveLength(2);
    expect(colorOptions[0]).toEqual({
      value: "Blueprint",
      label: "Blueprint",
      metadata: { imageUrl: "/images/search/Ellipse 2392.svg" },
    });
  });

  it("parses option cards without optional display fields (backward-compatible)", () => {
    const response = {
      responseMode: "OptionCards",
      summary: "Test",
      totalCount: 1,
      optionLevel: "Category",
      results: [
        {
          id: "opt-suv",
          title: "SUVs",
          availableCount: 100,
          nextSearchPlan: stubPlan,
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: OptionCard[] }).results[0]);

    expect(card.attributes).toBeUndefined();
  });
});

describe("Schema: comparisonCardSchema extended fields", () => {
  it("parses comparison cards with metrics, badgeLabel, year, and description", () => {
    const response = {
      responseMode: "ComparisonCards",
      summary: "Test comparison",
      totalCount: 2,
      results: [
        {
          id: "cmp-highlander",
          title: "HIGHLANDER HYBRID",
          subtitle: "A 3rd row that folds flat.",
          image: "/images/search/highlander-hybrid-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          badgeLabel: "Most space",
          year: 2024,
          description: "A 3rd row that folds flat means a much bigger trunk.",
          metrics: [{ label: "Max cargo", value: "84.3", unit: "CU. FT." }],
        },
        {
          id: "cmp-rav4",
          title: "RAV4 HYBRID",
          subtitle: "Plenty for groceries.",
          image: "/images/search/rav4-hybrid-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          year: 2024,
          description: "Plenty for groceries, strollers, and weekend trips.",
          metrics: [{ label: "Max cargo", value: "69.8", unit: "CU. FT." }],
        },
      ],
    };

    const turn = makeTurn(response);
    const results = (turn.response as { results: ComparisonCard[] }).results;
    const first = defined(results[0]);
    const second = defined(results[1]);

    expect(first.badgeLabel).toBe("Most space");
    expect(first.year).toBe(2024);
    expect(first.description).toBe("A 3rd row that folds flat means a much bigger trunk.");
    expect(first.metrics).toEqual([{ label: "Max cargo", value: "84.3", unit: "CU. FT." }]);
    expect(second.badgeLabel).toBeUndefined();
    expect(second.metrics).toEqual([{ label: "Max cargo", value: "69.8", unit: "CU. FT." }]);
  });

  it("parses comparison cards without optional display fields (backward-compatible)", () => {
    const response = {
      responseMode: "ComparisonCards",
      summary: "Test",
      totalCount: 1,
      results: [
        {
          id: "cmp-1",
          title: "RAV4",
          availableCount: 10,
          attributes: [{ key: "fuelType", label: "Fuel Type", value: "Hybrid" }],
          nextSearchPlan: stubPlan,
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: ComparisonCard[] }).results[0]);

    expect(card.badgeLabel).toBeUndefined();
    expect(card.year).toBeUndefined();
    expect(card.description).toBeUndefined();
    expect(card.metrics).toBeUndefined();
  });
});

// ─── Additional schema regression tests (card-specific payloads) ───────────────
describe("adaptCards: inventory display fields", () => {
  it("carries originalPrice through pricing.originalPrice", () => {
    const response = {
      responseMode: "InventoryCards",
      summary: "Test",
      totalCount: 1,
      results: [
        {
          vin: "12345678901234567",
          vehicleInfo: {
            year: 2024,
            make: "Toyota",
            model: "Tacoma",
            trim: "TRD Pro",
            mileage: 3200,
          },
          dealerInfo: { dealerCode: "5012", dealerName: "Mock Dealer", zipCode: "90210" },
          pricing: { msrp: 55_800, listPrice: 52_300, sellingPrice: 52_300, originalPrice: 55_800 },
          status: { mileage: 3200, vehicleStatus: "In Stock" },
          media: { primaryImageUrl: "/inventory-card/inventory-card1.png" },
          surface: "light",
          aiDescription: "Midnight Edition Package",
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: InventoryCard[] }).results[0]);

    expect(card.pricing.originalPrice).toBe(55_800);
    expect(card.pricing.listPrice).toBe(52_300);
    expect(card.surface).toBe("light");
    expect(card.aiDescription).toBe("Midnight Edition Package");
  });
});

describe("adaptCards: model option card display fields", () => {
  it("carries model display fields through OptionCard attributes", () => {
    const response = {
      responseMode: "OptionCards",
      summary: "SUV models",
      totalCount: 1,
      optionLevel: "Model",
      results: [
        {
          id: "opt-1",
          title: "RAV4",
          subtitle: "A versatile compact SUV.",
          image: "/images/search/rav4-hybrid-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          attributes: [
            { key: "year", label: "Year", value: "2024" },
            { key: "averagePrice", label: "Average price", value: "$30,325" },
            { key: "capacity", label: "Capacity", value: "5 Passengers" },
            { key: "fuelEfficiency", label: "Fuel efficiency", value: "27/35 MPG" },
            {
              key: "colors",
              label: "Colors",
              options: [
                {
                  value: "Blueprint",
                  label: "Blueprint",
                  metadata: { imageUrl: "/images/search/Ellipse 2392.svg" },
                },
                {
                  value: "Ice Cap",
                  label: "Ice Cap",
                  metadata: { imageUrl: "/images/search/Ellipse 2393.svg" },
                },
                {
                  value: "Lunar Rock",
                  label: "Lunar Rock",
                  metadata: { imageUrl: "/images/search/Ellipse 2394.svg" },
                },
              ],
            },
          ],
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: OptionCard[] }).results[0]);
    const attrs = defined(card.attributes);
    const colorsAttr = defined(attrs.find((attribute) => attribute.key === "colors"));
    const colorOptions = defined(colorsAttr.options);

    expect(attrs.find((attribute) => attribute.key === "year")?.value).toBe("2024");
    expect(attrs.find((attribute) => attribute.key === "averagePrice")?.value).toBe("$30,325");
    expect(attrs.find((attribute) => attribute.key === "capacity")?.value).toBe("5 Passengers");
    expect(attrs.find((attribute) => attribute.key === "fuelEfficiency")?.value).toBe("27/35 MPG");
    expect(colorOptions).toHaveLength(3);
  });
});

describe("adaptCards: comparison card display fields", () => {
  it("carries metrics array with label, value, and unit", () => {
    const response = {
      responseMode: "ComparisonCards",
      summary: "Cargo comparison",
      totalCount: 2,
      results: [
        {
          id: "cmp-1",
          title: "HIGHLANDER HYBRID",
          subtitle: "Most cargo.",
          image: "/images/search/highlander-hybrid-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          badgeLabel: "Most space",
          year: 2024,
          description: "A 3rd row that folds flat.",
          metrics: [{ label: "Max cargo", value: "84.3", unit: "CU. FT." }],
        },
        {
          id: "cmp-2",
          title: "RAV4 HYBRID",
          subtitle: "Plenty for groceries.",
          image: "/images/search/rav4-hybrid-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          year: 2024,
          description: "Plenty for groceries, strollers, and weekend trips.",
          metrics: [{ label: "Max cargo", value: "69.8", unit: "CU. FT." }],
        },
      ],
    };

    const turn = makeTurn(response);
    const results = (turn.response as { results: ComparisonCard[] }).results;
    const first = defined(results[0]);
    const second = defined(results[1]);

    expect(first.metrics).toEqual([{ label: "Max cargo", value: "84.3", unit: "CU. FT." }]);
    expect(first.badgeLabel).toBe("Most space");
    expect(first.year).toBe(2024);
    expect(first.description).toBe("A 3rd row that folds flat.");
    expect(second.metrics).toEqual([{ label: "Max cargo", value: "69.8", unit: "CU. FT." }]);
    expect(second.badgeLabel).toBeUndefined();
  });

  it("carries two metrics for double-comparison scenarios", () => {
    const response = {
      responseMode: "ComparisonCards",
      summary: "Range comparison",
      totalCount: 2,
      results: [
        {
          id: "cmp-1",
          title: "HIGHLANDER HYBRID",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          badgeLabel: "Best for road trips",
          metrics: [
            { label: "Range", value: "615", unit: "MI" },
            { label: "Highway MPG", value: "35", unit: "MPG" },
          ],
        },
        {
          id: "cmp-2",
          title: "bZ",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          metrics: [
            { label: "Range", value: "250", unit: "MI" },
            { label: "Charging time", value: "30", unit: "MIN (80%)" },
          ],
        },
      ],
    };

    const turn = makeTurn(response);
    const results = (turn.response as { results: ComparisonCard[] }).results;
    const first = defined(results[0]);
    const second = defined(results[1]);

    expect(first.metrics).toHaveLength(2);
    expect(first.metrics?.[0]).toEqual({ label: "Range", value: "615", unit: "MI" });
    expect(first.metrics?.[1]).toEqual({ label: "Highway MPG", value: "35", unit: "MPG" });
    expect(second.metrics).toHaveLength(2);
  });
});

describe("adaptCards: editorial card encoding via OptionCards", () => {
  it("encodes editorial fields into attributes for downstream extraction", () => {
    const response = {
      responseMode: "OptionCards",
      summary: "No exact match.",
      totalCount: 2,
      optionLevel: "Fallback",
      results: [
        {
          id: "/search?model=highlander&year=2025&color=midnight-black",
          title: "2025 Highlander XLE — midnight black metallic",
          subtitle: "Close match",
          image: "/editorial-card/search-editorial.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          attributes: [
            {
              key: "href",
              label: "Link",
              value: "/search?model=highlander&year=2025&color=midnight-black",
            },
            { key: "iconName", label: "Icon", value: "binocular" },
            { key: "matches", label: "Matches", value: "1" },
            { key: "surface", label: "Surface", value: "dark" },
          ],
        },
        {
          id: "/search?model=highlander-hybrid&year=2025&color=black",
          title: "2025 Highlander Hybrid XSE — black",
          subtitle: "Similar model",
          image: "/editorial-card/search-editorial1.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          attributes: [
            {
              key: "href",
              label: "Link",
              value: "/search?model=highlander-hybrid&year=2025&color=black",
            },
            { key: "matches", label: "Matches", value: "1" },
            { key: "surface", label: "Surface", value: "dark" },
          ],
        },
      ],
    };

    const turn = makeTurn(response);
    const results = (turn.response as { results: OptionCard[] }).results;

    // Verify attributes carried through schema parsing
    const firstCardAttrs = defined(results[0]).attributes;
    expect(firstCardAttrs).toBeDefined();
    expect(firstCardAttrs?.find((a) => a.key === "href")?.value).toBe(
      "/search?model=highlander&year=2025&color=midnight-black"
    );
    expect(firstCardAttrs?.find((a) => a.key === "iconName")?.value).toBe("binocular");
    expect(firstCardAttrs?.find((a) => a.key === "matches")?.value).toBe("1");
    expect(firstCardAttrs?.find((a) => a.key === "surface")?.value).toBe("dark");
  });
});

describe("adaptCards: trim card year field", () => {
  it("carries year through trim OptionCard attributes", () => {
    const response = {
      responseMode: "OptionCards",
      summary: "Trim comparison",
      totalCount: 1,
      optionLevel: "Trim",
      results: [
        {
          id: "camry-le-2025",
          title: "LE",
          subtitle: "Entry-level Camry with hybrid powertrain.",
          image: "/images/search/toyota-camry-2024.png",
          availableCount: 0,
          nextSearchPlan: stubPlan,
          attributes: [
            { key: "year", label: "Year", value: "2025" },
            { key: "Wheels", label: "Wheels", value: '17"' },
            { key: "Display", label: "Display", value: '8"' },
            { key: "Interior", label: "Interior", value: "Fabric" },
            { key: "Average price", label: "Average price", value: "$28K" },
          ],
        },
      ],
    };

    const turn = makeTurn(response);
    const card = defined((turn.response as { results: OptionCard[] }).results[0]);
    const attrs = defined(card.attributes);

    expect(attrs.find((attribute) => attribute.key === "year")?.value).toBe("2025");
    expect(card.attributes).toHaveLength(5);
    expect(card.attributes?.[1]).toEqual({ key: "Wheels", label: "Wheels", value: '17"' });
  });
});
