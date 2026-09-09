// @vitest-environment node
import { firstOf } from "@ucmp/vitest-config/test-utils/pure";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockReadVisitorIdentity = vi.fn();
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: () => mockReadVisitorIdentity(),
}));

const mockTransformV1Events = vi.fn();
vi.mock("../agent-v1-transformer", () => ({
  transformV1Events: (...args: unknown[]) => mockTransformV1Events(...args),
}));

const mockTransformV2Events = vi.fn();
vi.mock("../agent-v2-transformer", () => ({
  transformV2Events: (...args: unknown[]) => mockTransformV2Events(...args),
}));

import { fetchAgentStream } from "../agent-upstream";

function sseStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(c) {
      c.enqueue(encoder.encode(text));
      c.close();
    },
  });
}

async function readBody(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) {
    return "";
  }
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

const BASE_REQUEST = {
  query: "trucks",
  location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
};

describe("fetchAgentStream", () => {
  beforeEach(() => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });
    mockTransformV1Events.mockImplementation(async function* mockGen() {
      // Default: empty stream — individual tests override with real frames.
    });
    mockTransformV2Events.mockImplementation(async function* mockGen() {
      // Default: empty stream — individual tests override with real frames.
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    mockReadVisitorIdentity.mockReset();
    mockTransformV1Events.mockReset();
    mockTransformV2Events.mockReset();
  });

  it("returns an error stream when the search service is not configured", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "");
    vi.stubEnv("SEARCH_API_KEY", "");

    const response = await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });
    const text = await readBody(response.body);

    expect(text).toContain("ServiceUnavailable");
    expect(text).toContain(
      "Search upstream service is not configured (API_UPSTREAM_URL + SEARCH_API_KEY)"
    );
  });

  it("propagates a 404 from the upstream unchanged", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));

    const response = await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });

    expect(response.status).toBe(404);
  });

  describe.each([
    { agentVersion: "v1" as const, mockTransform: () => mockTransformV1Events },
    { agentVersion: "v2" as const, mockTransform: () => mockTransformV2Events },
  ])("agentVersion=$agentVersion", ({ agentVersion, mockTransform }) => {
    it("posts to the same /search/agent URL with BED + SSE headers", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("SEARCH_API_KEY", "test-key");
      vi.stubEnv("BED_TENANT_ID", "toyota");

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response(sseStream("data: {}\n\n"), { status: 200 }));

      await fetchAgentStream({ ...BASE_REQUEST, agentVersion });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = firstOf(fetchSpy.mock.calls);
      expect(url).toBe("https://api.example.com/search/v1/search/agent");

      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers["X-API-Key"]).toBe("test-key");
      expect(headers["X-Tenant-Id"]).toBe("toyota");
      expect(headers.Accept).toBe("text/event-stream");
      expect(headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.agentVersion).toBe(agentVersion);
      expect(body.location.radiusMiles).toBe(100);
    });

    it("selects the matching transformer for this agentVersion", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("SEARCH_API_KEY", "test-key");

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(sseStream("data: {}\n\n"), { status: 200 })
      );

      await fetchAgentStream({ ...BASE_REQUEST, agentVersion });

      expect(mockTransform()).toHaveBeenCalledTimes(1);
      const otherTransform =
        mockTransform() === mockTransformV1Events ? mockTransformV2Events : mockTransformV1Events;
      expect(otherTransform).not.toHaveBeenCalled();
    });
  });

  it("defaults to the v2 transformer when agentVersion is absent from the request", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(sseStream("data: {}\n\n"), { status: 200 })
    );

    await fetchAgentStream(BASE_REQUEST);

    expect(mockTransformV2Events).toHaveBeenCalledTimes(1);
    expect(mockTransformV1Events).not.toHaveBeenCalled();
  });

  it("omits X-Visitor-Id and X-Session-Id headers when no identity is resolved", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");
    vi.stubEnv("BED_TENANT_ID", "toyota");
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(sseStream("data: {}\n\n"), { status: 200 }));

    await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });

    const [, init] = firstOf(fetchSpy.mock.calls);
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers).not.toHaveProperty("X-Visitor-Id");
    expect(headers).not.toHaveProperty("X-Session-Id");
  });

  it("includes X-Visitor-Id and X-Session-Id headers when identity is resolved", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");
    vi.stubEnv("BED_TENANT_ID", "toyota");
    mockReadVisitorIdentity.mockResolvedValue({
      visitorId: "resolved-visitor-id",
      sessionId: "resolved-session-id",
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(sseStream("data: {}\n\n"), { status: 200 }));

    await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });

    const [, init] = firstOf(fetchSpy.mock.calls);
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["X-Visitor-Id"]).toBe("resolved-visitor-id");
    expect(headers["X-Session-Id"]).toBe("resolved-session-id");
  });

  it("emits an InternalError frame on a non-OK response", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));

    const response = await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });
    const text = await readBody(response.body);

    expect(text).toContain("InternalError");
    expect(text).toContain("500");
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("emits an AGENT_INCOMPLETE_STREAM Error frame when the stream ends with no Complete", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-key");
    mockTransformV2Events.mockImplementation(async function* mockGen() {
      yield { type: "ToolCall", toolName: "execute_search_plan", toolCallId: "abc" };
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(sseStream("data: {}\n\n"), { status: 200 })
    );

    const response = await fetchAgentStream({ ...BASE_REQUEST, agentVersion: "v2" });
    const text = await readBody(response.body);

    expect(text).toContain("AGENT_INCOMPLETE_STREAM");
    expect(text).toContain('"type":"Error"');
  });
});
