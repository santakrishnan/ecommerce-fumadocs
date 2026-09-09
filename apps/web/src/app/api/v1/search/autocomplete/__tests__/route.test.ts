// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetAutocomplete = vi.fn();
vi.mock("@features/search/bff", () => ({
  autocompleteRequestSchema: {
    safeParse: (data: unknown) => {
      const d = data as { q?: string } | undefined;
      const q = d?.q ?? "";
      // Simulate Zod: reject if query < 2 chars or > 4000 chars
      if (q.length < 2 || q.length > 4000) {
        return { success: false, error: { issues: [{ message: "Invalid query length" }] } };
      }
      return { success: true, data: { q } };
    },
  },
  getAutocomplete: (...args: unknown[]) => mockGetAutocomplete(...args),
  autocompleteErrorResponse: (error: { code: string; message: string; status: number }) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      {
        error: { code: error.code, message: error.message },
        meta: { traceId: "test-trace", timestamp: new Date().toISOString() },
      },
      { status: error.status }
    );
  },
}));

import { GET } from "../route";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MOCK_RESPONSE = {
  suggestions: [
    { label: "2024 Toyota Camry", value: "toyota-camry-2024" },
    { label: "2024 Honda Civic", value: "honda-civic-2024" },
  ],
  meta: {
    traceId: "test-trace-id",
    timestamp: "2026-06-24T00:00:00.000Z",
  },
};

function makeRequest(query: string): NextRequest {
  return new NextRequest(
    `http://127.0.0.1/api/v1/search/autocomplete?q=${encodeURIComponent(query)}`,
    { method: "GET" }
  );
}

// ─── Setup / Teardown ───────────────────────────────────────────────────────

afterEach(() => {
  mockGetAutocomplete.mockReset();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/search/autocomplete", () => {
  it("returns suggestions for a valid query", async () => {
    mockGetAutocomplete.mockResolvedValue({ success: true, data: MOCK_RESPONSE });

    const response = await GET(makeRequest("toyota"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toHaveLength(2);
    expect(body.suggestions[0].label).toBe("2024 Toyota Camry");
    expect(mockGetAutocomplete).toHaveBeenCalledWith({ q: "toyota" });
  });

  it("returns empty suggestions for query shorter than 2 characters", async () => {
    const response = await GET(makeRequest("a"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(mockGetAutocomplete).not.toHaveBeenCalled();
  });

  it("returns empty suggestions for empty query", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(mockGetAutocomplete).not.toHaveBeenCalled();
  });

  it("returns empty suggestions for query exceeding max length", async () => {
    const longQuery = "a".repeat(4001);
    const response = await GET(makeRequest(longQuery));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(mockGetAutocomplete).not.toHaveBeenCalled();
  });

  it("trims whitespace from query parameter", async () => {
    mockGetAutocomplete.mockResolvedValue({ success: true, data: MOCK_RESPONSE });

    const response = await GET(makeRequest("  toyota  "));

    expect(response.status).toBe(200);
    expect(mockGetAutocomplete).toHaveBeenCalledWith({ q: "toyota" });
  });

  it("returns error response when use-case fails", async () => {
    mockGetAutocomplete.mockResolvedValue({
      success: false,
      error: {
        code: "ServiceUnavailable",
        message: "Service unavailable",
        status: 503,
      },
    });

    const response = await GET(makeRequest("toyota"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("ServiceUnavailable");
  });

  it("returns 500 when an unexpected exception occurs", async () => {
    mockGetAutocomplete.mockRejectedValue(new Error("Unexpected failure"));

    const response = await GET(makeRequest("toyota"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("AUTOCOMPLETE_INTERNAL_ERROR");
  });
});
