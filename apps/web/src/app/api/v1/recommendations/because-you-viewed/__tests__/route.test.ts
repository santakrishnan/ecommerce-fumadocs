// @vitest-environment node
import {
  BECAUSE_YOU_VIEWED_EMPTY_FIXTURE,
  BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE,
} from "@features/recommendations/bff/__fixtures__/because-you-viewed.fixture";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetBecauseYouViewed = vi.fn();
vi.mock("@features/recommendations/bff", () => ({
  becauseYouViewedRequestSchema: {
    safeParse: (data: unknown) => ({ success: true, data }),
  },
  getBecauseYouViewed: (...args: unknown[]) => mockGetBecauseYouViewed(...args),
  recommendationsErrorResponse: (error: { code: string; message: string; status: number }) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  },
}));

import { POST } from "../route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(visitorId?: string): NextRequest {
  return new NextRequest("http://127.0.0.1:3000/api/v1/recommendations/because-you-viewed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(visitorId && { "X-Visitor-Id": visitorId }),
    },
  });
}

// ─── Setup / Teardown ───────────────────────────────────────────────────────

afterEach(() => {
  mockGetBecauseYouViewed.mockReset();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/v1/recommendations/because-you-viewed", () => {
  it("returns 200 with success fixture for valid X-Visitor-Id", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE,
    });

    const response = await POST(makeRequest("visitor-abc"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pagination).toEqual({ nextCursor: "cursor-abc", hasNext: true });
    expect(body.results).toHaveLength(6);
  });

  it("returns 400 when X-Visitor-Id header is missing", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("RECOMMENDATIONS_VALIDATION_FAILED");
    expect(mockGetBecauseYouViewed).not.toHaveBeenCalled();
  });

  it("forwards visitorId to the use case", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE,
    });

    await POST(makeRequest("visitor-xyz"));

    expect(mockGetBecauseYouViewed).toHaveBeenCalledWith(expect.anything(), "visitor-xyz");
  });

  it("returns 200 with empty results when use-case returns empty data", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: BECAUSE_YOU_VIEWED_EMPTY_FIXTURE,
    });

    const response = await POST(makeRequest("visitor-abc"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results).toEqual([]);
    expect(body.pagination.hasNext).toBe(false);
  });

  it("returns 503 when use-case returns a failure", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: false,
      error: {
        code: "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE",
        message: "Service unavailable",
        status: 503,
      },
    });

    const response = await POST(makeRequest("visitor-abc"));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("RECOMMENDATIONS_UPSTREAM_UNAVAILABLE");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockGetBecauseYouViewed.mockRejectedValue(new Error("unexpected"));

    const response = await POST(makeRequest("visitor-abc"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("RECOMMENDATIONS_INTERNAL_ERROR");
  });
});
