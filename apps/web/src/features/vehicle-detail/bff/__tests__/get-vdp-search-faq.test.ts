// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/vdp-search-faq-mock", () => ({
  mockVdpSearchFaq: vi.fn(),
}));

import { VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE } from "../__fixtures__/vdp-search-faq.fixture";
import { mockVdpSearchFaq } from "../services/vdp-search-faq-mock";
import { getVdpSearchFaq } from "../use-cases/get-vdp-search-faq";

const mockedMockVdpSearchFaq = vi.mocked(mockVdpSearchFaq);

const BASE_INPUT = {
  traceId: "trace-abc",
  vin: "3TMDZ5BN8NM126690",
  question: "How comfortable is the 3rd row seating?",
};

describe("getVdpSearchFaq use-case", () => {
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

    it("returns fixture data for a valid VIN and question", async () => {
      mockedMockVdpSearchFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

      const result = await getVdpSearchFaq(BASE_INPUT);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data.data.vin).toBe(BASE_INPUT.vin);
      expect(result.data.data.query).toBe(BASE_INPUT.question);
      expect(result.data.data.searchContext.scope).toBe("vdp");
      expect(result.data.data.searchContext.searchId).toBeNull();
      expect(result.data.data.searchContext.isPersistent).toBe(false);
      expect(result.data.meta.traceId).toBe(BASE_INPUT.traceId);
    });

    it("returns internal error when mock service throws", async () => {
      mockedMockVdpSearchFaq.mockRejectedValue(new Error("mock down"));

      const result = await getVdpSearchFaq(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_INTERNAL_ERROR");
      expect(result.error.status).toBe(500);
    });

    it("returns internal error when mock response fails schema validation", async () => {
      mockedMockVdpSearchFaq.mockResolvedValue({
        data: {
          vin: BASE_INPUT.vin,
          query: BASE_INPUT.question,
        },
      } as never);

      const result = await getVdpSearchFaq(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_INTERNAL_ERROR");
      expect(result.error.status).toBe(500);
    });
  });

  describe("when neither API_UPSTREAM_URL nor USE_VDP_MOCKS is set", () => {
    it("returns service unavailable", async () => {
      const result = await getVdpSearchFaq(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    });
  });

  describe("when API_UPSTREAM_URL is set but USE_VDP_MOCKS is not enabled", () => {
    beforeEach(() => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    });

    it("returns service unavailable (Phase 2 upstream not yet implemented)", async () => {
      const result = await getVdpSearchFaq(BASE_INPUT);

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.error.code).toBe("VDP_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    });
  });
});
