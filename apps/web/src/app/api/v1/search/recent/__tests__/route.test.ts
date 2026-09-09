// @vitest-environment node
import { SEARCH_RECENT_FIXTURE } from "@features/search/bff/__fixtures__/search-recent.fixture";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetSearchRecent = vi.fn();
vi.mock("@features/search/bff", () => ({
  searchRecentRequestSchema: {
    safeParse: (data: unknown) => ({ success: true, data }),
  },
  getSearchRecent: (...args: unknown[]) => mockGetSearchRecent(...args),
  searchRecentErrorResponse: (error: { code: string; message: string; status: number }) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  },
}));

import { POST } from "../route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://127.0.0.1:3000/api/v1/search/recent", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({}),
  });
}

// ─── Setup / Teardown ───────────────────────────────────────────────────────

afterEach(() => {
  mockGetSearchRecent.mockReset();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/v1/search/recent", () => {
  it("returns 200 with the recent fixture when no X-Visitor-Id header is provided", async () => {
    mockGetSearchRecent.mockResolvedValue({ success: true, data: SEARCH_RECENT_FIXTURE });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(SEARCH_RECENT_FIXTURE);
  });

  it("returns 200 with the recent fixture when X-Visitor-Id header is provided", async () => {
    mockGetSearchRecent.mockResolvedValue({ success: true, data: SEARCH_RECENT_FIXTURE });

    const response = await POST(makeRequest({ "X-Visitor-Id": "visitor-abc" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(SEARCH_RECENT_FIXTURE);
  });

  it("forwards X-Visitor-Id to the use case", async () => {
    mockGetSearchRecent.mockResolvedValue({ success: true, data: SEARCH_RECENT_FIXTURE });

    await POST(makeRequest({ "X-Visitor-Id": "visitor-abc" }));

    expect(mockGetSearchRecent).toHaveBeenCalledWith(expect.anything(), "visitor-abc");
  });

  it("passes undefined visitorId when header is absent", async () => {
    mockGetSearchRecent.mockResolvedValue({ success: true, data: SEARCH_RECENT_FIXTURE });

    await POST(makeRequest());

    expect(mockGetSearchRecent).toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it("returns 503 when use-case returns a failure", async () => {
    mockGetSearchRecent.mockResolvedValue({
      success: false,
      error: {
        code: "SEARCH_RECENT_UPSTREAM_UNAVAILABLE",
        message: "Service unavailable",
        status: 503,
      },
    });

    const response = await POST(makeRequest({ "X-Visitor-Id": "visitor-abc" }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("SEARCH_RECENT_UPSTREAM_UNAVAILABLE");
  });

  it("returns 500 when request.json() throws", async () => {
    const badRequest = new NextRequest("http://127.0.0.1:3000/api/v1/search/recent", {
      method: "POST",
      body: "not-json",
    });

    const response = await POST(badRequest);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("SEARCH_RECENT_INTERNAL_ERROR");
  });
});
