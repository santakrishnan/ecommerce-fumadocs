// @vitest-environment node
import {
  NEW_TODAY_EMPTY_RESPONSE,
  NEW_TODAY_SUCCESS_RESPONSE,
} from "@features/landing/__fixtures__/new-today.fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";

function createRequest(fixture?: string) {
  const params = new URLSearchParams();
  if (fixture) {
    params.set("fixture", fixture);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const url = new URL(`http://127.0.0.1:3000/api/v1/recommendations/today${suffix}`);

  return {
    nextUrl: url,
    cookies: {
      get: () => undefined,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("GET /api/v1/recommendations/today", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns New Today success fixture by default", async () => {
    const { GET } = await import("~/app/api/v1/recommendations/today/route");
    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(NEW_TODAY_SUCCESS_RESPONSE);
  });

  it("returns the empty fixture when fixture=empty", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const { GET } = await import("~/app/api/v1/recommendations/today/route");
    const response = await GET(createRequest("empty"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(NEW_TODAY_EMPTY_RESPONSE);
  });

  it("falls back to success fixture for unknown fixture values", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const { GET } = await import("~/app/api/v1/recommendations/today/route");
    const response = await GET(createRequest("unknown"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(NEW_TODAY_SUCCESS_RESPONSE);
  });

  it("ignores fixture query values in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { GET } = await import("~/app/api/v1/recommendations/today/route");
    const response = await GET(createRequest("empty"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(NEW_TODAY_SUCCESS_RESPONSE);
  });
});
