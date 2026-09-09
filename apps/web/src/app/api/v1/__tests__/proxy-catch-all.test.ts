// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the proxy catch-all route handler at api/v1/[...proxyPath]/route.ts.
 *
 * The catch-all exists as infrastructure for future passthrough routes.
 * Currently no routes are registered in the proxy registry, so all requests
 * receive a 404 from the proxy handler. These tests verify the path delegation
 * logic remains correct for when routes are added.
 */

vi.mock("@shared/lib", () => ({
  proxyRequest: vi.fn(() => new Response(JSON.stringify({ proxied: true }), { status: 200 })),
}));

import { proxyRequest } from "@shared/lib";
import { DELETE, GET, POST } from "~/app/api/v1/[...proxyPath]/route";

const mockedProxyRequest = vi.mocked(proxyRequest);

function createMockRequest(url: string, method: string) {
  return new Request(url, { method }) as unknown as import("next/server").NextRequest;
}

function createContext(segments: string[]) {
  return { params: Promise.resolve({ proxyPath: segments }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("proxy catch-all route", () => {
  it("joins single segment and delegates to proxyRequest", async () => {
    const request = createMockRequest("http://localhost:3000/api/v1/foo", "GET");
    await GET(request, createContext(["foo"]));

    expect(mockedProxyRequest).toHaveBeenCalledWith(request, "/foo");
  });

  it("joins multi-segment paths", async () => {
    const request = createMockRequest("http://localhost:3000/api/v1/a/b/c", "GET");
    await GET(request, createContext(["a", "b", "c"]));

    expect(mockedProxyRequest).toHaveBeenCalledWith(request, "/a/b/c");
  });

  it("produces root slash for empty proxyPath", async () => {
    const request = createMockRequest("http://localhost:3000/api/v1", "GET");
    await GET(request, createContext([]));

    expect(mockedProxyRequest).toHaveBeenCalledWith(request, "/");
  });

  it("delegates POST requests the same way", async () => {
    const request = createMockRequest("http://localhost:3000/api/v1/events", "POST");
    await POST(request, createContext(["events"]));

    expect(mockedProxyRequest).toHaveBeenCalledWith(request, "/events");
  });

  it("delegates DELETE requests the same way", async () => {
    const request = createMockRequest("http://localhost:3000/api/v1/watchlist/VIN123", "DELETE");
    await DELETE(request, createContext(["watchlist", "VIN123"]));

    expect(mockedProxyRequest).toHaveBeenCalledWith(request, "/watchlist/VIN123");
  });

  it("returns whatever proxyRequest returns", async () => {
    mockedProxyRequest.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const request = createMockRequest("http://localhost:3000/api/v1/test", "GET");
    const response = await GET(request, createContext(["test"]));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
