// @vitest-environment node
import { sha256Hex } from "@shared/lib/http/hash";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const { mockCookies, mockGet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mockGet.mockReset();
  // Default: no identity cookies set yet (cold visit).
  mockGet.mockReturnValue(undefined);
  mockCookies.mockResolvedValue({ get: mockGet });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function upstreamResponse() {
  return new Response(
    JSON.stringify({
      data: {
        visitorId: "visitor-upstream",
        sessionId: "session-upstream",
        deviceId: "device-upstream",
        isNew: false,
        metadata: { updatedAt: "2026-07-10T20:10:31.144Z" },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("getProfileResolve", () => {
  it("calls the visitors BED service when domain + API key are configured", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.sandbox.arrow.toyotafinancial.com");
    vi.stubEnv("VISITORS_API_KEY", "test-visitors-key");
    vi.stubEnv("BED_TENANT_ID", "toyota-us");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            visitorId: "visitor-upstream",
            sessionId: "session-upstream",
            deviceId: "device-upstream",
            isNew: false,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getProfileResolve } = await import("./get-profile-resolve");
    const result = await getProfileResolve("fp-upstream");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visitorId).toBe("visitor-upstream");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/visitors/v1/resolve");
    expect(init.method).toBe("POST");

    const headers = new Headers(init.headers);
    expect(headers.get("X-API-Key")).toBe("test-visitors-key");
    expect(headers.get("X-Tenant-Id")).toBe("toyota-us");
    expect(headers.get("X-Trace-Id")).toMatch(UUID_REGEX);

    const body = JSON.parse(init.body as string);
    expect(body.deviceFingerprintHash).toBe(await sha256Hex("fp-upstream"));
    expect(body.deviceFingerprintHash).not.toBe("fp-upstream");
  });

  it("forwards the stored visitor identity as X-Visitor-Id / X-Session-Id", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("VISITORS_API_KEY", "test-visitors-key");

    // Warm visit — identity cookies already persisted by a prior resolve.
    mockGet.mockImplementation((name: string) => {
      if (name === TRACKING_COOKIE.VISITOR_ID) {
        return { value: "visitor-abc" };
      }
      if (name === TRACKING_COOKIE.SESSION_ID) {
        return { value: "session-xyz" };
      }
      return;
    });

    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { getProfileResolve } = await import("./get-profile-resolve");
    await getProfileResolve("fp-warm");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("X-Visitor-Id")).toBe("visitor-abc");
    expect(headers.get("X-Session-Id")).toBe("session-xyz");
  });

  it("omits identity headers on a cold visit (no identity cookies yet)", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("VISITORS_API_KEY", "test-visitors-key");

    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { getProfileResolve } = await import("./get-profile-resolve");
    await getProfileResolve("fp-cold");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.has("X-Visitor-Id")).toBe(false);
    expect(headers.has("X-Session-Id")).toBe(false);
  });

  it("honours a versioned path override without code changes", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.sandbox.arrow.toyotafinancial.com");
    vi.stubEnv("VISITORS_API_KEY", "test-visitors-key");
    vi.stubEnv("VISITORS_API_VERSION", "v2");

    const fetchMock = vi.fn().mockResolvedValue(upstreamResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { getProfileResolve } = await import("./get-profile-resolve");
    await getProfileResolve("fp-upstream");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.sandbox.arrow.toyotafinancial.com/visitors/v2/resolve");
  });

  it("falls back to the mock when the visitors service is not configured", async () => {
    vi.stubEnv("USE_PROFILE_MOCKS", "true");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getProfileResolve } = await import("./get-profile-resolve");
    const result = await getProfileResolve("fp-mock");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visitorId).toBe("visitor-123");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when neither the visitors service nor mocks are configured", async () => {
    const { getProfileResolve } = await import("./get-profile-resolve");
    const result = await getProfileResolve("fp-none");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    }
  });
});
