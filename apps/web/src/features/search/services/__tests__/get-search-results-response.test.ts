// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSearchResults = vi.fn();
vi.mock("@features/search/bff", () => ({
  searchRequestSchema: {
    safeParse: (data: unknown) => {
      const d = data as Record<string, unknown> | undefined;
      // Simulate Zod: reject if `sort` is an invalid value
      if (d && typeof d.sort === "string" && d.sort === "INVALID_SORT") {
        return { success: false, error: { issues: [{ message: "Invalid sort" }] } };
      }
      // Simulate Zod: reject negative pagination limit
      const pagination = d?.pagination as { limit?: number } | undefined;
      if (pagination && typeof pagination.limit === "number" && pagination.limit < 0) {
        return { success: false, error: { issues: [{ message: "Limit must be >= 0" }] } };
      }
      return { success: true, data: d ?? {} };
    },
  },
  getSearchResults: (...args: unknown[]) => mockGetSearchResults(...args),
}));

import { getSearchResultsResponse } from "../get-search-results-response";

const TRACE_ID = "test-trace-id";
const IDENTITY = { visitorId: "v-1", sessionId: "s-1" };
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const SUCCESS_DATA = {
  data: {
    results: [],
    searchId: "abc",
    totalCount: 0,
    pagination: { limit: 20, offset: 0, hasMore: false },
    smartFilters: [],
  },
  meta: { traceId: TRACE_ID, timestamp: "2025-01-01T00:00:00Z" },
};

describe("getSearchResultsResponse", () => {
  it("returns validation error when request fails schema parsing", async () => {
    const result = await getSearchResultsResponse({
      request: { sort: "INVALID_SORT" },
      traceId: TRACE_ID,
      identity: IDENTITY,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SEARCH_VALIDATION_FAILED");
      expect(result.error.status).toBe(400);
    }
    expect(mockGetSearchResults).not.toHaveBeenCalled();
  });

  it("returns validation error for negative pagination limit", async () => {
    const result = await getSearchResultsResponse({
      request: { pagination: { limit: -1, offset: 0 } },
      traceId: TRACE_ID,
      identity: IDENTITY,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("SEARCH_VALIDATION_FAILED");
    }
  });

  it("delegates to getSearchResults with parsed data on valid request", async () => {
    mockGetSearchResults.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const result = await getSearchResultsResponse({
      request: { pagination: { limit: 20, offset: 0 } },
      traceId: TRACE_ID,
      identity: IDENTITY,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(SUCCESS_DATA);
    }
    expect(mockGetSearchResults).toHaveBeenCalledWith(
      { pagination: { limit: 20, offset: 0 } },
      TRACE_ID,
      IDENTITY
    );
  });

  it("propagates use-case error when getSearchResults fails", async () => {
    mockGetSearchResults.mockResolvedValue({
      success: false,
      error: { code: "ServiceUnavailable", message: "No upstream", status: 503 },
    });

    const result = await getSearchResultsResponse({
      request: {},
      traceId: TRACE_ID,
      identity: IDENTITY,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
    }
  });

  it("defaults traceId to a UUID when not provided", async () => {
    mockGetSearchResults.mockReset();
    mockGetSearchResults.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    await getSearchResultsResponse({ request: {} });

    const [, traceId] = mockGetSearchResults.mock.calls[0] as [unknown, string];
    expect(traceId).toMatch(UUID_REGEX);
  });

  it("defaults identity to empty object when not provided", async () => {
    mockGetSearchResults.mockReset();
    mockGetSearchResults.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    await getSearchResultsResponse({ request: {} });

    const [, , identity] = mockGetSearchResults.mock.calls[0] as [unknown, string, unknown];
    expect(identity).toEqual({});
  });

  it("handles empty input (all defaults)", async () => {
    mockGetSearchResults.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const result = await getSearchResultsResponse();

    expect(result.success).toBe(true);
    expect(mockGetSearchResults).toHaveBeenCalled();
  });
});
