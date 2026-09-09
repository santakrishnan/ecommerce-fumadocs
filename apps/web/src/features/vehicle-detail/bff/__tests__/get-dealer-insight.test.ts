// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service module to isolate use-case logic.
vi.mock("../services/dealer-insight-mock", () => ({
  mockDealerInsight: vi.fn(),
}));

import { DEALER_INSIGHT_DEFAULT_FIXTURE } from "../__fixtures__/dealer-insight-response.fixture";
import { mockDealerInsight } from "../services/dealer-insight-mock";
import { getDealerInsight } from "../use-cases/get-dealer-insight";

const mockedMockDealerInsight = vi.mocked(mockDealerInsight);

const BASE_INPUT = {
  dealerCode: "5012",
  traceId: "trace-abc",
};

describe("getDealerInsight use-case", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("when USE_VDP_MOCKS=true", () => {
    beforeEach(() => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
    });

    it("returns dealer insight data for a valid dealerCode", async () => {
      mockedMockDealerInsight.mockResolvedValue(DEALER_INSIGHT_DEFAULT_FIXTURE);

      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.dealer.dealerCode).toBe("5012");
      expect(result.data.dealer.dealerName).toBe("Toyota of Bay Ridge");
      expect(result.data.dealer.rating?.reviewCount).toBe(2140);
      expect(result.data.dealer.phone).toBe("(929) 538-3803");
    });

    it("calls mockDealerInsight with the provided dealerCode", async () => {
      mockedMockDealerInsight.mockResolvedValue(DEALER_INSIGHT_DEFAULT_FIXTURE);

      await getDealerInsight(BASE_INPUT);

      expect(mockedMockDealerInsight).toHaveBeenCalledWith(BASE_INPUT.dealerCode);
    });
  });

  describe("when API_UPSTREAM_URL is set", () => {
    beforeEach(() => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    });

    it("calls the mock service (Phase 1 placeholder for upstream)", async () => {
      mockedMockDealerInsight.mockResolvedValue(DEALER_INSIGHT_DEFAULT_FIXTURE);

      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(true);
      expect(mockedMockDealerInsight).toHaveBeenCalledWith(BASE_INPUT.dealerCode);
    });
  });

  describe("when neither API_UPSTREAM_URL nor USE_VDP_MOCKS is set", () => {
    it("returns service unavailable error", async () => {
      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    });
  });

  describe("contract validation", () => {
    beforeEach(() => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
    });

    it("returns internal error when response does not match schema", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedMockDealerInsight.mockResolvedValue({
        dealer: { dealerCode: "5012" },
      } as never);

      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_INTERNAL_ERROR");
      expect(result.error.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[getDealerInsight] Response payload did not match contract",
        expect.any(Array)
      );
      consoleErrorSpy.mockRestore();
    });

    it("passes validation for a well-formed response", async () => {
      mockedMockDealerInsight.mockResolvedValue(DEALER_INSIGHT_DEFAULT_FIXTURE);

      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.stubEnv("USE_VDP_MOCKS", "true");
    });

    it("maps unexpected errors to VDP_INTERNAL_ERROR", async () => {
      mockedMockDealerInsight.mockRejectedValue(new Error("Unexpected crash"));

      const result = await getDealerInsight(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_INTERNAL_ERROR");
      expect(result.error.status).toBe(500);
    });
  });
});
