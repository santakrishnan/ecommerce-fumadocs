// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const uuidSchema = z.uuid();

vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: vi.fn().mockResolvedValue({
    visitorId: "test-visitor-id",
    sessionId: "test-session-id",
  }),
}));

const mockReadLocationFromCookies = vi.fn();
vi.mock("@features/location/server", () => ({
  readLocationFromCookies: () => mockReadLocationFromCookies(),
}));

const mockGetSearchResultsResponse = vi.fn();
vi.mock("@features/search/services/get-search-results-response", () => ({
  getSearchResultsResponse: (args: unknown) => mockGetSearchResultsResponse(args),
}));

import { MOCK_SEARCH_LOCATION } from "@features/search/__fixtures__/search-location.fixture";
import { POST } from "../route";

const SEARCH_ID = "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789";

const SUCCESS_RESULT = {
  success: true,
  data: {
    data: {
      results: [],
      searchId: SEARCH_ID,
      totalCount: 0,
      pagination: { limit: 20, offset: 0, hasMore: false },
      smartFilters: [],
    },
    meta: { traceId: "generated-trace", timestamp: "2025-01-01T00:00:00Z" },
  },
};

function buildRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/v1/search"), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function buildMalformedRequest(): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/v1/search"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not-valid-json{{{",
  });
}

/** Returns the `request` field the route forwarded to getSearchResultsResponse. */
function forwardedRequest(): { location?: unknown } {
  return mockGetSearchResultsResponse.mock.calls[0]?.[0]?.request ?? {};
}

beforeEach(() => {
  mockGetSearchResultsResponse.mockResolvedValue(SUCCESS_RESULT);
  mockReadLocationFromCookies.mockResolvedValue({});
});

afterEach(() => {
  mockGetSearchResultsResponse.mockReset();
  mockReadLocationFromCookies.mockReset();
});

describe("POST /api/v1/search — location injection", () => {
  it("injects the cookie-derived location when the body omits it (pagination path)", async () => {
    mockReadLocationFromCookies.mockResolvedValue(MOCK_SEARCH_LOCATION);

    const response = await POST(
      buildRequest({ searchId: SEARCH_ID, pagination: { limit: 20, offset: 0 } })
    );

    expect(response.status).toBe(200);
    expect(forwardedRequest().location).toEqual(MOCK_SEARCH_LOCATION);
  });

  it("prefers a location explicitly supplied in the body over the cookie", async () => {
    mockReadLocationFromCookies.mockResolvedValue(MOCK_SEARCH_LOCATION);
    const bodyLocation = { zipCode: "10001", latitude: 40.713, longitude: -74.006 };

    await POST(buildRequest({ searchId: SEARCH_ID, location: bodyLocation }));

    expect(forwardedRequest().location).toEqual(bodyLocation);
  });

  it("falls back to LOCATION_DEFAULTS when neither body nor cookies provide one", async () => {
    await POST(buildRequest({ searchId: SEARCH_ID }));

    expect(forwardedRequest().location).toEqual({
      zipCode: "90210",
      latitude: 34.074,
      longitude: -118.4,
    });
  });

  it("falls back to LOCATION_DEFAULTS when cookies have partial data (ZIP only, no lat/lng)", async () => {
    mockReadLocationFromCookies.mockResolvedValue({ zipCode: "10001" });

    await POST(buildRequest({ searchId: SEARCH_ID }));

    expect(forwardedRequest().location).toEqual({
      zipCode: "90210",
      latitude: 34.074,
      longitude: -118.4,
    });
  });
});

describe("POST /api/v1/search — trace ID propagation", () => {
  it("forwards X-Trace-Id header into the service call", async () => {
    await POST(buildRequest({}, { "X-Trace-Id": "my-upstream-trace" }));

    expect(mockGetSearchResultsResponse).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: "my-upstream-trace" })
    );
  });

  it("generates a UUID traceId when X-Trace-Id header is absent", async () => {
    await POST(buildRequest({}));

    const call = mockGetSearchResultsResponse.mock.calls[0]?.[0] as { traceId: string };
    expect(uuidSchema.safeParse(call.traceId).success).toBe(true);
  });
});

describe("POST /api/v1/search — validation errors (400)", () => {
  it("returns the error response when service reports validation failure", async () => {
    mockGetSearchResultsResponse.mockResolvedValue({
      success: false,
      error: {
        code: "SEARCH_VALIDATION_FAILED",
        message: "Invalid request body",
        status: 400,
      },
    });

    const response = await POST(buildRequest({ sort: "INVALID_SORT" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("SEARCH_VALIDATION_FAILED");
  });

  it("handles malformed JSON gracefully (falls back to empty body)", async () => {
    const response = await POST(buildMalformedRequest());

    // Malformed JSON is caught by .catch(() => ({})) — empty body is valid
    expect(response.status).toBe(200);
    expect(mockGetSearchResultsResponse).toHaveBeenCalled();
  });
});

describe("POST /api/v1/search — error handling (500)", () => {
  it("returns 500 SEARCH_INTERNAL_ERROR when an unexpected error is thrown", async () => {
    mockGetSearchResultsResponse.mockRejectedValue(new Error("Unexpected crash"));

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("SEARCH_INTERNAL_ERROR");
  });
});
