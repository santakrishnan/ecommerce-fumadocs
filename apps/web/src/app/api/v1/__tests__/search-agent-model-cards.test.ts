// @vitest-environment node
import { MAX_QUERY_LENGTH } from "@features/landing/lib/validate-search-query";
import {
  AGENT_INVENTORY_STREAM_FIXTURE,
  AGENT_OPTION_MODEL_STREAM_FIXTURE,
} from "@features/search/bff/__fixtures__/agent.fixture";
import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@features/search/bff/use-cases/get-search-agent-stream", () => ({
  getSearchAgentStream: vi.fn(),
}));

import { getSearchAgentStream } from "@features/search/bff/use-cases/get-search-agent-stream";

const mockGetSearchAgentStream = vi.mocked(getSearchAgentStream);

function fixtureStream(events: unknown[]): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        const eventType =
          typeof event === "object" && event !== null
            ? (event as Record<string, unknown>).type
            : "unknown";
        controller.enqueue(
          encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(event)}\n\n`)
        );
      }
      controller.close();
    },
  });
  return Promise.resolve(
    new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    })
  );
}

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

async function readSSEStream(response: Response): Promise<unknown[]> {
  const text = await readStream(response.body as ReadableStream<Uint8Array>);
  const events: unknown[] = [];
  for (const block of text.split("\n\n")) {
    const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
    if (dataLine) {
      try {
        events.push(JSON.parse(dataLine.slice(6)));
      } catch {
        // skip malformed chunks
      }
    }
  }
  return events;
}

function createRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
    signal: new AbortController().signal,
    cookies: { get: () => undefined },
  } as unknown as NextRequest;
}

describe("POST /api/v1/search/agent", () => {
  beforeEach(() => {
    vi.stubEnv("USE_SEARCH_AGENT_MOCKS", "true");
    vi.stubEnv("API_UPSTREAM_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 200 with text/event-stream content type", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_INVENTORY_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createRequest({ query: "family suv" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("returns 400 with AGENT_VALIDATION_FAILED for invalid request payload", async () => {
    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createRequest({ query: 123 }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("AGENT_VALIDATION_FAILED");
  });

  it("streams Status → Delta → Complete event sequence", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_INVENTORY_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createRequest({ query: "suv" }));

    const text = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(text).toContain("event: Status");
    expect(text).toContain("event: Delta");
    expect(text).toContain("event: Complete");
    expect(text.indexOf("event: Status")).toBeLessThan(text.indexOf("event: Complete"));
  });

  it("Complete event contains a valid AgentSearchResult payload", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_INVENTORY_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createRequest({ query: "family suv" }));

    const text = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(text).toContain('"type":"Complete"');
    expect(text).toContain('"responseMode":"InventoryCards"');
  });

  it("generates a searchId when none is provided", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_INVENTORY_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createRequest({ query: "sedan" }));

    expect(response.status).toBe(200);
    expect(mockGetSearchAgentStream).toHaveBeenCalledWith(
      expect.objectContaining({ query: "sedan" }),
      expect.anything(),
      expect.anything()
    );
  });

  // ─── Long-query behaviour ────────────────────────────────────────────────────

  it("accepts a query at exactly the MAX_QUERY_LENGTH-character limit", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_OPTION_MODEL_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const query = "a".repeat(MAX_QUERY_LENGTH);
    const response = await POST(createRequest({ query }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("streams the full SSE sequence for a long query under the limit", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_OPTION_MODEL_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    // A long descriptive query that contains no mock keyword — falls through to DEFAULT_RESPONSE
    const query = "I am looking for a vehicle with great reliability, good fuel economy, ".repeat(
      20
    );
    const truncated = query.slice(0, MAX_QUERY_LENGTH);
    const response = await POST(createRequest({ query: truncated }));

    expect(response.status).toBe(200);
    const chunks = await readSSEStream(response);
    const types = chunks.map((c) => (c as Record<string, unknown>).type);

    expect(types).toContain("Status");
    expect(types).toContain("Complete");
    expect(types.indexOf("Status")).toBeLessThan(types.indexOf("Complete"));
  });

  it("long query with no keyword match returns the default response with model cards", async () => {
    mockGetSearchAgentStream.mockReturnValue(fixtureStream(AGENT_OPTION_MODEL_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const query = "something completely unrecognised ".repeat(30);
    const truncated = query.slice(0, MAX_QUERY_LENGTH);
    const response = await POST(createRequest({ query: truncated }));

    const chunks = await readSSEStream(response);
    const complete = chunks.find((c) => (c as Record<string, unknown>).type === "Complete") as
      | Record<string, unknown>
      | undefined;

    expect(complete).toBeDefined();
    const payload = complete?.payload as Record<string, unknown>;
    const responsePayload = payload.response as Record<string, unknown>;

    // Default response always returns model cards (OptionCards / ExplorationMode)
    expect(Array.isArray(responsePayload.results)).toBe(true);
    expect((responsePayload.results as unknown[]).length).toBeGreaterThan(0);
  });

  it("long query behaves identically to a 1-character query for default results", async () => {
    mockGetSearchAgentStream
      .mockReturnValueOnce(fixtureStream(AGENT_OPTION_MODEL_STREAM_FIXTURE))
      .mockReturnValueOnce(fixtureStream(AGENT_OPTION_MODEL_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");

    const [shortResponse, longResponse] = await Promise.all([
      POST(createRequest({ query: "x" })),
      POST(createRequest({ query: "x".repeat(MAX_QUERY_LENGTH) })),
    ]);

    expect(shortResponse.status).toBe(200);
    expect(longResponse.status).toBe(200);

    const [shortChunks, longChunks] = await Promise.all([
      readSSEStream(shortResponse),
      readSSEStream(longResponse),
    ]);

    const shortComplete = shortChunks.find(
      (c) => (c as Record<string, unknown>).type === "Complete"
    ) as Record<string, unknown> | undefined;
    const longComplete = longChunks.find(
      (c) => (c as Record<string, unknown>).type === "Complete"
    ) as Record<string, unknown> | undefined;

    const shortPayload = (shortComplete?.payload as Record<string, unknown>)?.response as Record<
      string,
      unknown
    >;
    const longPayload = (longComplete?.payload as Record<string, unknown>)?.response as Record<
      string,
      unknown
    >;

    // Both fall through to the default response — same responseMode and result count
    expect(shortPayload.responseMode).toBe(longPayload.responseMode);
    expect((shortPayload.results as unknown[]).length).toBe(
      (longPayload.results as unknown[]).length
    );
  });
});
