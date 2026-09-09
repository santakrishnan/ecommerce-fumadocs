// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));
vi.mock("../../services/get-trade-in-offer-mock", () => ({
  mockGetTradeInOffer: vi.fn(),
}));
vi.mock("../../services/get-trade-in-offer-upstream", () => ({
  getTradeInOfferUpstream: vi.fn(),
}));

import type { ResolvedBedService } from "@config/bed-services";
import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { TradeInOfferResponse } from "../../contracts/trade-in-offer-response.schema";
import type { TradeInRequest } from "../../contracts/trade-in-request.schema";
import { mockGetTradeInOffer } from "../../services/get-trade-in-offer-mock";
import { getTradeInOfferUpstream } from "../../services/get-trade-in-offer-upstream";

const mockResolveBedService = vi.mocked(resolveBedService);
const mockMockService = vi.mocked(mockGetTradeInOffer);
const mockUpstream = vi.mocked(getTradeInOfferUpstream);

const REQUEST: TradeInRequest = { plate: "ABC1234", state: "NY" };
const TRACE_ID = "test-trace-id";
const IDENTITY: BedVisitorIdentity = { visitorId: "vis-1", sessionId: "sess-1" };

const SUCCESS_DATA: TradeInOfferResponse = {
  offerId: "33333333-3333-4333-8333-333333333333",
  vehicle: { year: 2021, make: "Toyota", model: "RAV4", trim: "XLE Premium" },
  estimatedValue: { amount: 24_500, currency: "USD" },
  expiresAt: "2026-02-01T00:00:00.000Z",
  status: "offer",
};

const TRADEIN_SERVICE: ResolvedBedService = {
  serviceName: "OriginationTradeIn",
  baseUrl: "https://api.sandbox.arrow.toyotafinancial.com/origination-tradein/v1",
  apiKey: "test-api-key",
  tenantId: "test-tenant",
};

describe("getTradeInOffer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls the trade-in upstream when the service is resolved", async () => {
    mockResolveBedService.mockReturnValue(TRADEIN_SERVICE);
    mockUpstream.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const { getTradeInOffer } = await import("../get-trade-in-offer");
    const result = await getTradeInOffer(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    expect(mockResolveBedService).toHaveBeenCalledWith("origination-tradein");
    expect(mockUpstream).toHaveBeenCalledWith(TRADEIN_SERVICE, REQUEST, TRACE_ID, IDENTITY);
    expect(mockMockService).not.toHaveBeenCalled();
  });

  it("returns mock data when USE_ORIGINATION_MOCKS is true (always wins)", async () => {
    vi.stubEnv("USE_ORIGINATION_MOCKS", "true");
    mockResolveBedService.mockReturnValue(TRADEIN_SERVICE);
    mockMockService.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const { getTradeInOffer } = await import("../get-trade-in-offer");
    const result = await getTradeInOffer(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    expect(mockMockService).toHaveBeenCalledWith(REQUEST);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockUpstream).not.toHaveBeenCalled();
  });

  it("returns 503 ServiceUnavailable when the service is not resolved", async () => {
    mockResolveBedService.mockReturnValue(null);

    const { getTradeInOffer } = await import("../get-trade-in-offer");
    const result = await getTradeInOffer(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
      expect(result.error.message).toContain("ORIGINATION_TRADEIN_API_KEY");
    }
    expect(mockUpstream).not.toHaveBeenCalled();
  });

  it("propagates an upstream error Result", async () => {
    mockResolveBedService.mockReturnValue(TRADEIN_SERVICE);
    mockUpstream.mockResolvedValue({
      success: false,
      error: { code: "UpstreamError", message: "boom", status: 502 },
    });

    const { getTradeInOffer } = await import("../get-trade-in-offer");
    const result = await getTradeInOffer(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UpstreamError");
      expect(result.error.status).toBe(502);
    }
  });
});
