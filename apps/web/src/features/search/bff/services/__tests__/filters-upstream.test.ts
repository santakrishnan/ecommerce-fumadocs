// @vitest-environment node
import type { ResolvedBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { ServerClient } from "@shared/lib/http/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FILTERS_SUCCESS_FIXTURE,
  FILTERS_UPSTREAM_FIXTURE,
} from "../../__fixtures__/filters.fixture";
import type { FiltersRequest } from "../../contracts/filters-request.schema";
import { fetchFiltersUpstream } from "../filters-upstream";

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

const IDENTITY: BedVisitorIdentity = {
  visitorId: "test-visitor-id",
  sessionId: "test-session-id",
};
const ANONYMOUS_IDENTITY: BedVisitorIdentity = {};

const TRACE_ID = "test-trace-id";

const VALID_REQUEST: FiltersRequest = {
  location: { zipCode: "94105", latitude: 37.7749, longitude: -122.4194 },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchFiltersUpstream", () => {
  it("returns success with mapped data on valid response", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(FILTERS_SUCCESS_FIXTURE);
    }
  });

  it("creates BED client with service and identity", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, IDENTITY);
  });

  it("calls POST /filters endpoint with request data", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/filters",
      {
        location: { zipCode: "94105", latitude: 37.7749, longitude: -122.4194 },
      },
      { headers: { "X-Trace-Id": TRACE_ID } }
    );
  });

  it("forwards visitor identity headers via createBedClient for resolved identity", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    // createBedClient is responsible for adding X-Visitor-Id and X-Session-Id headers
    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, IDENTITY);
  });

  it("omits visitor identity headers via createBedClient for anonymous visitors", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, ANONYMOUS_IDENTITY);

    // createBedClient is responsible for omitting headers when identity is empty
    expect(mockCreateBedClient).toHaveBeenCalledWith(MOCK_SERVICE, ANONYMOUS_IDENTITY);
  });

  it("returns InternalError with 502 when upstream returns unexpected shape", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue({ unexpected: "data" }),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("InternalError");
      expect(result.error.status).toBe(502);
    }
  });

  it("returns FILTERS_INTERNAL_ERROR when the network request fails with a TypeError", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValue(new TypeError("Network error")),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const result = await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("FILTERS_INTERNAL_ERROR");
    }
  });

  it("includes searchId in request body when provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    const requestWithSearchId: FiltersRequest = {
      ...VALID_REQUEST,
      searchId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await fetchFiltersUpstream(MOCK_SERVICE, requestWithSearchId, TRACE_ID, IDENTITY);

    expect(mockClient.post).toHaveBeenCalledWith(
      "/filters",
      {
        location: { zipCode: "94105", latitude: 37.7749, longitude: -122.4194 },
        searchId: "550e8400-e29b-41d4-a716-446655440000",
      },
      { headers: { "X-Trace-Id": TRACE_ID } }
    );
  });

  it("omits searchId from request body when not provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(FILTERS_UPSTREAM_FIXTURE),
    };
    mockCreateBedClient.mockReturnValue(mockClient as unknown as ServerClient);

    await fetchFiltersUpstream(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);

    const requestBody = mockClient.post.mock.calls[0]?.[1];
    expect(requestBody).not.toHaveProperty("searchId");
  });
});
