// @vitest-environment node
import { PROFILE_SUGGESTIONS_FIXTURE } from "@features/profile/bff/__fixtures__/profile-suggestions.fixture";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://127.0.0.1:3000/api/v1/profile/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({}),
  });
}

beforeEach(() => {
  vi.stubEnv("USE_PROFILE_SUGGESTIONS_MOCKS", "true");
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/v1/profile/suggestions", () => {
  it("returns 200 with the suggestions fixture when no X-Visitor-Id header is provided", async () => {
    const { POST } = await import("../route");
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(PROFILE_SUGGESTIONS_FIXTURE);
  });

  it("returns 200 with the suggestions fixture when X-Visitor-Id header is provided", async () => {
    const { POST } = await import("../route");
    const response = await POST(makeRequest({ "X-Visitor-Id": "visitor-abc" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(PROFILE_SUGGESTIONS_FIXTURE);
  });

  it("returns 503 when use-case returns a failure", async () => {
    vi.doMock("@features/profile/bff", async (importOriginal) => {
      const original = await importOriginal<typeof import("@features/profile/bff")>();
      return {
        ...original,
        getProfileSuggestions: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "PROFILE_UPSTREAM_UNAVAILABLE",
            message: "Service unavailable",
            status: 503,
          },
        }),
      };
    });

    const { POST } = await import("../route");
    const response = await POST(makeRequest({ "X-Visitor-Id": "visitor-abc" }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
  });

  it("returns 500 when request.json() throws", async () => {
    const { POST } = await import("../route");
    const badRequest = new NextRequest("http://127.0.0.1:3000/api/v1/profile/suggestions", {
      method: "POST",
      body: "not-json",
    });
    const response = await POST(badRequest);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("PROFILE_INTERNAL_ERROR");
  });
});
