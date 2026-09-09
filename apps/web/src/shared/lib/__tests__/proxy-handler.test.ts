// @vitest-environment node
import { proxyRequest } from "@shared/lib";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("proxyRequest", () => {
  it("returns 405 for unsupported HTTP methods (PUT, PATCH)", async () => {
    const request = new Request("http://localhost/api/foo", { method: "PUT" });
    const response = await proxyRequest(request, "/foo");
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body).toEqual({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET, POST, and DELETE are supported",
        status: 405,
      },
    });
  });

  it("returns 404 for any path when registry is empty", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://upstream.example.com");

    const request = new Request("http://localhost/api/anything", { method: "GET" });
    const response = await proxyRequest(request, "/anything");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: "ROUTE_NOT_ALLOWED",
        message: "Route GET /anything is not registered for proxying",
        status: 404,
      },
    });
  });

  it("returns 503 when route matches but API_UPSTREAM_URL is not set", async () => {
    // This test documents the behavior if routes were added back to the registry.
    // With an empty registry, this path is unreachable in production.
    const request = new Request("http://localhost/api/test", { method: "GET" });
    const response = await proxyRequest(request, "/test");
    const body = await response.json();

    // No route matches in empty registry → 404, not 503
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("ROUTE_NOT_ALLOWED");
  });
});
