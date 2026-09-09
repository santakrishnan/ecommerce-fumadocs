// @vitest-environment node
import { describe, expect, it } from "vitest";
import type {
  BaseCardItem,
  BaseCompletePayload,
  BaseLocation,
} from "../../contracts/agent-upstream.schema";
import type { BaseDebugContext, MappedCard } from "../agent-card.mapper";
import { mapBaseCard, transformBaseCompletePayload } from "../agent-card.mapper";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOC_A: BaseLocation = { zipCode: "78701", latitude: 30.267, longitude: -97.743 };
const LOC_B: BaseLocation = { zipCode: "80202", latitude: 39.739, longitude: -104.984 };
const LOC_C: BaseLocation = { zipCode: "97201", latitude: 45.523, longitude: -122.676 };

const BASE_CARDS: BaseCompletePayload["cards"] = {
  responseMode: "OptionCards",
  optionLevel: "Fallback",
  summary: "Test summary",
  totalCount: 0,
  items: [],
};

function makeItem(location?: BaseLocation, id = "card-1") {
  return {
    id,
    cardType: "option" as const,
    data: { title: id },
    nextSearchPlan: {
      searchId: "test-search-id",
      filters: [],
      ...(location === undefined ? {} : { location }),
    },
  };
}

function extractLocation(result: Record<string, unknown>): unknown {
  const payload = result.payload as Record<string, unknown>;
  const response = payload.response as Record<string, unknown>;
  const nextPlan = response.nextSearchPlan as Record<string, unknown>;
  const debug = nextPlan.debug as Record<string, unknown>;
  const turnContext = debug.turnContext as Record<string, unknown>;
  return (turnContext.activeSearchPlan as Record<string, unknown>).location;
}

// ---------------------------------------------------------------------------
// _resolvedLocation fallback
// ---------------------------------------------------------------------------

describe("transformBaseCompletePayload — _resolvedLocation", () => {
  it("uses effectiveLocation when present", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      effectiveLocation: LOC_A,
      cards: { ...BASE_CARDS, items: [makeItem(undefined)] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toEqual(LOC_A);
  });

  it("falls back to first item's location when effectiveLocation is absent", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      cards: { ...BASE_CARDS, items: [makeItem(LOC_A)] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toEqual(LOC_A);
  });

  it("skips leading items without a location and returns the first non-null location", () => {
    // First two items have no location key — the fix should scan past them.
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      cards: {
        ...BASE_CARDS,
        items: [
          makeItem(undefined, "card-1"), // no location
          makeItem(undefined, "card-2"), // no location
          makeItem(LOC_B, "card-3"), // first item with location
          makeItem(LOC_C, "card-4"),
        ],
      },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toEqual(LOC_B);
  });

  it("returns null when no item carries a location and effectiveLocation is absent", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      cards: {
        ...BASE_CARDS,
        items: [makeItem(undefined, "card-1"), makeItem(undefined, "card-2")],
      },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toBeNull();
  });

  it("returns null when items array is empty and effectiveLocation is absent", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      cards: { ...BASE_CARDS, items: [] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toBeNull();
  });

  it("effectiveLocation wins even when the first item also has a location", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      effectiveLocation: LOC_C,
      cards: { ...BASE_CARDS, items: [makeItem(LOC_A)] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractLocation(result)).toEqual(LOC_C);
  });
});

// ---------------------------------------------------------------------------
// debug.visitorId propagation (anonymous vs resolved)
// ---------------------------------------------------------------------------

function extractDebugVisitorId(result: Record<string, unknown>): unknown {
  const payload = result.payload as Record<string, unknown>;
  const response = payload.response as Record<string, unknown>;
  const nextPlan = response.nextSearchPlan as Record<string, unknown>;
  const debug = nextPlan.debug as Record<string, unknown>;
  return debug.visitorId;
}

describe("transformBaseCompletePayload — debug.visitorId", () => {
  const payload: BaseCompletePayload = {
    searchId: "test-search-id",
    searchMode: "Exploration",
    effectiveLocation: LOC_A,
    cards: { ...BASE_CARDS, items: [makeItem(undefined)] },
  };

  it("embeds the resolved visitorId when provided", () => {
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    expect(extractDebugVisitorId(result)).toBe("visitor-1");
  });

  it("embeds null (never an empty string) for anonymous visitors", () => {
    const result = transformBaseCompletePayload(payload, "session-1", null);
    expect(extractDebugVisitorId(result)).toBeNull();
    expect(extractDebugVisitorId(result)).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// avgMileage spec normalization
// ---------------------------------------------------------------------------

function makeSpecItem(
  cardType: "option" | "comparison" | "concept",
  avgMileageValue: string | undefined
) {
  const attributes = [
    { key: "priceRange", label: "Price range", min: "$25,000", max: "$50,000" },
    ...(avgMileageValue === undefined
      ? []
      : [{ key: "avgMileage", label: "Avg. mileage", value: avgMileageValue }]),
  ];
  return {
    id: "card-spec",
    cardType,
    data: { title: "Test", attributes },
    nextSearchPlan: {
      searchId: "test-search-id",
      filters: [],
      responseMode: cardType === "option" ? "OptionCards" : undefined,
    },
  };
}

function extractSpecs(result: Record<string, unknown>, cardIndex = 0): unknown[] {
  const payload = result.payload as Record<string, unknown>;
  const response = payload.response as Record<string, unknown>;
  const results = response.results as Record<string, unknown>[];
  const card = results[cardIndex] as Record<string, unknown>;
  const data = card.data as Record<string, unknown>;
  return data.specs as unknown[];
}

describe("transformBaseCompletePayload — avgMileage normalization", () => {
  const basePayload = {
    searchId: "test-search-id",
    searchMode: "Exploration",
    effectiveLocation: LOC_A,
  } as const;

  it("strips tilde and trailing unit, rounds to nearest 50 on an option card", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: { ...BASE_CARDS, items: [makeSpecItem("option", "~3,823 mi")] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const mileageSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "avgMileage");
    // 3823 / 50 = 76.46 → rounds to 76 → 76 * 50 = 3,800
    expect(mileageSpec?.value).toBe("3,800");
  });

  it("rounds up to nearest 50 when appropriate on an option card", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: { ...BASE_CARDS, items: [makeSpecItem("option", "~1,953 mi")] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const mileageSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "avgMileage");
    // 1953 / 50 = 39.06 → rounds to 39 → 39 * 50 = 1,950
    expect(mileageSpec?.value).toBe("1,950");
  });

  it("does not affect other spec attributes", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: { ...BASE_CARDS, items: [makeSpecItem("option", "~3,823 mi")] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const priceSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "priceRange");
    expect(priceSpec?.min).toBe("$25,000");
    expect(priceSpec?.max).toBe("$50,000");
  });

  it("sets value to undefined when avgMileage is non-numeric", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: { ...BASE_CARDS, items: [makeSpecItem("option", "~N/A")] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const mileageSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "avgMileage");
    expect(mileageSpec?.value).toBeUndefined();
  });

  it("applies normalization on a comparison card", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: {
        ...BASE_CARDS,
        responseMode: "InventoryCards",
        items: [makeSpecItem("comparison", "~12,075 mi")],
      },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const mileageSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "avgMileage");
    // 12075 / 50 = 241.5 → rounds to 242 → 242 * 50 = 12,100
    expect(mileageSpec?.value).toBe("12,100");
  });

  it("applies normalization on a concept card", () => {
    const payload: BaseCompletePayload = {
      ...basePayload,
      cards: { ...BASE_CARDS, items: [makeSpecItem("concept", "~8,450 mi")] },
    };
    const result = transformBaseCompletePayload(payload, "session-1", null);
    const specs = extractSpecs(result);
    const mileageSpec = (specs as Record<string, unknown>[]).find((s) => s.key === "avgMileage");
    expect(mileageSpec?.value).toBe("8,450");
  });
});

// ---------------------------------------------------------------------------
// scope_gateway (guided nudge) card mapping
// ---------------------------------------------------------------------------

const DEBUG: BaseDebugContext = {
  invokeMode: "aws",
  runtimeSessionId: "session-1",
  stream: true,
  visitorId: "visitor-1",
};

function makeScopeGatewayCard(): BaseCardItem {
  return {
    id: "scope-1",
    cardType: "option",
    nextSearchPlan: {
      searchId: "test-search-id",
      filters: [
        { key: "model", value: "Tundra" },
        { key: "powertrainType", value: "Hybrid" },
      ],
      responseMode: "OptionCards",
    },
    data: {
      title: "Broadened powertrain from phev to hybrid",
      theme: "scope_gateway",
    },
  } as BaseCardItem;
}

type MappedNudgeCard = Extract<MappedCard, { type: "nudge" }>;

function mapScopeGateway(): MappedNudgeCard {
  const mapped = mapBaseCard(makeScopeGatewayCard(), "OptionCards", DEBUG);
  if (mapped.type !== "nudge") {
    throw new Error(`Expected scope_gateway to map to a nudge card, got "${mapped.type}"`);
  }
  return mapped;
}

describe("mapBaseCard — scope_gateway (nudge)", () => {
  it("maps a scope_gateway option card to a distinct nudge card", () => {
    const mapped = mapScopeGateway();
    expect(mapped.type).toBe("nudge");
    expect(mapped.title).toBe("Broadened powertrain from phev to hybrid");
  });

  it("carries the nextSearchPlan through so the card is clickable", () => {
    const mapped = mapScopeGateway();
    expect(mapped.nextSearchPlan.searchId).toBe("test-search-id");
    expect(mapped.nextSearchPlan.responseMode).toBe("OptionCards");
  });
});

describe("transformBaseCompletePayload — scope_gateway (nudge)", () => {
  it("maps a scope_gateway card to a nudge card in the results", () => {
    const payload: BaseCompletePayload = {
      searchId: "test-search-id",
      searchMode: "Exploration",
      effectiveLocation: LOC_A,
      cards: {
        responseMode: "OptionCards",
        summary:
          "We didn't find anything in stock for Tundra, phev. Pick a card below to broaden your search.",
        totalCount: 0,
        items: [makeScopeGatewayCard()],
      },
    };
    const result = transformBaseCompletePayload(payload, "session-1", "visitor-1");
    const response = (result.payload as Record<string, unknown>).response as Record<
      string,
      unknown
    >;
    const results = response.results as MappedCard[];
    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe("nudge");
    expect(results[0]?.title).toBe("Broadened powertrain from phev to hybrid");
  });
});
