// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../services/autocomplete-mock", () => ({
  mockGetAutocomplete: vi.fn(),
}));

import type { AutocompleteResponse } from "../../contracts/autocomplete-response.schema";
import { mockGetAutocomplete } from "../../services/autocomplete-mock";

const mockMockService = vi.mocked(mockGetAutocomplete);

const MOCK_RESPONSE: AutocompleteResponse = {
  suggestions: [
    { label: "2024 Toyota Camry", value: "toyota-camry-2024" },
    { label: "2024 Honda Civic", value: "honda-civic-2024" },
  ],
  meta: {
    traceId: "test-trace-id",
    timestamp: "2026-06-24T00:00:00.000Z",
  },
};

describe("getAutocomplete", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const request = { q: "toyota" };

  it("returns mock data when no upstream URL is configured", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "");
    mockMockService.mockResolvedValue(MOCK_RESPONSE);

    const { getAutocomplete } = await import("../get-autocomplete");
    const result = await getAutocomplete(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggestions).toHaveLength(2);
      expect(result.data.suggestions[0]?.label).toBe("2024 Toyota Camry");
      expect(result.data.meta.traceId).toBe("test-trace-id");
    }
    expect(mockMockService).toHaveBeenCalledWith(request);
  });

  it("returns mock data when USE_AUTOCOMPLETE_MOCKS is true even with upstream URL", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("USE_AUTOCOMPLETE_MOCKS", "true");
    mockMockService.mockResolvedValue(MOCK_RESPONSE);

    const { getAutocomplete } = await import("../get-autocomplete");
    const result = await getAutocomplete(request);

    expect(result.success).toBe(true);
    expect(mockMockService).toHaveBeenCalledWith(request);
  });

  it("returns ServiceUnavailable when upstream is set but mocks are disabled", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("USE_AUTOCOMPLETE_MOCKS", "false");

    const { getAutocomplete } = await import("../get-autocomplete");
    const result = await getAutocomplete(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
    }
  });

  it("returns AUTOCOMPLETE_INTERNAL_ERROR when mock service throws an unexpected error", async () => {
    vi.stubEnv("API_UPSTREAM_URL", "");
    mockMockService.mockRejectedValue(new Error("Network failure"));

    const { getAutocomplete } = await import("../get-autocomplete");
    const result = await getAutocomplete(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AUTOCOMPLETE_INTERNAL_ERROR");
      expect(result.error.status).toBe(500);
    }
  });
});
