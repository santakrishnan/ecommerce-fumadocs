// @vitest-environment node
import { SEARCH_SUGGESTIONS_ENTRY_FIXTURE } from "@features/search/bff";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new Request("http://127.0.0.1/api/v1/search/suggestions", { headers }) as NextRequest;
}

beforeEach(() => {
  vi.stubEnv("USE_SEARCH_MOCKS", "true");
  vi.stubEnv("API_UPSTREAM_URL", "");
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/v1/search/suggestions", () => {
  it("returns 200 with entry-state suggestions", async () => {
    const { GET } = await import("../route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(SEARCH_SUGGESTIONS_ENTRY_FIXTURE);
  });

  it("forwards X-Session-Id, X-Tenant-Id, and X-Visitor-Id to the use case", async () => {
    const getSearchSuggestionsSpy = vi.fn().mockResolvedValue({
      success: true,
      data: SEARCH_SUGGESTIONS_ENTRY_FIXTURE,
    });
    vi.doMock("@features/search/bff", async (importOriginal) => {
      const original = await importOriginal<typeof import("@features/search/bff")>();
      return { ...original, getSearchSuggestions: getSearchSuggestionsSpy };
    });

    const { GET } = await import("../route");
    await GET(
      makeRequest({
        "X-Session-Id": "session-123",
        "X-Tenant-Id": "tenant-abc",
        "X-Visitor-Id": "visitor-xyz",
      })
    );

    expect(getSearchSuggestionsSpy).toHaveBeenCalledWith({
      sessionId: "session-123",
      tenantId: "tenant-abc",
      visitorId: "visitor-xyz",
    });
  });

  it("returns 503 when use-case returns a failure", async () => {
    vi.doMock("@features/search/bff", async (importOriginal) => {
      const original = await importOriginal<typeof import("@features/search/bff")>();
      return {
        ...original,
        getSearchSuggestions: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "SEARCH_SUGGESTIONS_UPSTREAM_UNAVAILABLE",
            message: "Service unavailable",
            status: 503,
          },
        }),
      };
    });

    const { GET } = await import("../route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("SEARCH_SUGGESTIONS_UPSTREAM_UNAVAILABLE");
  });
});
