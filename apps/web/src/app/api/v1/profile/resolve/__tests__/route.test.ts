// @vitest-environment node
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(url = "http://127.0.0.1:3000/api/v1/profile/resolve"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function getSetCookieNames(response: Response): string[] {
  return response.headers.getSetCookie().map((cookie) => cookie.split("=")[0] ?? "");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/v1/profile/resolve", () => {
  it("returns the envelope and refreshes identity cookies when fpHash comes from cookie", async () => {
    vi.stubEnv("USE_PROFILE_MOCKS", "true");
    const { GET } = await import("../route");
    const request = makeRequest();
    request.cookies.set(TRACKING_COOKIE.FP_ID, "fp-cookie");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      visitorId: "visitor-123",
      sessionId: "session-456",
      deviceId: "device-789",
      isNew: false,
      customerId: "customer-321",
      firstSeenAt: "2026-06-01T12:00:00.000Z",
      lastSeenAt: "2026-07-06T09:30:00.000Z",
    });
    expect(typeof body.meta.traceId).toBe("string");
    expect(typeof body.meta.timestamp).toBe("string");

    const cookieNames = getSetCookieNames(response);
    expect(cookieNames).toContain(TRACKING_COOKIE.VISITOR_ID);
    expect(cookieNames).toContain(TRACKING_COOKIE.SESSION_ID);
    expect(cookieNames).toContain(TRACKING_COOKIE.PROFILE_ID);
    expect(cookieNames).toContain(TRACKING_COOKIE.LAST_VISIT_AT);
  });

  it("falls back to the fpHash query parameter when the cookie is absent", async () => {
    vi.stubEnv("USE_PROFILE_MOCKS", "true");
    const { GET } = await import("../route");

    const response = await GET(
      makeRequest("http://127.0.0.1:3000/api/v1/profile/resolve?fpHash=query-fp")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.visitorId).toBe("visitor-123");
  });

  it("returns a 204 no-op (not a 400) on cold start with no fingerprint cookie/query", async () => {
    vi.stubEnv("USE_PROFILE_MOCKS", "true");
    const { GET } = await import("../route");

    const response = await GET(makeRequest());

    expect(response.status).toBe(204);
    // No body and no error — a clean no-op the keep-alive can ignore.
    expect(await response.text()).toBe("");
  });

  it("returns 503 when neither upstream nor mocks are configured", async () => {
    const { GET } = await import("../route");
    const request = makeRequest();
    request.cookies.set(TRACKING_COOKIE.FP_ID, "fp-cookie");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
  });
});
