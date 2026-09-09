// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));
vi.mock("../../services/search-mock", () => ({
  mockSearchResults: vi.fn(),
}));
vi.mock("../../services/search-upstream", () => ({
  fetchSearchUpstream: vi.fn(),
}));

import type { ResolvedBedService } from "@config/bed-services";
import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { SEARCH_SUCCESS_FIXTURE } from "../../__fixtures__/search-results.fixture";
import { mockSearchResults } from "../../services/search-mock";
import type { UpstreamSearchRequest } from "../../services/search-upstream";
import { fetchSearchUpstream } from "../../services/search-upstream";

const mockResolveBedService = vi.mocked(resolveBedService);
const mockFetchUpstream = vi.mocked(fetchSearchUpstream);
const mockMockService = vi.mocked(mockSearchResults);

const VALID_REQUEST: UpstreamSearchRequest = {
  sort: "Recommended",
  pagination: { limit: 20, offset: 0 },
};

const TRACE_ID = "test-trace-id";
const IDENTITY: BedVisitorIdentity = {
  visitorId: "test-visitor-id",
  sessionId: "test-session-id",
};

const MOCK_SERVICE: ResolvedBedService = {
  serviceName: "Search",
  baseUrl: "https://api.sandbox.arrow.toyotafinancial.com/search/v1",
  apiKey: "test-api-key",
  tenantId: "test-tenant",
};

describe("getSearchResults", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls upstream when search service is resolved via resolveBedService", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockFetchUpstream.mockResolvedValue({ success: true, data: SEARCH_SUCCESS_FIXTURE });

    const { getSearchResults } = await import("../get-search-results");
    const result = await getSearchResults(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.searchId).toBe(SEARCH_SUCCESS_FIXTURE.data.searchId);
    }
    expect(mockResolveBedService).toHaveBeenCalledWith("search");
    expect(mockFetchUpstream).toHaveBeenCalledWith(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, IDENTITY);
    expect(mockMockService).not.toHaveBeenCalled();
  });

  it("returns mock data when USE_SEARCH_RESULTS_MOCKS is true (always wins)", async () => {
    vi.stubEnv("USE_SEARCH_RESULTS_MOCKS", "true");
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockMockService.mockResolvedValue({ success: true, data: SEARCH_SUCCESS_FIXTURE });

    const { getSearchResults } = await import("../get-search-results");
    const result = await getSearchResults(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    expect(mockMockService).toHaveBeenCalledWith(VALID_REQUEST, TRACE_ID);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockFetchUpstream).not.toHaveBeenCalled();
  });

  it("returns 503 SEARCH_UPSTREAM_UNAVAILABLE when search service is not resolved", async () => {
    mockResolveBedService.mockReturnValue(null);

    const { getSearchResults } = await import("../get-search-results");
    const result = await getSearchResults(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
      expect(result.error.message).toContain("API_UPSTREAM_URL + SEARCH_API_KEY");
    }
    expect(mockResolveBedService).toHaveBeenCalledWith("search");
  });

  it("prefers mocks over upstream when USE_SEARCH_RESULTS_MOCKS is true (even with service configured)", async () => {
    vi.stubEnv("USE_SEARCH_RESULTS_MOCKS", "true");
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockMockService.mockResolvedValue({ success: true, data: SEARCH_SUCCESS_FIXTURE });

    const { getSearchResults } = await import("../get-search-results");
    await getSearchResults(VALID_REQUEST, TRACE_ID, IDENTITY);

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

    const { getSearchResults } = await import("../get-search-results");
    const result = await getSearchResults(VALID_REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("InternalError");
      expect(result.error.status).toBe(500);
    }
  });

  it("accepts anonymous identity (empty object)", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockFetchUpstream.mockResolvedValue({ success: true, data: SEARCH_SUCCESS_FIXTURE });

    const { getSearchResults } = await import("../get-search-results");
    const result = await getSearchResults(VALID_REQUEST, TRACE_ID, {});

    expect(result.success).toBe(true);
    expect(mockFetchUpstream).toHaveBeenCalledWith(MOCK_SERVICE, VALID_REQUEST, TRACE_ID, {});
  });
});
