// @vitest-environment node
import { DEALER_INSIGHT_DEFAULT_FIXTURE } from "@features/vehicle-detail/bff/__fixtures__/dealer-insight-response.fixture";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetDealerInsight = vi.fn();
vi.mock("@features/vehicle-detail/bff", () => ({
  getDealerInsight: (...args: unknown[]) => mockGetDealerInsight(...args),
  vdpErrorResponse: (error: { code: string; message: string; status: number }, traceId: string) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: { code: error.code, message: error.message }, meta: { traceId } },
      { status: error.status }
    );
  },
}));

import { GET } from "~/app/api/v1/dealer-insight/[dealerCode]/route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function createGetRequest(dealerCode: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(`http://127.0.0.1:3000/api/v1/dealer-insight/${dealerCode}`, {
    method: "GET",
    headers: { ...headers },
  });
}

function createParams(dealerCode: string): Promise<{ dealerCode: string }> {
  return Promise.resolve({ dealerCode });
}

const VALID_DEALER_CODE = "5012";

// ─── Setup / Teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  mockGetDealerInsight.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/dealer-insight/[dealerCode]", () => {
  it("returns 400 for empty dealer code", async () => {
    const response = await GET(createGetRequest(""), {
      params: createParams(""),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INVALID_VIN");
    expect(body.meta.traceId).toBeDefined();
  });

  it("returns 200 with dealer insight data for valid dealer code", async () => {
    mockGetDealerInsight.mockResolvedValue({
      success: true,
      data: DEALER_INSIGHT_DEFAULT_FIXTURE,
    });

    const response = await GET(createGetRequest(VALID_DEALER_CODE), {
      params: createParams(VALID_DEALER_CODE),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.dealer.dealerCode).toBe("5012");
    expect(body.dealer.dealerName).toBe("Toyota of Bay Ridge");
    expect(body.dealer.rating.reviewCount).toBe(2140);
    expect(body.dealer.phone).toBe("(929) 538-3803");
    expect(body.dealer.hours.weeklySchedule).toHaveLength(4);
    expect(body.dealer.media.photos).toHaveLength(2);
    expect(body.dealer.media.mapThumbnail.alt).toBeDefined();
  });

  it("returns error when getDealerInsight fails with upstream unavailable", async () => {
    mockGetDealerInsight.mockResolvedValue({
      success: false,
      error: {
        code: "VDP_UPSTREAM_UNAVAILABLE",
        message: "Dealer insight service is not configured",
        status: 503,
      },
    });

    const response = await GET(createGetRequest(VALID_DEALER_CODE), {
      params: createParams(VALID_DEALER_CODE),
    });

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
    expect(body.meta.traceId).toBeDefined();
  });

  it("passes X-Trace-Id header to use-case", async () => {
    mockGetDealerInsight.mockResolvedValue({
      success: true,
      data: DEALER_INSIGHT_DEFAULT_FIXTURE,
    });

    await GET(createGetRequest(VALID_DEALER_CODE, { "X-Trace-Id": "custom-trace-789" }), {
      params: createParams(VALID_DEALER_CODE),
    });

    expect(mockGetDealerInsight).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: "custom-trace-789" })
    );
  });

  it("passes dealerCode to use-case", async () => {
    mockGetDealerInsight.mockResolvedValue({
      success: true,
      data: DEALER_INSIGHT_DEFAULT_FIXTURE,
    });

    await GET(createGetRequest(VALID_DEALER_CODE), {
      params: createParams(VALID_DEALER_CODE),
    });

    expect(mockGetDealerInsight).toHaveBeenCalledWith(
      expect.objectContaining({ dealerCode: VALID_DEALER_CODE })
    );
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    mockGetDealerInsight.mockRejectedValue(new Error("Unexpected failure"));

    const response = await GET(createGetRequest(VALID_DEALER_CODE), {
      params: createParams(VALID_DEALER_CODE),
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("VDP_INTERNAL_ERROR");
  });
});
