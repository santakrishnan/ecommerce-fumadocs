// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SEARCH_SUGGESTIONS_ENTRY_FIXTURE,
  SEARCH_SUGGESTIONS_UPSTREAM_ENTRY_FIXTURE,
} from "../__fixtures__/agent.fixture";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getSearchSuggestions use case", () => {
  describe("mock mode (USE_SEARCH_MOCKS=true, no upstream)", () => {
    it("returns entry suggestions", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_SEARCH_MOCKS", "true");
      const { getSearchSuggestions } = await import("../use-cases/get-search-suggestions");

      const result = await getSearchSuggestions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(SEARCH_SUGGESTIONS_ENTRY_FIXTURE);
      }
    });
  });

  describe("fail-fast mode (no upstream, mocks disabled)", () => {
    it("returns 503 when neither upstream nor mocks are configured", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      const { getSearchSuggestions } = await import("../use-cases/get-search-suggestions");

      const result = await getSearchSuggestions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("ServiceUnavailable");
        expect(result.error.status).toBe(503);
      }
    });
  });

  describe("upstream mode", () => {
    it("returns ok true with mapped data on success", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(SEARCH_SUGGESTIONS_UPSTREAM_ENTRY_FIXTURE), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
      const { getSearchSuggestions } = await import("../use-cases/get-search-suggestions");

      const result = await getSearchSuggestions();

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify data structure and that mapper produces valid image paths
        expect(Array.isArray(result.data.suggestions)).toBe(true);
        expect(result.data.suggestions.length).toBe(3);

        const firstSuggestion = result.data.suggestions[0];
        expect(firstSuggestion?.image?.src).toContain("/editorial-card/");
      }

      const [url] = fetchSpy.mock.calls[0] ?? [];
      expect(String(url)).toContain("/search/suggestions");
    });

    it("returns ok false with ServiceUnavailable when fetch throws a TypeError", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
      const { getSearchSuggestions } = await import("../use-cases/get-search-suggestions");

      const result = await getSearchSuggestions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("ServiceUnavailable");
      }
    });

    it("returns ok false with InternalError when upstream returns invalid shape", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ unexpected: "data" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
      const { getSearchSuggestions } = await import("../use-cases/get-search-suggestions");

      const result = await getSearchSuggestions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("InternalError");
      }
    });
  });
});
