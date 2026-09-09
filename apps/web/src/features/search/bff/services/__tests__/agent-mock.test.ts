// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockSearchAgentStream } = await import("../agent-mock");

const SEARCH_ID_REGEX = /"searchId":"[0-9a-f-]{36}"/;

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(decoder.decode(value, { stream: true }));
    }
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}

async function drainStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const [read, advance] = [readStream(stream), vi.runAllTimersAsync()];
  const [text] = await Promise.all([read, advance]);
  return text;
}

/** Loose result shape for test assertions — mirrors raw JSON from the mock stream. */
interface AgentMockAttributeOption {
  label: string;
  metadata?: { imageUrl?: string };
  value?: string;
}

interface AgentMockAttribute {
  key: string;
  label?: string;
  options?: AgentMockAttributeOption[];
  value: string;
}

interface AgentMockResult {
  aiDescription?: string;
  attributes?: AgentMockAttribute[];
  avgPrice?: string;
  badgeLabel?: string;
  capacity?: string;
  colors?: Array<{ label: string; svgSrc: string }>;
  description?: string;
  fuelEfficiency?: string;
  metrics?: Array<{ label: string; value: string; unit: string }>;
  pricing?: { originalPrice?: number; listPrice?: number; sellingPrice?: number };
  surface?: string;
  title?: string;
  /** Base per-card type discriminator */
  type?: string;
  year?: number;
  [key: string]: unknown;
}

interface AgentMockResponse {
  nextSearchPlan?: Record<string, unknown>;
  optionLevel?: string;
  responseMode?: string;
  results: AgentMockResult[];
  summary?: string;
  totalCount?: number;
}

/** Extracts and parses the Complete event payload from an SSE stream text. */
function extractCompletePayload(text: string): {
  payload: { response: AgentMockResponse };
} {
  const line = text.split("\n").find((l) => l.includes('"type":"Complete"'));
  if (!line) {
    throw new Error("No Complete event found in stream");
  }
  return JSON.parse(line.replace("data: ", ""));
}

describe("mockSearchAgentStream", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normal query → streams Status frames followed by Complete with cards", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "SUV under 30k" }));
    expect(text).toContain('"type":"Status"');
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"stage":"Planning"');
    expect(text).toContain('"stage":"Summarizing"');
  });

  it("'suv' query → OptionCards response mode (model cards)", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "suv" }));
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"OptionCards"');
  });

  it("'truck' query → InventoryCards response mode", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "truck" }));
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"InventoryCards"');
  });

  it("'cargo' query → ComparisonCards response mode", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "cargo" }));
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"ComparisonCards"');
  });

  it("'off-topic' query → OptionCards with empty results (conversational response)", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "off-topic" }));
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"OptionCards"');
    expect(text).toContain('"results":[]');
  });

  it("'trim' query → OptionCards response mode with trim-level data", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "trim" }));
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"OptionCards"');
    expect(text).toContain('"optionLevel":"Trim"');
  });

  it("generates a searchId when not provided", async () => {
    const text = await drainStream(mockSearchAgentStream({ query: "suv" }));
    // searchId should be a UUID in the Complete payload
    expect(text).toMatch(SEARCH_ID_REGEX);
  });

  it("uses provided searchId when given", async () => {
    const text = await drainStream(
      mockSearchAgentStream({ query: "suv", searchId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" })
    );
    expect(text).toContain('"searchId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"');
  });

  // ─── Display field passthrough tests ────────────────────────────────────────

  describe("display field passthrough", () => {
    it("'suv' query → carries model display fields via attributes", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "suv" }));
      const results = extractCompletePayload(text).payload.response.results;
      const firstResult = results.at(0);
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }
      const firstAttrs = firstResult.attributes;
      if (!firstAttrs) {
        throw new Error("Expected attributes on first result");
      }
      const colorsAttr = firstAttrs.find((a) => a.key === "colors");
      const colorOptions = colorsAttr?.options ?? [];

      // First model card should match fixture-backed attribute fields.
      expect(firstAttrs.find((a) => a.key === "year")?.value).toBe("2024");
      expect(firstAttrs.find((a) => a.key === "averagePrice")?.value).toBe("$28k avg");
      expect(firstAttrs.find((a) => a.key === "capacity")?.value).toBe("5 passengers");
      expect(firstAttrs.find((a) => a.key === "fuelEfficiency")?.value).toBe("40 MPG city");
      expect(firstResult.title).toBe("RAV4 Hybrid");
      expect(colorOptions).toHaveLength(4);
      expect(colorOptions[0]?.metadata?.imageUrl).toContain("/images/search/Ellipse 2392.svg");
    });

    it("'truck' query → carries inventory card pricing and media fields", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "truck" }));
      const results = extractCompletePayload(text).payload.response.results;

      // First truck result should have pricing data
      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.pricing).toBeDefined();
      expect(firstResult.pricing?.listPrice).toBeDefined();
    });

    it("'cargo' query → carries comparison card attributes and nextSearchPlan", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "cargo" }));
      const results = extractCompletePayload(text).payload.response.results;

      // First comparison card should have a title
      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.title).toBeDefined();
      expect(typeof firstResult.title).toBe("string");

      // Second card should also exist
      const secondResult = results[1];
      if (!secondResult) {
        throw new Error("Expected at least two results");
      }

      expect(secondResult.title).toBeDefined();
    });

    it("'long trip' query → resolves to comparison fixture", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "long trip" }));
      const results = extractCompletePayload(text).payload.response.results;

      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.title).toBeDefined();
      expect(firstResult.subtitle).toBeDefined();
      expect(firstResult.availableCount).toBeGreaterThan(0);
      expect(firstResult.nextSearchPlan).toBeDefined();
    });

    it("'low mileage' query → resolves to inventory fixture", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "low mileage" }));
      const results = extractCompletePayload(text).payload.response.results;

      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.pricing).toBeDefined();
      expect(firstResult.pricing?.listPrice).toBeDefined();
    });

    it("'no-matching' query → resolves to fallback option cards", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "no-matching" }));
      const results = extractCompletePayload(text).payload.response.results;

      // Fallback cards are option cards
      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.title).toBeDefined();
      expect(typeof firstResult.title).toBe("string");
      expect(results.length).toBeGreaterThan(0);
    });

    it("'trim' query → carries year on trim-level option cards", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "trim" }));
      const results = extractCompletePayload(text).payload.response.results;
      const firstResult = results.at(0);
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }
      const firstAttrs = firstResult.attributes;
      if (!firstAttrs) {
        throw new Error("Expected attributes on first result");
      }

      expect(firstAttrs).toContainEqual({
        key: "year",
        label: "Year",
        value: "2024",
      });
      expect(firstAttrs).toContainEqual({
        key: "wheels",
        label: "Wheels",
        value: '17"',
      });
    });

    it("'family' query → model cards carry colors in attributes with option metadata", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "family" }));
      const results = extractCompletePayload(text).payload.response.results;
      const firstResult = results.at(0);
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }
      const firstAttrs = firstResult.attributes;
      if (!firstAttrs) {
        throw new Error("Expected attributes on first result");
      }
      const colorsAttr = firstAttrs.find((a) => a.key === "colors");
      const colorOptions = colorsAttr?.options ?? [];

      expect(colorOptions).toHaveLength(4);
      expect(colorOptions[0]?.label).toBe("Gray");
      expect(colorOptions[0]?.metadata?.imageUrl).toBeDefined();
      expect(String(colorOptions[0]?.metadata?.imageUrl)).toContain(
        "/images/search/Ellipse 2392.svg"
      );
    });

    it("'8 inventory' query → returns 8 inventory cards", async () => {
      const text = await drainStream(mockSearchAgentStream({ query: "8 inventory" }));
      const results = extractCompletePayload(text).payload.response.results;

      expect(results).toHaveLength(8);
      const firstResult = results[0];
      if (!firstResult) {
        throw new Error("Expected at least one result");
      }

      expect(firstResult.pricing).toBeDefined();
      expect(firstResult.pricing?.listPrice).toBeDefined();
    });
  });

  // ─── VDP FAQ SSE exact-match streams ─────────────────────────────────────────

  describe("VDP FAQ pill responses", () => {
    it("'how comfortable is the 3rd row seating?' → text-only with actions", async () => {
      const text = await drainStream(
        mockSearchAgentStream({ query: "how comfortable is the 3rd row seating?" })
      );
      const { payload } = extractCompletePayload(text);
      expect(payload.response.responseMode).toBe("OptionCards");
      expect(payload.response.summary).toContain("3rd row");
      expect(payload.response.results).toHaveLength(0);
      expect(payload.response).toHaveProperty("actions");
    });

    it("'what is the towing capacity?' → text-only, no actions", async () => {
      const text = await drainStream(
        mockSearchAgentStream({ query: "what is the towing capacity?" })
      );
      const { payload } = extractCompletePayload(text);
      expect(payload.response.responseMode).toBe("OptionCards");
      expect(payload.response.summary).toContain("3,500 lbs");
      expect(payload.response.results).toHaveLength(0);
    });

    it("'how does limited compare to xle?' → 3 trim option cards with actions", async () => {
      const text = await drainStream(
        mockSearchAgentStream({ query: "how does limited compare to xle?" })
      );
      const { payload } = extractCompletePayload(text);
      expect(payload.response.responseMode).toBe("OptionCards");
      expect(payload.response.totalCount).toBe(3);
      expect(payload.response.optionLevel).toBe("Trim");
      expect(payload.response.results).toHaveLength(3);
      expect(payload.response).toHaveProperty("actions");
    });

    it("'what makes this one better than the others i'm seeing?' → text-only", async () => {
      const text = await drainStream(
        mockSearchAgentStream({
          query: "what makes this one better than the others i'm seeing?",
        })
      );
      const { payload } = extractCompletePayload(text);
      expect(payload.response.responseMode).toBe("OptionCards");
      expect(payload.response.summary).toContain("lower mileage");
      expect(payload.response.results).toHaveLength(0);
    });
  });
});
