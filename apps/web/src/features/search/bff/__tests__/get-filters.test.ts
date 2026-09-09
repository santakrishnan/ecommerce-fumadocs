// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));
vi.mock("../services/filters-mock", () => ({
  mockGetFilters: vi.fn(),
}));
vi.mock("../services/filters-upstream", () => ({
  fetchFiltersUpstream: vi.fn(),
}));

import type { ResolvedBedService } from "@config/bed-services";
import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { FILTERS_SUCCESS_FIXTURE } from "../__fixtures__/filters.fixture";
import type { FiltersRequest } from "../contracts/filters-request.schema";
import { mockGetFilters } from "../services/filters-mock";
import { fetchFiltersUpstream } from "../services/filters-upstream";

const mockResolveBedService = vi.mocked(resolveBedService);
const mockFetchUpstream = vi.mocked(fetchFiltersUpstream);
const mockMockService = vi.mocked(mockGetFilters);

const VALID_REQUEST: FiltersRequest = {
  location: { zipCode: "94105", latitude: 37.7749, longitude: -122.4194 },
};

const IDENTITY: BedVisitorIdentity = {
  visitorId: "test-visitor-id",
  sessionId: "test-session-id",
};

const TRACE_ID = "test-trace-id";

const MOCK_SERVICE: ResolvedBedService = {
  serviceName: "Search",
  baseUrl: "https://api.sandbox.arrow.toyotafinancial.com/search/v1",
  apiKey: "test-api-key",
  tenantId: "test-tenant",
};

describe("getFilters", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls upstream when search service is resolved via resolveBedService", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockFetchUpstream.mockResolvedValue({ success: true, data: FILTERS_SUCCESS_FIXTURE });

    const { getFilters } = await import("../use-cases/get-filters");
    const result = await getFilters(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(FILTERS_SUCCESS_FIXTURE);
    }
    expect(mockResolveBedService).toHaveBeenCalledWith("search");
    expect(mockFetchUpstream).toHaveBeenCalledWith(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);
    expect(mockMockService).not.toHaveBeenCalled();
  });

  it("returns mock data when USE_FILTERS_MOCKS is true (always wins)", async () => {
    vi.stubEnv("USE_FILTERS_MOCKS", "true");
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockMockService.mockResolvedValue(FILTERS_SUCCESS_FIXTURE);

    const { getFilters } = await import("../use-cases/get-filters");
    const result = await getFilters(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(FILTERS_SUCCESS_FIXTURE);
    }
    expect(mockMockService).toHaveBeenCalledWith(VALID_REQUEST);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockFetchUpstream).not.toHaveBeenCalled();
  });

  it("returns 503 FILTERS_UPSTREAM_UNAVAILABLE when search service is not resolved", async () => {
    mockResolveBedService.mockReturnValue(null);

    const { getFilters } = await import("../use-cases/get-filters");
    const result = await getFilters(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
      expect(result.error.message).toContain("API_UPSTREAM_URL + SEARCH_API_KEY");
    }
    expect(mockResolveBedService).toHaveBeenCalledWith("search");
  });

  it("prefers mocks over upstream when USE_FILTERS_MOCKS is true (even with service configured)", async () => {
    vi.stubEnv("USE_FILTERS_MOCKS", "true");
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockMockService.mockResolvedValue(FILTERS_SUCCESS_FIXTURE);

    const { getFilters } = await import("../use-cases/get-filters");
    await getFilters(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(mockMockService).toHaveBeenCalled();
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockFetchUpstream).not.toHaveBeenCalled();
  });

  it("propagates upstream error when upstream call fails", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockFetchUpstream.mockResolvedValue({
      success: false,
      error: { code: "InternalError", message: "Upstream 500", status: 500 },
    });

    const { getFilters } = await import("../use-cases/get-filters");
    const result = await getFilters(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("InternalError");
      expect(result.error.status).toBe(500);
    }
  });

  it("accepts anonymous identity (empty object)", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockFetchUpstream.mockResolvedValue({ success: true, data: FILTERS_SUCCESS_FIXTURE });

    const { getFilters } = await import("../use-cases/get-filters");
    const result = await getFilters(VALID_REQUEST, TRACE_ID, {});

    expect(result.success).toBe(true);
    expect(mockFetchUpstream).toHaveBeenCalledWith(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, {});
  });
});
