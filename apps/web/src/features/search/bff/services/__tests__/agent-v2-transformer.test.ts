// @vitest-environment node
import { firstOf } from "@ucmp/vitest-config/test-utils/pure";
import { describe, expect, it, vi } from "vitest";

import { parseSseStream } from "../../lib/sse-line-parser";
import { normalizeV2Event, transformV2Events } from "../agent-v2-transformer";

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockSseStream(events: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}

async function collect(events: unknown[]): Promise<Record<string, unknown>[]> {
  const parsed = parseSseStream(createMockSseStream(events));
  const transformed = transformV2Events(parsed, "session-v2", "visitor-v2");

  const results: Record<string, unknown>[] = [];
  for await (const event of transformed) {
    results.push(event);
  }
  return results;
}

const V2_COMPLETE_OPTION_CARDS = {
  type: "Complete",
  payload: {
    searchId: "5db2c8df-8fc4-48b3-9265-a227db1643ab",
    searchMode: "Exploration",
    filters: [{ key: "vehicleCategory", value: "Truck" }],
    smartFilters: [
      {
        key: "vehicleCategory",
        label: "Type",
        type: "Enum",
        options: [{ value: "Truck", label: "Trucks", count: 0 }],
      },
    ],
    response: {
      cards: {
        responseMode: "OptionCards",
        summary: "Given shopping for trucks…",
        totalCount: 601,
        layoutHint: "grid",
        optionLevel: "Category",
        items: [
          {
            id: "modelFamily:tacoma",
            cardType: "option",
            nextSearchPlan: {
              searchId: "a83d2292-9e10-4da5-9367-d3ebc6c1ce0b",
              filters: [
                { key: "vehicleCategory", value: "Truck" },
                { key: "model", value: "tacoma" },
              ],
              location: {
                zipCode: "91711",
                latitude: 34.0966,
                longitude: -117.7198,
                radiusMiles: 100,
              },
              responseMode: "InventoryCards",
              explorationAxes: [],
            },
            data: { title: "tacoma", subtitle: "398 vehicles", theme: "vehicle" },
          },
        ],
      },
    },
    effectiveLocation: {
      zipCode: "91711",
      latitude: 34.0966,
      longitude: -117.7198,
      radiusMiles: 100,
    },
  },
};

describe("normalizeV2Event", () => {
  it("lifts payload.response.cards to payload.cards on Complete events", () => {
    const normalized = normalizeV2Event(V2_COMPLETE_OPTION_CARDS) as Record<string, unknown>;
    const payload = normalized.payload as Record<string, unknown>;

    expect(payload).toHaveProperty("cards");
    expect(payload).not.toHaveProperty("response");
    expect((payload.cards as Record<string, unknown>).responseMode).toBe("OptionCards");
  });

  it("leaves non-Complete events untouched", () => {
    const status = { type: "Status", searchId: "x", stage: "Planning" };

    expect(normalizeV2Event(status)).toStrictEqual(status);
  });

  it("leaves an already-base-shaped Complete (payload.cards) untouched", () => {
    const baseShaped = {
      type: "Complete",
      payload: { searchId: "x", searchMode: "Exploration", cards: { items: [] } },
    };

    expect(normalizeV2Event(baseShaped)).toStrictEqual(baseShaped);
  });
});

function withOptionCardTheme(theme: string) {
  const base = structuredClone(V2_COMPLETE_OPTION_CARDS);
  const cards = (base.payload.response as Record<string, unknown>).cards as Record<string, unknown>;
  const items = cards.items as Record<string, unknown>[];
  (firstOf(items).data as Record<string, unknown>).theme = theme;
  return base;
}

describe("transformV2Events", () => {
  it("maps a non-axis option card to a spec card (v2 keys off data.theme)", async () => {
    const results = await collect([V2_COMPLETE_OPTION_CARDS]);

    expect(results).toHaveLength(1);
    const complete = firstOf(results);
    expect(complete.type).toBe("Complete");

    const payload = complete.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    expect(response.responseMode).toBe("OptionCards");

    const cards = response.results as Record<string, unknown>[];
    expect(cards).toHaveLength(1);
    expect(cards[0]?.type).toBe("spec");
    expect(cards[0]?.title).toBe("tacoma");
  });

  it("maps an axis_-themed option card to a pill card", async () => {
    const results = await collect([withOptionCardTheme("axis_price")]);

    const complete = firstOf(results);
    const payload = complete.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    const cards = response.results as Record<string, unknown>[];

    expect(cards).toHaveLength(1);
    expect(cards[0]?.type).toBe("pill");
    expect(cards[0]?.title).toBe("tacoma");
  });

  it("maps a scope_gateway option card to a distinct nudge card", async () => {
    const results = await collect([withOptionCardTheme("scope_gateway")]);

    const [complete] = results;
    const payload = complete?.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    const cards = response.results as Record<string, unknown>[];

    expect(cards).toHaveLength(1);
    expect(cards[0]?.type).toBe("nudge");
    expect(cards[0]?.title).toBe("tacoma");
  });

  it("strips debug from card and response nextSearchPlan (v2 carries no debug)", async () => {
    const results = await collect([V2_COMPLETE_OPTION_CARDS]);

    const complete = firstOf(results);
    const payload = complete.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;

    const responseNextSearchPlan = response.nextSearchPlan as Record<string, unknown>;
    expect(responseNextSearchPlan).not.toHaveProperty("debug");

    const cards = response.results as Record<string, unknown>[];
    const cardNextSearchPlan = cards[0]?.nextSearchPlan as Record<string, unknown>;
    expect(cardNextSearchPlan).not.toHaveProperty("debug");
  });

  it("maps a comparison card via the shared base mapper (v2 exercises base for non-option cards)", async () => {
    const event = {
      type: "Complete",
      payload: {
        searchId: "5db2c8df-8fc4-48b3-9265-a227db1643ab",
        searchMode: "Inventory",
        response: {
          cards: {
            responseMode: "InventoryCards",
            summary: "Comparing trims.",
            totalCount: 2,
            items: [
              {
                id: "compare-1",
                cardType: "comparison",
                nextSearchPlan: {
                  searchId: "5db2c8df-8fc4-48b3-9265-a227db1643ab",
                  filters: [{ key: "model", value: "tacoma" }],
                },
                data: {
                  title: "Tacoma SR5 vs TRD",
                  attributes: [
                    { key: "priceRange", label: "Price range", min: "$30,000", max: "$45,000" },
                  ],
                },
              },
            ],
          },
        },
      },
    };

    const results = await collect([event]);

    expect(results).toHaveLength(1);
    const payload = results[0]?.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    const cards = response.results as Record<string, unknown>[];

    expect(cards).toHaveLength(1);
    expect(cards[0]?.type).toBe("spec");
    expect(cards[0]?.title).toBe("Tacoma SR5 vs TRD");
    const data = cards[0]?.data as { specs: Record<string, unknown>[]; show: number };
    expect(data.show).toBe(3);
    expect(data.specs[0]).toStrictEqual({
      key: "priceRange",
      label: "Price range",
      min: "$30,000",
      max: "$45,000",
    });
  });

  it("passes Status and Delta events through", async () => {
    const results = await collect([
      { type: "Status", searchId: "x", stage: "Planning" },
      { type: "Delta", text: "Narrowing down trucks…" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toStrictEqual({ type: "Status", searchId: "x", stage: "Planning" });
    expect(results[1]).toStrictEqual({ type: "Delta", text: "Narrowing down trucks…" });
  });

  it("surfaces an Error frame when a Complete event fails schema validation", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const badComplete = {
      type: "Complete",
      payload: {
        searchId: "x",
        searchMode: "Inventory",
        cards: { responseMode: "InventoryCards" },
      },
    };

    const results = await collect([badComplete]);

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe("Error");
    const error = results[0]?.error as Record<string, unknown>;
    expect(error.code).toBe("AGENT_COMPLETE_PARSE_FAILED");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("drops non-Complete events that fail validation without emitting an Error frame", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const results = await collect([{ type: "Status" }]);

    expect(results).toHaveLength(0);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
