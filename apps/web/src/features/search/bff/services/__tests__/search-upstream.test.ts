// @vitest-environment node
import type { ResolvedBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { ServerClient } from "@shared/lib/http/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SEARCH_SUCCESS_FIXTURE } from "../../__fixtures__/search-results.fixture";
import { fetchSearchUpstream, type UpstreamSearchRequest } from "../search-upstream";

vi.mock("server-only", () => ({}));
vi.mock("@shared/lib/http/bed-client", () => ({
  createBedClient: vi.fn(),
}));

import { createBedClient } from "@shared/lib/http/bed-client";

const mockCreateBedClient = vi.mocked(createBedClient);

const MOCK_SERVICE: ResolvedBedService = {
  serviceName: "Search",
  baseUrl: "https://api.sandbox.arrow.toyotafinancial.com/search/v1",
  apiKey: "test-api-key",
  tenantId: "test-tenant",
};

const TRACE_ID = "test-trace-id";
const IDENTITY: BedVisitorIdentity = {
  visitorId: "test-visitor-id",
  sessionId: "test-session-id",
};
const ANONYMOUS_IDENTITY: BedVisitorIdentity = {};

const VALID_REQUEST: UpstreamSearchRequest = {
  filters: [
    {
      key: "make",
      label: "Make",
      type: "Enum",
      options: [{ value: "Toyota", count: 150 }],
    },
  ],
  location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
  sort: "Recommended",
  pagination: { limit: 20, offset: 0 },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchSearchUpstream", () => {
  it("returns success with upstream data on valid 200 response", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.searchId).toBe(SEARCH_SUCCESS_FIXTURE.data.searchId);
      expect(result.data.data.results).toHaveLength(20);
      expect(result.data.data.totalCount).toBe(150);
    }
  });

  it("creates BED client with service and identity", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, IDENTITY);
  });

  it("calls POST /search endpoint with search data and X-Trace-Id header", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      {
        filters: [{ key: "make", values: ["Toyota"] }],
        location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
        sort: "Recommended",
        pagination: { limit: 20, offset: 0 },
      },
      { headers: { "X-Trace-Id": TRACE_ID } }
    );
  });

  it("fills in default coordinates when the request location omits lat/lng (keeps the provided zip)", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    // A zip-only location — the shape produced by useSearchLocation when the
    // visitor's coordinates have not resolved (no GEO cookie).
    const zipOnlyRequest: UpstreamSearchRequest = {
      ...VALID_REQUEST,
      location: { zipCode: "10001" },
    };

    await fetchSearchUpstream(MOCK_SERVICE, zipOnlyRequest, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        location: { zipCode: "10001", latitude: 34.0966, longitude: -117.7198 },
      }),
      { headers: { "X-Trace-Id": TRACE_ID } }
    );
  });

  it("applies the full default location when the request carries no location", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const { location: _omitted, ...noLocationRequest } = VALID_REQUEST;

    await fetchSearchUpstream(MOCK_SERVICE, noLocationRequest, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
      }),
      { headers: { "X-Trace-Id": TRACE_ID } }
    );
  });

  it("forwards visitor identity headers via createBedClient for resolved identity", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    // createBedClient is responsible for adding X-Visitor-Id and X-Session-Id headers
    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, IDENTITY);
  });

  it("omits visitor identity headers via createBedClient for anonymous visitors", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, ANONYMOUS_IDENTITY);

    // createBedClient is responsible for omitting headers when identity is empty
    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, ANONYMOUS_IDENTITY);
  });

  it("returns SEARCH_UPSTREAM_ERROR with 502 when upstream returns unexpected shape", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue({ unexpected: "data" }),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("InternalError");
      expect(result.error.status).toBe(502);
    }
  });

  it("returns SEARCH_INTERNAL_ERROR when the network request fails with a TypeError", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValue(new TypeError("Network error")),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SEARCH_INTERNAL_ERROR");
    }
  });

  it("applies default location when request has no location", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const requestWithoutLocation: UpstreamSearchRequest = {
      sort: "Recommended",
    };

    await fetchSearchUpstream(MOCK_SERVICE, requestWithoutLocation, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        location: {
          zipCode: "91711",
          latitude: 34.0966,
          longitude: -117.7198,
        },
      }),
      expect.any(Object)
    );
  });

  it("maps SmartFilter Enum to flat Arrow filter shape", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchSearchUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        filters: [{ key: "make", values: ["Toyota"] }],
      }),
      expect.any(Object)
    );
  });

  it("maps SmartFilter Range to Arrow filter shape", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const requestWithRange: UpstreamSearchRequest = {
      filters: [{ key: "price", label: "Price", type: "Range", min: 20_000, max: 50_000 }],
      sort: "Recommended",
    };

    await fetchSearchUpstream(MOCK_SERVICE, requestWithRange, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        filters: [{ key: "price", min: 20_000, max: 50_000 }],
      }),
      expect.any(Object)
    );
  });

  it("omits searchId and query when not provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(SEARCH_SUCCESS_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const minimalRequest: UpstreamSearchRequest = { sort: "Recommended" };

    await fetchSearchUpstream(MOCK_SERVICE, minimalRequest, TRACE_ID, IDENTITY);

    const requestBody = mockClient.post.mock.calls[0]?.[1];
    expect(requestBody).not.toHaveProperty("searchId");
    expect(requestBody).not.toHaveProperty("query");
  });
});
