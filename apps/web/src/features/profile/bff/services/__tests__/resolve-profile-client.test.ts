import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProfile } from "../resolve-profile-client";

describe("resolveProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps the response envelope and returns data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            visitorId: "visitor-123",
            sessionId: "session-456",
            deviceId: "device-789",
            isNew: false,
            customerId: "customer-321",
            firstSeenAt: "2026-06-01T12:00:00.000Z",
            lastSeenAt: "2026-07-06T09:30:00.000Z",
          },
          meta: {
            traceId: "trace-123",
            timestamp: "2026-07-06T12:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveProfile({ fpHash: "fp-cookie" });

    expect(result).toEqual({
      visitorId: "visitor-123",
      sessionId: "session-456",
      deviceId: "device-789",
      isNew: false,
      customerId: "customer-321",
      firstSeenAt: "2026-06-01T12:00:00.000Z",
      lastSeenAt: "2026-07-06T09:30:00.000Z",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain("/api/v1/profile/resolve?fpHash=fp-cookie");
    expect(requestInit).toMatchObject({ method: "GET", credentials: "include" });
  });

  it("throws when the response envelope shape is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            sessionId: "session-456",
            deviceId: "device-789",
            isNew: false,
          },
          meta: {
            traceId: "trace-123",
            timestamp: "2026-07-06T12:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveProfile()).rejects.toThrow(
      "Profile resolve returned an invalid response shape"
    );
  });
});
