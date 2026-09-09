// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Verifies all v1 route handlers return 501 stub responses.
 * These stubs will be replaced with mock services or upstream calls
 * as each route is implemented.
 */

describe("v1 stub route handlers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("POST /api/v1/search/agent", async () => {
    // The agent route is now implemented — it returns a streaming SSE response,
    // not a 501 stub. Verify it accepts a valid request and responds with 200.
    const { POST } = await import("~/app/api/v1/search/agent/route");
    const request = new Request("http://127.0.0.1/api/v1/search/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "family" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("GET /api/v1/search/suggestions", async () => {
    vi.stubEnv("USE_SEARCH_MOCKS", "true");
    const { GET } = await import("~/app/api/v1/search/suggestions/route");
    const response = await GET(new Request("http://127.0.0.1/api/v1/search/suggestions") as never);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload.suggestions)).toBe(true);
  });

  it("GET /api/v1/profile/resolve", async () => {
    vi.stubEnv("USE_PROFILE_MOCKS", "true");
    const { GET } = await import("~/app/api/v1/profile/resolve/route");
    const request = new NextRequest("http://127.0.0.1/api/v1/profile/resolve?fpHash=test-fp");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.visitorId).toBeDefined();
  });
});
