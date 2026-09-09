// @vitest-environment node
import {
  FILTERS_EMPTY_FIXTURE,
  FILTERS_SUCCESS_FIXTURE,
} from "@features/search/bff/__fixtures__/filters.fixture";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock readVisitorIdentity to return a consistent identity for tests
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: vi.fn().mockResolvedValue({
    visitorId: "test-visitor-id",
    sessionId: "test-session-id",
  }),
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function buildRequest(body?: unknown): NextRequest {
  const url = new URL("http://localhost:3000/api/v1/filters");
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const validBody = {
  location: {
    zipCode: "94105",
    latitude: 37.7749,
    longitude: -122.4194,
  },
};

describe("POST /api/v1/filters", () => {
  it("1. valid body → 200 with FILTERS_SUCCESS_FIXTURE", async () => {
    vi.doMock("@features/search/bff", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@features/search/bff")>();
      return {
        ...actual,
        getFilters: vi.fn().mockResolvedValue({ success: true, data: FILTERS_SUCCESS_FIXTURE }),
      };
    });

    const { POST } = await import("../route");
    const response = await POST(buildRequest(validBody));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(FILTERS_SUCCESS_FIXTURE);
  });

  it("2. missing required field → 400, code FILTERS_VALIDATION_FAILED", async () => {
    const { POST } = await import("../route");
    // location is required, omitting it
    const response = await POST(buildRequest({ searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("FILTERS_VALIDATION_FAILED");
  });

  it("3. malformed JSON / empty body → 400, FILTERS_VALIDATION_FAILED", async () => {
    const { POST } = await import("../route");
    const url = new URL("http://localhost:3000/api/v1/filters");
    // Simulate a request whose .json() throws (non-JSON content-type body)
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "not json {{",
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("FILTERS_VALIDATION_FAILED");
  });

  it("4. use-case returns empty filters → 200 with empty filters array", async () => {
    vi.doMock("@features/search/bff", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@features/search/bff")>();
      return {
        ...actual,
        getFilters: vi.fn().mockResolvedValue({ success: true, data: FILTERS_EMPTY_FIXTURE }),
      };
    });

    const { POST } = await import("../route");
    const response = await POST(buildRequest(validBody));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.filters).toEqual([]);
  });

  it("5. use-case returns failure → propagated status and error code", async () => {
    vi.doMock("@features/search/bff", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@features/search/bff")>();
      return {
        ...actual,
        getFilters: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "FILTERS_UPSTREAM_UNAVAILABLE",
            message: "Filters service is currently unavailable",
            status: 503,
          },
        }),
      };
    });

    const { POST } = await import("../route");
    const response = await POST(buildRequest(validBody));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("FILTERS_UPSTREAM_UNAVAILABLE");
  });

  it("6. request.json() throws → 400, FILTERS_VALIDATION_FAILED", async () => {
    const { POST } = await import("../route");
    const url = new URL("http://localhost:3000/api/v1/filters");
    const req = new NextRequest(url, { method: "POST" });
    // Override .json() to throw
    vi.spyOn(req, "json").mockRejectedValue(new SyntaxError("Unexpected end of JSON input"));

    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("FILTERS_VALIDATION_FAILED");
  });
});
