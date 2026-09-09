// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The use-case awaits `connection()` from `next/server` to mark itself as
// requiring a live request (PPR-safety around crypto.randomUUID). In vitest
// there's no Next.js request context, so the real implementation throws and
// every call falls through to the catch-all VDP_INTERNAL_ERROR branch. We
// stub it to a no-op resolved promise while preserving the rest of the
// module's exports.
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    connection: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock all service modules to isolate the orchestrator logic.
vi.mock("../services/vehicle-lookup-mock", () => ({
  mockVehicleLookup: vi.fn(),
}));
vi.mock("../services/vehicle-lookup-upstream", () => ({
  fetchVehicleLookup: vi.fn(),
}));
vi.mock("../services/dealer-detail-mock", () => ({
  mockDealerDetail: vi.fn(),
}));
vi.mock("../services/dealer-detail-upstream", () => ({
  fetchDealerDetail: vi.fn(),
}));
vi.mock("../services/origination-mock", () => ({
  mockOrigination: vi.fn(),
}));
vi.mock("../services/similar-vehicles-mock", () => ({
  mockSimilarVehicles: vi.fn(),
}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));

import { resolveBedService } from "@config/bed-services";
import { VDP_VEHICLES_BY_VIN, VDP_VINS } from "../../__fixtures__/vehicle-detail.fixtures";
import { PRICE_COMPARISON_BY_VIN } from "../__fixtures__/price-comparison.fixtures";
import { mockDealerDetail } from "../services/dealer-detail-mock";
import { fetchDealerDetail } from "../services/dealer-detail-upstream";
import { mockOrigination } from "../services/origination-mock";
import { mockSimilarVehicles } from "../services/similar-vehicles-mock";
import { mockVehicleLookup } from "../services/vehicle-lookup-mock";
import { fetchVehicleLookup } from "../services/vehicle-lookup-upstream";
import { getVehicleDetail } from "../use-cases/get-vehicle-detail";

const mockedMockVehicleLookup = vi.mocked(mockVehicleLookup);
const mockedFetchVehicleLookup = vi.mocked(fetchVehicleLookup);
const mockedMockDealerDetail = vi.mocked(mockDealerDetail);
const mockedFetchDealerDetail = vi.mocked(fetchDealerDetail);
const mockedMockOrigination = vi.mocked(mockOrigination);
const mockedMockSimilarVehicles = vi.mocked(mockSimilarVehicles);
const mockedResolveBedService = vi.mocked(resolveBedService);

const TEST_VIN = VDP_VINS.highlanderDefault;
const SILVER_TEST_VIN = VDP_VINS.highlanderOffer;
// biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
const TEST_VEHICLE = VDP_VEHICLES_BY_VIN[TEST_VIN]!;
// biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
const SILVER_TEST_VEHICLE = VDP_VEHICLES_BY_VIN[SILVER_TEST_VIN]!;
// biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
const TEST_PRICING_CARD = PRICE_COMPARISON_BY_VIN[TEST_VIN]!;

const BASE_INPUT = {
  vin: TEST_VIN,
  visitorId: "visitor-123",
  traceId: "trace-abc",
};

describe("getVehicleDetail use-case", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("API_UPSTREAM_URL", "");
    vi.stubEnv("USE_VDP_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("when USE_VDP_MOCKS=true", () => {
    beforeEach(() => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
      mockedResolveBedService.mockReturnValue(null);
    });

    it("returns full VDP data for a valid VIN", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue({
        address: { line1: "123 Main St", city: "NY", state: "NY", zip: "10001" },
        phone: "(555) 123-4567",
      });
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.vehicle?.vin).toBe(TEST_VIN);
      expect(result.data.data.vehicle?.vehicleId).toBe(TEST_VEHICLE.vehicleId);
      expect(result.data.data.vehicle?.vehicleInfo.make).toBe("Toyota");
      expect(result.data.data.pricingCard).toEqual(TEST_PRICING_CARD);
      expect(result.data.data.dealer?.dealerCode).toBe(TEST_VEHICLE.dealerInfo.dealerCode);
      expect(result.data.data.origination).toEqual({ kind: "none" });
      expect(result.data.data.vehicleImages?.exterior.label).toBe("Midnight Black Metallic");
      expect(result.data.meta.traceId).toBe("trace-abc");
    });

    it("returns 404 when VIN is not found", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: false, notFound: true });

      const result = await getVehicleDetail({ ...BASE_INPUT, vin: "XXXXXXXXXXXXXXXXX" });

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_NOT_FOUND");
      expect(result.error.status).toBe(404);
    });

    it("includes belowMarket flag from demo registry", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      // The highlander default VIN is in the BELOW_MARKET_VINS set
      expect(result.data.data.vehicle?.belowMarket).toBe(true);
    });

    it("degrades gracefully when dealer detail mock fails", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockRejectedValue(new Error("dealer service down"));
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.dealer?.extended).not.toBeNull();
      expect(result.data.data.dealer?.extended?.images).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: "map-thumbnail" })])
      );
    });

    it("degrades gracefully when origination mock fails", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockRejectedValue(new Error("origination service down"));
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.origination).toEqual({ kind: "none" });
    });

    it("includes certification tier for certified vehicles", async () => {
      // The test vehicle has isCertified: true
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const cert = result.data.data.vehicle?.certification;
      expect(cert).not.toBeNull();
      expect(cert?.tier).toBe("gold");
      expect(cert?.inspectionPoints).toBe(160);
      expect(cert?.headline).toContain("Highlander");
      expect(cert?.headline).toContain("Gold Certified");
      expect(cert?.description).toContain("160-point inspection");
      expect(cert?.description).toContain("highest standard");
      expect(cert?.badgeUrl).toContain("certification-gold.svg");
      expect(cert?.modal.title).toBe("Toyota Gold Certified Warranty and Coverage");
      expect(cert?.modal.rows[0]).toEqual({
        label: "Vehicle Eligibility",
        value: {
          type: "text",
          text: "Up to 6 years old and 85,000 miles or less on the odometer",
        },
      });
      expect(cert?.modal.rows.some((row) => row.value.type === "check")).toBe(true);
    });

    it("returns silver certification modal content for silver fixture VINs", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: SILVER_TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail({ ...BASE_INPUT, vin: SILVER_TEST_VIN });

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const cert = result.data.data.vehicle?.certification;
      expect(cert?.tier).toBe("silver");
      expect(cert?.inspectionPoints).toBe(136);
      expect(cert?.headline).toContain("Silver Certified");
      expect(cert?.description).toContain("136-point inspection");
      expect(cert?.badgeUrl).toContain("certification-silver.svg");
      expect(cert?.modal.title).toBe("Toyota Silver Certified Warranty and Coverage");
      expect(cert?.modal.rows[0]).toEqual({
        label: "Vehicle Eligibility",
        value: {
          type: "text",
          text: "Up to 10 model years old and between 60,000 and 125,000 miles on the odometer; outside of Gold eligibility parameters",
        },
      });
    });

    it("returns null certification for non-certified vehicles", async () => {
      const nonCertifiedVehicle = {
        ...TEST_VEHICLE,
        status: { ...TEST_VEHICLE.status, isCertified: false },
      } as typeof TEST_VEHICLE;
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: nonCertifiedVehicle });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.vehicle?.certification).toBeNull();
    });
  });

  describe("when API_UPSTREAM_URL is set", () => {
    const MOCK_SERVICE = {
      serviceName: "VehicleDetail",
      baseUrl: "https://api.example.com/vehicles/v1",
      apiKey: "test-key",
      tenantId: "toyota",
    };

    beforeEach(() => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("USE_VDP_MOCKS", "false");
      vi.stubEnv("VDP_API_KEY", "test-key");
      mockedResolveBedService.mockReturnValue(MOCK_SERVICE);
    });

    it("maps upstream 404 responses to VDP_NOT_FOUND", async () => {
      mockedFetchVehicleLookup.mockResolvedValue({ success: false, notFound: true });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_NOT_FOUND");
      expect(result.error.status).toBe(404);
    });

    it("calls upstream vehicle lookup service when forceMock is false", async () => {
      mockedFetchVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedFetchDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });

      const result = await getVehicleDetail({ ...BASE_INPUT, forceMock: false });

      expect(mockedFetchVehicleLookup).toHaveBeenCalledWith(MOCK_SERVICE, TEST_VIN, "trace-abc", {
        visitorId: "visitor-123",
      });
      expect(result.success).toBe(true);
    });

    it("calls upstream dealer service and mock origination in parallel", async () => {
      mockedFetchVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedFetchDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      expect(mockedFetchDealerDetail).toHaveBeenCalledWith(
        MOCK_SERVICE.baseUrl,
        TEST_VEHICLE.dealerInfo.dealerCode,
        "trace-abc"
      );
      // Origination uses mock (real API not available yet)
      expect(mockedMockOrigination).toHaveBeenCalledWith(TEST_VIN, "visitor-123");
    });

    it("does not include vehicleImages in live data flow", async () => {
      mockedFetchVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedFetchDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.vehicleImages).toBeUndefined();
    });
  });

  describe("when forceMock=true", () => {
    const MOCK_SERVICE = {
      serviceName: "VehicleDetail",
      baseUrl: "https://api.example.com/vehicles/v1",
      apiKey: "test-key",
      tenantId: "toyota",
    };

    beforeEach(() => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("VDP_API_KEY", "test-key");
      mockedResolveBedService.mockReturnValue(MOCK_SERVICE);
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });
    });

    it("uses mock lookup and enrichment when USE_VDP_MOCKS=false", async () => {
      const result = await getVehicleDetail({ ...BASE_INPUT, forceMock: true });

      expect(result.success).toBe(true);
      expect(mockedMockVehicleLookup).toHaveBeenCalledWith(TEST_VIN);
      expect(mockedFetchVehicleLookup).not.toHaveBeenCalled();
      expect(mockedMockDealerDetail).toHaveBeenCalledWith(TEST_VEHICLE.dealerInfo.dealerCode);
      expect(mockedFetchDealerDetail).not.toHaveBeenCalled();
    });
  });

  // Regression (PEDX01-3118): the mock toggle must WIN over a configured
  // upstream, per the documented contract in .env.local.example
  // ("USE_*_MOCKS=true → mock; else API_UPSTREAM_URL + key → real"). This is
  // the exact scenario that hid the Welcome Back dealer deal card — a dev with
  // API_UPSTREAM_URL set for other services plus USE_VDP_MOCKS=true was getting
  // real-upstream lookups for the demo VIN, which the sandbox does not serve.
  describe("when USE_VDP_MOCKS=true AND a BED service is configured", () => {
    const MOCK_SERVICE = {
      serviceName: "VehicleDetail",
      baseUrl: "https://api.example.com/vehicles/v1",
      apiKey: "test-key",
      tenantId: "toyota",
    };

    beforeEach(() => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("VDP_API_KEY", "test-key");
      vi.stubEnv("USE_VDP_MOCKS", "true");
      mockedResolveBedService.mockReturnValue(MOCK_SERVICE);
    });

    it("uses the mock vehicle lookup, not the upstream service", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail(BASE_INPUT);

      expect(mockedMockVehicleLookup).toHaveBeenCalledWith(TEST_VIN);
      expect(mockedFetchVehicleLookup).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("uses mock enrichment, not the upstream dealer service", async () => {
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      await getVehicleDetail(BASE_INPUT);

      expect(mockedMockDealerDetail).toHaveBeenCalledWith(TEST_VEHICLE.dealerInfo.dealerCode);
      expect(mockedFetchDealerDetail).not.toHaveBeenCalled();
    });
  });

  describe("when neither API_UPSTREAM_URL nor USE_VDP_MOCKS is set", () => {
    beforeEach(() => {
      mockedResolveBedService.mockReturnValue(null);
    });

    it("returns service unavailable error", async () => {
      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    });
  });

  describe("sold vehicle state", () => {
    it("includes soldAt timestamp for sold vehicles", async () => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
      // biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
      const soldVehicle = VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderSold]!;
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: soldVehicle });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });

      const result = await getVehicleDetail({
        ...BASE_INPUT,
        vin: VDP_VINS.highlanderSold,
      });

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.vehicle?.soldAt).toBe("2026-03-24T00:00:00.000Z");
      expect(result.data.data.vehicle?.status.vehicleStatus).toBe("Sold");
    });
  });

  describe("AI content enrichment", () => {
    beforeEach(() => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
      mockedMockVehicleLookup.mockResolvedValue({ success: true, data: TEST_VEHICLE });
      mockedMockDealerDetail.mockResolvedValue(null);
      mockedMockOrigination.mockResolvedValue({ kind: "none" });
      mockedMockSimilarVehicles.mockResolvedValue({ results: [], totalCount: 0 });
    });

    it("includes aiContent with contextual paragraphs", async () => {
      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const ai = result.data.data.vehicle?.aiContent;
      expect(ai).not.toBeNull();
      expect(ai?.paragraphs).toBeInstanceOf(Array);
      expect(ai?.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(ai?.generatedBy).toBe("mock-enrichment-v1");
      expect(ai?.generatedAt).toBeDefined();
    });

    it("mentions dealer city in AI content", async () => {
      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const ai = result.data.data.vehicle?.aiContent;
      const allText = ai?.paragraphs.join(" ") ?? "";
      expect(allText).toContain("Brooklyn");
    });

    it("mentions certification in AI content for certified vehicles", async () => {
      const result = await getVehicleDetail(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const ai = result.data.data.vehicle?.aiContent;
      const allText = ai?.paragraphs.join(" ") ?? "";
      expect(allText).toContain("Gold Certification");
    });
  });
});
