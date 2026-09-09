// @vitest-environment node
import { VDP_VINS } from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the use-cases so tests don't rely on env vars or fixture delays.
vi.mock("@features/vehicle-detail/bff/use-cases/get-vehicle-detail", () => ({
  getVehicleDetail: vi.fn(),
}));

vi.mock("@features/vehicle-detail/bff/use-cases/get-vdp-search-faq", () => ({
  getVdpSearchFaq: vi.fn(),
}));

import type { GetVdpSearchFaqResult } from "@features/vehicle-detail/bff/use-cases/get-vdp-search-faq";
import { getVdpSearchFaq } from "@features/vehicle-detail/bff/use-cases/get-vdp-search-faq";
import type { GetVehicleDetailResult } from "@features/vehicle-detail/bff/use-cases/get-vehicle-detail";
import { getVehicleDetail } from "@features/vehicle-detail/bff/use-cases/get-vehicle-detail";

// Imported statically (not via `await import()` inside each test) so the
// heavy `@features/vehicle-detail/bff` module graph is loaded once at
// collection time — outside the per-test timeout. Under parallel CPU load
// the first in-test dynamic import could exceed the 5s default and time out.
// `vi.mock` is hoisted above this import, so the mocked deps still apply, and
// `vi.resetAllMocks()` in beforeEach keeps this GET reference valid.
import { GET } from "~/app/api/v1/vdp/[vin]/route";

const mockGetVehicleDetail = vi.mocked(getVehicleDetail);
const mockGetVdpSearchFaq = vi.mocked(getVdpSearchFaq);

function createGetRequest(vin: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(`http://127.0.0.1:3000/api/v1/vdp/${vin}`, {
    method: "GET",
    headers: {
      ...headers,
    },
  });
}

function createParams(vin: string): Promise<{ vin: string }> {
  return Promise.resolve({ vin });
}

const VALID_VIN = VDP_VINS.highlanderDefault;
const INVALID_VIN_SHORT = "ABC123";
const INVALID_VIN_CHARS = "IOQIOQIOQIOQIOQIO"; // I, O, Q not allowed

describe("GET /api/v1/vdp/[vin]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid VIN (too short)", async () => {
    const response = await GET(createGetRequest(INVALID_VIN_SHORT), {
      params: createParams(INVALID_VIN_SHORT),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_VIN");
    expect(body.meta.traceId).toBeDefined();
  });

  it("returns 400 for VIN with invalid characters (I, O, Q)", async () => {
    const response = await GET(createGetRequest(INVALID_VIN_CHARS), {
      params: createParams(INVALID_VIN_CHARS),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_VIN");
  });

  it("returns 404 when VIN is not in inventory", async () => {
    const notFoundResult: GetVehicleDetailResult = {
      success: false,
      error: {
        code: "VDP_NOT_FOUND",
        message: `Vehicle not found for VIN: ${VALID_VIN}`,
        status: 404,
      },
    };
    mockGetVehicleDetail.mockResolvedValue(notFoundResult);

    const response = await GET(createGetRequest(VALID_VIN), { params: createParams(VALID_VIN) });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_NOT_FOUND");
  });

  it("returns 200 with full VDP data for valid VIN", async () => {
    const mockData = {
      data: {
        vehicle: {
          vin: VALID_VIN,
          vehicleId: 1,
          stockNumber: "STK-1",
          certification: {
            tier: "gold",
            inspectionPoints: 160,
            headline: "This Highlander is Toyota Gold Certified",
            description:
              "Based on our thorough 160-point inspection, this vehicle meets Toyota's highest standard, backed by full warranty coverage.",
            badgeUrl: "/images/certification/certification-gold.svg",
            modal: {
              title: "Toyota Gold Certified Warranty and Coverage",
              description: "Gold coverage copy",
              rows: [
                {
                  label: "Vehicle Eligibility",
                  value: { type: "text", text: "Up to 6 years old and 85,000 miles or less" },
                },
                {
                  label: "Trade-ins accepted",
                  value: { type: "check" },
                },
              ],
            },
          },
        },
        pricingCard: {
          amountBelowMarketValue: 3425,
          valueDirection: "below",
          marketValuePercentage: 10,
          nearbyComparedVehiclesCount: 12,
          priceRangeStart: 26_000,
          thisCarPrice: 30_775,
          averagePrice: 34_200,
          priceRangeEnd: 42_000,
        },
        dealer: {
          dealerCode: "D1",
          dealerName: "Test Dealer",
          city: "NY",
          state: "NY",
          zipCode: "10001",
          extended: null,
        },
        origination: { kind: "none" as const },
        similar: { results: [], totalCount: 0 },
        marketing: null,
      },
      meta: { traceId: "test-trace", timestamp: "2026-06-30T00:00:00.000Z" },
    };
    mockGetVehicleDetail.mockResolvedValue({
      success: true,
      data: mockData as never,
    });

    const response = await GET(createGetRequest(VALID_VIN), { params: createParams(VALID_VIN) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.vehicle.vin).toBe(VALID_VIN);
    expect(body.data.vehicle.certification.modal.rows[1].value.type).toBe("check");
    expect(body.data.pricingCard).toEqual({
      amountBelowMarketValue: 3425,
      valueDirection: "below",
      marketValuePercentage: 10,
      nearbyComparedVehiclesCount: 12,
      priceRangeStart: 26_000,
      thisCarPrice: 30_775,
      averagePrice: 34_200,
      priceRangeEnd: 42_000,
    });
    expect(body.meta.traceId).toBe("test-trace");
  });

  it("passes X-Trace-Id header to use-case", async () => {
    mockGetVehicleDetail.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "Service error", status: 502 },
    });

    await GET(createGetRequest(VALID_VIN, { "X-Trace-Id": "custom-trace-123" }), {
      params: createParams(VALID_VIN),
    });

    expect(mockGetVehicleDetail).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: "custom-trace-123" })
    );
  });

  it("passes X-Visitor-Id header to use-case", async () => {
    mockGetVehicleDetail.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "Service error", status: 502 },
    });

    await GET(createGetRequest(VALID_VIN, { "X-Visitor-Id": "visitor-456" }), {
      params: createParams(VALID_VIN),
    });

    expect(mockGetVehicleDetail).toHaveBeenCalledWith(
      expect.objectContaining({ visitorId: "visitor-456" })
    );
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    mockGetVehicleDetail.mockRejectedValue(new Error("Unexpected failure"));

    const response = await GET(createGetRequest(VALID_VIN), { params: createParams(VALID_VIN) });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INTERNAL_ERROR");
  });

  it("normalizes VIN to uppercase before validation and lookup", async () => {
    mockGetVehicleDetail.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "Service error", status: 502 },
    });

    const lowerVin = VALID_VIN.toLowerCase();
    await GET(createGetRequest(lowerVin), { params: createParams(lowerVin) });

    expect(mockGetVehicleDetail).toHaveBeenCalledWith(expect.objectContaining({ vin: VALID_VIN }));
  });
});

const VALID_QUESTION = "How comfortable is the 3rd row seating?";
const QUESTION_TOO_LONG = "a".repeat(501);

function createFaqRequest(
  vin: string,
  question: string,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(
    `http://127.0.0.1:3000/api/v1/vdp/${vin}?question=${encodeURIComponent(question)}`,
    { method: "GET", headers: { ...headers } }
  );
}

function createFaqRequestNoQuestion(vin: string): NextRequest {
  return new NextRequest(`http://127.0.0.1:3000/api/v1/vdp/${vin}?question=`, {
    method: "GET",
  });
}

describe("GET /api/v1/vdp/[vin]?question= (FAQ branch)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Input validation — VIN
  it("returns 400 VDP_INVALID_VIN for invalid VIN even with ?question= present", async () => {
    const response = await GET(createFaqRequest(INVALID_VIN_SHORT, VALID_QUESTION), {
      params: createParams(INVALID_VIN_SHORT),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_VIN");
  });

  it("returns 400 VDP_INVALID_VIN for VIN with invalid chars even with ?question= present", async () => {
    const response = await GET(createFaqRequest(INVALID_VIN_CHARS, VALID_QUESTION), {
      params: createParams(INVALID_VIN_CHARS),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_VIN");
  });

  // Input validation — question
  it("returns 400 VDP_INVALID_QUESTION when ?question= is empty string", async () => {
    const response = await GET(createFaqRequestNoQuestion(VALID_VIN), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_QUESTION");
  });

  it("returns 400 VDP_INVALID_QUESTION when question is whitespace-only", async () => {
    const response = await GET(createFaqRequest(VALID_VIN, "   "), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_QUESTION");
  });

  it("returns 400 VDP_INVALID_QUESTION when question exceeds 500 chars", async () => {
    const response = await GET(createFaqRequest(VALID_VIN, QUESTION_TOO_LONG), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_QUESTION");
  });

  // Success path
  it("returns 200 with FAQ response body for valid VIN and question", async () => {
    const mockFaqResult: GetVdpSearchFaqResult = {
      success: true,
      data: {
        data: {
          vin: VALID_VIN,
          query: VALID_QUESTION,
          searchContext: {
            scope: "vdp",
            searchId: null,
            isPersistent: false,
            source: "vdp-faq-pill",
          },
          messages: [
            { id: "msg-1", role: "user", content: VALID_QUESTION },
            {
              id: "msg-2",
              role: "assistant",
              content: "The 3rd row is best for kids or short trips.",
            },
          ],
          answer: { summary: "The 3rd row is best for kids or short trips." },
        },
        meta: { traceId: "trace-faq", timestamp: "2026-07-08T18:00:00.000Z" },
      },
    };
    mockGetVdpSearchFaq.mockResolvedValue(mockFaqResult);

    const response = await GET(createFaqRequest(VALID_VIN, VALID_QUESTION), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.searchContext.searchId).toBeNull();
    expect(body.data.searchContext.scope).toBe("vdp");
    expect(body.data.searchContext.isPersistent).toBe(false);
  });

  it("passes X-Trace-Id to getVdpSearchFaq", async () => {
    mockGetVdpSearchFaq.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "unavailable", status: 503 },
    });

    await GET(createFaqRequest(VALID_VIN, VALID_QUESTION, { "X-Trace-Id": "faq-trace-123" }), {
      params: createParams(VALID_VIN),
    });

    expect(mockGetVdpSearchFaq).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: "faq-trace-123",
        vin: VALID_VIN,
        question: VALID_QUESTION,
      })
    );
  });

  // Error path
  it("returns 503 when FAQ use-case returns VDP_UPSTREAM_UNAVAILABLE", async () => {
    mockGetVdpSearchFaq.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "unavailable", status: 503 },
    });

    const response = await GET(createFaqRequest(VALID_VIN, VALID_QUESTION), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
  });

  it("returns 500 VDP_INTERNAL_ERROR when FAQ use-case throws", async () => {
    mockGetVdpSearchFaq.mockRejectedValue(new Error("unexpected"));

    const response = await GET(createFaqRequest(VALID_VIN, VALID_QUESTION), {
      params: createParams(VALID_VIN),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INTERNAL_ERROR");
  });

  // Branch isolation
  it("does NOT call getVehicleDetail when ?question= is present", async () => {
    mockGetVdpSearchFaq.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "unavailable", status: 503 },
    });

    await GET(createFaqRequest(VALID_VIN, VALID_QUESTION), { params: createParams(VALID_VIN) });

    expect(mockGetVehicleDetail).not.toHaveBeenCalled();
  });

  it("does NOT call getVdpSearchFaq when ?question= is absent", async () => {
    mockGetVehicleDetail.mockResolvedValue({
      success: false,
      error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "Service error", status: 502 },
    });

    await GET(createGetRequest(VALID_VIN), { params: createParams(VALID_VIN) });

    expect(mockGetVdpSearchFaq).not.toHaveBeenCalled();
  });
});
