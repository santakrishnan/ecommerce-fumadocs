// @vitest-environment node
import { firstOf } from "@ucmp/vitest-config/test-utils/pure";
import { describe, expect, it } from "vitest";

import { parseSseStream } from "../../lib/sse-line-parser";
import { transformV1Events } from "../agent-v1-transformer";

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
  const transformed = transformV1Events(parsed, "session-v1", "visitor-v1");

  const results: Record<string, unknown>[] = [];
  for await (const event of transformed) {
    results.push(event);
  }
  return results;
}

const V1_COMPLETE_OPTION_CARDS = {
  type: "Complete",
  payload: {
    searchId: "a23a710a-94df-46d8-8cb5-7e4040bc0bd5",
    searchMode: "Exploration",
    filters: [{ key: "bodyStyle", values: ["Truck"] }],
    smartFilters: [],
    response: {
      cards: {
        responseMode: "OptionCards",
        summary: "528 trucks across 8 models.",
        totalCount: 528,
        optionLevel: "Model",
        items: [
          {
            id: "opt-tacoma",
            cardType: "option",
            nextSearchPlan: {
              searchId: "a23a710a-94df-46d8-8cb5-7e4040bc0bd5",
              filters: [
                { key: "bodyStyle", values: ["Truck"] },
                { key: "model", values: ["tacoma"] },
              ],
            },
            data: {
              title: "tacoma",
              subtitle: "309 available",
              availableCount: 309,
              highlights: ["$27,500–$58,098", "2018–2026", "7 trims"],
            },
          },
        ],
      },
    },
  },
};

function withScopeGatewayCard() {
  const base = structuredClone(V1_COMPLETE_OPTION_CARDS);
  const cards = (base.payload.response as Record<string, unknown>).cards as Record<string, unknown>;
  const items = cards.items as Record<string, unknown>[];
  const [first] = items;
  (first?.data as Record<string, unknown>).theme = "scope_gateway";
  (first?.data as Record<string, unknown>).title = "Broadened powertrain from phev to hybrid";
  return base;
}

describe("transformV1Events", () => {
  it("maps a scope_gateway option card to a distinct nudge card (demo v1 path)", async () => {
    const results = await collect([withScopeGatewayCard()]);

    const [complete] = results;
    const payload = complete?.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    const cards = response.results as Record<string, unknown>[];

    expect(cards).toHaveLength(1);
    expect(cards[0]?.type).toBe("nudge");
    expect(cards[0]?.title).toBe("Broadened powertrain from phev to hybrid");
  });

  it("maps a v1 option card to a spec card with highlights stubbed as spec rows", async () => {
    const results = await collect([V1_COMPLETE_OPTION_CARDS]);

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

    const data = cards[0]?.data as { specs: Record<string, unknown>[]; show: number };
    expect(data.show).toBe(4);
    expect(data.specs).toStrictEqual([
      { key: "", label: "", value: "$27,500–$58,098" },
      { key: "", label: "", value: "2018–2026" },
      { key: "", label: "", value: "7 trims" },
    ]);
  });

  it("passes Status and Delta events through, backfilling beat/message from stage on Status", async () => {
    const results = await collect([
      { type: "Status", searchId: "x", stage: "Planning" },
      { type: "Delta", text: "Narrowing down trucks…" },
    ]);

    expect(results).toStrictEqual([
      { type: "Status", searchId: "x", stage: "Planning", beat: "Planning", message: "Planning" },
      { type: "Delta", text: "Narrowing down trucks…" },
    ]);
  });

  it("sources response-level filters from payload.filters (v1 has no smartFilters)", async () => {
    const event = {
      type: "Complete",
      payload: {
        searchId: "9321016b-f06d-4392-9abe-6aa505c3da57",
        searchMode: "Exploration",
        // Active selection lives here for v1; smartFilters is absent.
        filters: [{ key: "bodyStyle", values: ["Truck"] }],
        response: {
          cards: {
            responseMode: "OptionCards",
            summary: "528 trucks.",
            totalCount: 528,
            optionLevel: "Model",
            items: [],
          },
        },
      },
    };

    const results = await collect([event]);

    expect(results).toHaveLength(1);
    const payload = results[0]?.payload as Record<string, unknown>;
    const response = payload.response as Record<string, unknown>;
    const nextSearchPlan = response.nextSearchPlan as Record<string, unknown>;

    expect(payload.filters).toStrictEqual([{ key: "bodyStyle", values: ["Truck"] }]);
    expect(nextSearchPlan.filters).toStrictEqual([{ key: "bodyStyle", values: ["Truck"] }]);
  });

  it("maps an inventory card via the shared base mapper (v1 exercises base for non-option cards)", async () => {
    const event = {
      type: "Complete",
      payload: {
        searchId: "9321016b-f06d-4392-9abe-6aa505c3da57",
        searchMode: "Inventory",
        filters: [{ key: "model", values: ["tacoma"] }],
        response: {
          cards: {
            responseMode: "InventoryCards",
            summary: "1 Tacoma.",
            totalCount: 1,
            items: [
              {
                id: "vin-123",
                cardType: "inventory",
                nextSearchPlan: { searchId: "9321016b-f06d-4392-9abe-6aa505c3da57", filters: [] },
                data: {
                  title: "2024 Tacoma SR5",
                  vehicleInfo: { make: "Toyota", model: "Tacoma", trim: "SR5", year: 2024 },
                  media: { primaryImageUrl: "https://example.com/tacoma.jpg" },
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
    expect(cards[0]?.type).toBe("inventory");
    expect(cards[0]?.title).toBe("2024 Tacoma SR5");
    const data = cards[0]?.data as { vehicle: Record<string, unknown> };
    expect(data.vehicle.title).toBe("2024 Tacoma SR5");
  });

  it("backfills label/count on v1 smartFilters options so the Complete still validates", async () => {
    const event = {
      type: "Complete",
      payload: {
        searchId: "9321016b-f06d-4392-9abe-6aa505c3da57",
        searchMode: "Inventory",
        // v1 shape: options omit the label/count the shared schema requires.
        smartFilters: [
          { key: "make", label: "Make", type: "Enum", options: [{ value: "toyota", count: 308 }] },
          { key: "trim", label: "Trim", type: "MultiEnum", options: [{ value: "SR5" }] },
        ],
        response: {
          cards: {
            responseMode: "InventoryCards",
            summary: "308 Tacomas.",
            totalCount: 308,
            items: [],
          },
        },
      },
    };

    const results = await collect([event]);

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe("Complete");

    const payload = results[0]?.payload as Record<string, unknown>;
    const smartFilters = payload.smartFilters as { options: Record<string, unknown>[] }[];
    expect(smartFilters[0]?.options[0]).toStrictEqual({
      value: "toyota",
      label: "toyota",
      count: 308,
    });
    expect(smartFilters[1]?.options[0]).toStrictEqual({ value: "SR5", label: "SR5", count: 0 });
  });
});
