// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../services/agent-mock", () => ({
  mockSearchAgentStream: vi.fn(),
}));
vi.mock("../../services/agent-upstream", () => ({
  fetchAgentStream: vi.fn(),
}));

// Mutable cookie store backing the mocked next/headers cookies().
const cookieState = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) =>
      cookieState.value === undefined ? undefined : { name, value: cookieState.value },
  })),
}));

import { mockSearchAgentStream } from "../../services/agent-mock";
import { fetchAgentStream } from "../../services/agent-upstream";

const mockMock = vi.mocked(mockSearchAgentStream);
const mockFetch = vi.mocked(fetchAgentStream);

function makeStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(c) {
      c.enqueue(encoder.encode(text));
      c.close();
    },
  });
}

async function readStream(stream: ReadableStream<Uint8Array> | null): Promise<string> {
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

describe("getSearchAgentStream", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    cookieState.value = undefined;
  });

  const request = { query: "sedan" };

  it("SEARCH_AGENT_BACKEND=v1 → transport routes to fetchAgentStream", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "v1");
    mockFetch.mockResolvedValue(new Response(makeStream("v1-data")));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream({ ...request, agentVersion: "v1" });
    const text = await readStream(response.body);

    expect(mockFetch).toHaveBeenCalledWith({ ...request, agentVersion: "v1" }, undefined);
    expect(mockMock).not.toHaveBeenCalled();
    expect(text).toBe("v1-data");
  });

  it("SEARCH_AGENT_BACKEND=static_mock → transport routes to mockSearchAgentStream", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "static_mock");
    mockMock.mockReturnValue(makeStream("mock-data"));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream(request);
    const text = await readStream(response.body);

    expect(mockMock).toHaveBeenCalledWith(request, undefined);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(text).toBe("mock-data");
  });

  it("SEARCH_AGENT_BACKEND=v2 → transport routes to fetchAgentStream", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "v2");
    mockFetch.mockResolvedValue(new Response(makeStream("v2-data")));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream({ ...request, agentVersion: "v2" });
    const text = await readStream(response.body);

    expect(mockFetch).toHaveBeenCalledWith({ ...request, agentVersion: "v2" }, undefined);
    expect(text).toBe("v2-data");
  });

  it("SEARCH_AGENT_BACKEND not set → defaults to fetchAgentStream transport", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "");
    mockFetch.mockResolvedValue(new Response(makeStream("v2-default")));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream(request);
    const text = await readStream(response.body);

    expect(mockFetch).toHaveBeenCalledWith({ ...request, agentVersion: "v2" }, undefined);
    expect(text).toBe("v2-default");
  });

  it("demo-agent-backend cookie overrides env → cookie value wins (still fetchAgentStream)", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "v2");
    cookieState.value = "v1";
    mockFetch.mockResolvedValue(new Response(makeStream("v1-cookie")));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream({ ...request, agentVersion: "v1" });
    const text = await readStream(response.body);

    expect(mockFetch).toHaveBeenCalledWith({ ...request, agentVersion: "v1" }, undefined);
    expect(mockMock).not.toHaveBeenCalled();
    expect(text).toBe("v1-cookie");
  });

  it("cookie=static_mock overrides env=v2 → mock transport", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "v2");
    cookieState.value = "static_mock";
    mockMock.mockReturnValue(makeStream("mock-cookie"));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream(request);
    const text = await readStream(response.body);

    expect(mockMock).toHaveBeenCalledWith(request, undefined);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(text).toBe("mock-cookie");
  });

  it("invalid cookie value → falls back to env backend (fetchAgentStream)", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "v2");
    cookieState.value = "bogus";
    mockFetch.mockResolvedValue(new Response(makeStream("v2-env")));

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream(request);
    const text = await readStream(response.body);

    expect(mockFetch).toHaveBeenCalledWith({ ...request, agentVersion: "v2" }, undefined);
    expect(text).toBe("v2-env");
  });

  it("SEARCH_AGENT_BACKEND=unknown → stream contains ServiceUnavailable Error frame", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "nope");

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream(request);
    const text = await readStream(response.body);

    expect(text).toContain("event: Error");
    expect(text).toContain("ServiceUnavailable");
  });

  it("mock expired searchId → returns 404 for deterministic testing", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "static_mock");

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream({
      query: "sedan",
      searchId: "expired-search-id",
    });

    expect(response.status).toBe(404);
    expect(mockMock).not.toHaveBeenCalled();
  });

  it("mock invalid searchId → returns 404 for deterministic testing", async () => {
    vi.stubEnv("SEARCH_AGENT_BACKEND", "static_mock");

    const { getSearchAgentStream } = await import("../get-search-agent-stream");
    const response = await getSearchAgentStream({
      query: "sedan",
      searchId: "invalid-search-id",
    });

    expect(response.status).toBe(404);
    expect(mockMock).not.toHaveBeenCalled();
  });
});
