// @vitest-environment node
import {
  AGENT_COMPARISON_STREAM_FIXTURE,
  AGENT_ERROR_STREAM_FIXTURE,
} from "@features/search/bff/__fixtures__/agent.fixture";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// Mock the use-case module so tests don't wait for artificial delays.
vi.mock("@features/search/bff/use-cases/get-search-agent-stream", () => ({
  getSearchAgentStream: vi.fn(),
}));

import { getSearchAgentStream } from "@features/search/bff/use-cases/get-search-agent-stream";

const mockGetSearchAgentStream = vi.mocked(getSearchAgentStream);

/** Build an SSE ReadableStream from a fixture array (no delays). */
function fixtureStream(events: Array<{ type: string }>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
}

function fixtureResponse(events: Array<{ type: string }>, status = 200): Response {
  return new Response(fixtureStream(events), {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/** Read all text from a ReadableStream of bytes (the shape of Response.body). */
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

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest("http://127.0.0.1:3000/api/v1/search/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/search/agent", () => {
  it("valid request → 200, content-type text/event-stream, body contains Complete frame", async () => {
    mockGetSearchAgentStream.mockResolvedValue(fixtureResponse(AGENT_COMPARISON_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createPostRequest({ query: "fuel-efficient SUV" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const text = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(text).toContain("event: Complete");
  });

  it("query containing 'fail' → HTTP 200, stream terminates with Error frame (not Complete)", async () => {
    mockGetSearchAgentStream.mockResolvedValue(fixtureResponse(AGENT_ERROR_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createPostRequest({ query: "fail this query" }));

    expect(response.status).toBe(200);

    const text = await readStream(response.body as ReadableStream<Uint8Array>);
    expect(text).toContain("event: Error");
    expect(text.includes("event: Complete")).toBe(false);
  });

  it("invalid field type (query as number) → 400 JSON with AGENT_VALIDATION_FAILED", async () => {
    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createPostRequest({ query: 123 }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("AGENT_VALIDATION_FAILED");
  });

  it("malformed JSON → 200 (route catches parse error, treats as empty body)", async () => {
    mockGetSearchAgentStream.mockResolvedValue(fixtureResponse(AGENT_COMPARISON_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const request = new NextRequest("http://127.0.0.1:3000/api/v1/search/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json",
    });
    const response = await POST(request);

    // Route catches JSON.parse failure → falls back to {} → valid (all optional)
    expect(response.status).toBe(200);
  });

  it("use-case throws synchronously → 500 JSON with AGENT_INTERNAL_ERROR", async () => {
    mockGetSearchAgentStream.mockImplementation(() => {
      throw new Error("Unexpected upstream failure");
    });

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createPostRequest({ query: "any query" }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("AGENT_INTERNAL_ERROR");
  });

  it("stream contains Status frames before Complete frame", async () => {
    mockGetSearchAgentStream.mockResolvedValue(fixtureResponse(AGENT_COMPARISON_STREAM_FIXTURE));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(createPostRequest({ query: "sedan under 25k" }));

    const text = await readStream(response.body as ReadableStream<Uint8Array>);
    const statusCount = (text.match(/event: Status/g) ?? []).length;
    expect(statusCount).toBeGreaterThanOrEqual(2);
    expect(text).toContain("event: Complete");
  });

  it("use-case 404 response → route returns 404 unchanged", async () => {
    mockGetSearchAgentStream.mockResolvedValue(new Response(null, { status: 404 }));

    const { POST } = await import("~/app/api/v1/search/agent/route");
    const response = await POST(
      createPostRequest({
        query: "expired search",
        searchId: "expired-search-id",
      })
    );

    expect(response.status).toBe(404);
    expect(mockGetSearchAgentStream).toHaveBeenCalledWith(
      expect.objectContaining({ searchId: "expired-search-id" }),
      expect.any(AbortSignal),
      expect.anything()
    );
  });
});
