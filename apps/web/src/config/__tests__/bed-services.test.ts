// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBedService, SEARCH_ENDPOINTS } from "../bed-services";

describe("SEARCH_ENDPOINTS", () => {
  it("defines results endpoint for filtered search", () => {
    expect(SEARCH_ENDPOINTS.results).toBe("/search");
  });

  it("defines agent endpoint for conversational search", () => {
    expect(SEARCH_ENDPOINTS.agent).toBe("/search/agent");
  });

  it("defines filters endpoint for smart-filter listing", () => {
    expect(SEARCH_ENDPOINTS.filters).toBe("/filters");
  });

  it("resolves expected full paths when combined with search service baseUrl", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    vi.stubEnv("BED_TENANT_ID", "test-tenant");

    const service = resolveBedService("search");
    expect(service).not.toBeNull();

    if (service) {
      // Default path is "/search/v1", so endpoints resolve to:
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.results}`).toBe(
        "https://api.example.com/search/v1/search"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.agent}`).toBe(
        "https://api.example.com/search/v1/search/agent"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.filters}`).toBe(
        "https://api.example.com/search/v1/filters"
      );
    }

    vi.unstubAllEnvs();
  });

  it("respects SEARCH_API_PATH override for path resolution", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    vi.stubEnv("SEARCH_API_PATH", "/search/v2"); // Override default v1
    vi.stubEnv("BED_TENANT_ID", "test-tenant");

    const service = resolveBedService("search");
    expect(service).not.toBeNull();

    if (service) {
      // Custom path "/search/v2", so endpoints resolve to:
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.results}`).toBe(
        "https://api.example.com/search/v2/search"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.agent}`).toBe(
        "https://api.example.com/search/v2/search/agent"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.filters}`).toBe(
        "https://api.example.com/search/v2/filters"
      );
    }

    vi.unstubAllEnvs();
  });

  it("handles custom domain and path combinations", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://custom-api.example.com/api");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    vi.stubEnv("SEARCH_API_PATH", "/services/search/v3");
    vi.stubEnv("BED_TENANT_ID", "test-tenant");

    const service = resolveBedService("search");
    expect(service).not.toBeNull();

    if (service) {
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.results}`).toBe(
        "https://custom-api.example.com/api/services/search/v3/search"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.agent}`).toBe(
        "https://custom-api.example.com/api/services/search/v3/search/agent"
      );
      expect(`${service.baseUrl}${SEARCH_ENDPOINTS.filters}`).toBe(
        "https://custom-api.example.com/api/services/search/v3/filters"
      );
    }

    vi.unstubAllEnvs();
  });

  it("maintains consistency with existing service path resolution", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    vi.stubEnv("VISITORS_API_KEY", "test-visitors-key");
    vi.stubEnv("BED_TENANT_ID", "test-tenant");

    const searchService = resolveBedService("search");
    const visitorsService = resolveBedService("visitors");

    expect(searchService).not.toBeNull();
    expect(visitorsService).not.toBeNull();

    if (searchService && visitorsService) {
      // Search service includes version in defaultPath ("/search/v1")
      expect(searchService.baseUrl).toBe("https://api.example.com/search/v1");

      // Visitors service is unversioned ("/visitors")
      expect(visitorsService.baseUrl).toBe("https://api.example.com/visitors");

      // Both follow same pattern when combined with endpoints
      expect(typeof SEARCH_ENDPOINTS.results).toBe("string");
      expect(typeof SEARCH_ENDPOINTS.agent).toBe("string");
    }

    vi.unstubAllEnvs();
  });
});

describe("resolveBedService search integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when API_UPSTREAM_URL is missing", () => {
    vi.stubEnv("API_UPSTREAM_URL", "");
    vi.stubEnv("SEARCH_API_KEY", "test-key");

    const service = resolveBedService("search");
    expect(service).toBeNull();
  });

  it("returns null when SEARCH_API_KEY is missing", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "");

    const service = resolveBedService("search");
    expect(service).toBeNull();
  });

  it("resolves search service with all required fields", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    vi.stubEnv("BED_TENANT_ID", "test-tenant");

    const service = resolveBedService("search");

    expect(service).toEqual({
      serviceName: "Search",
      baseUrl: "https://api.example.com/search/v1",
      apiKey: "test-search-key",
      tenantId: "test-tenant",
    });
  });

  it("works without BED_TENANT_ID (tenantId is optional)", () => {
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    vi.stubEnv("SEARCH_API_KEY", "test-search-key");
    // No BED_TENANT_ID set

    const service = resolveBedService("search");

    expect(service).toEqual({
      serviceName: "Search",
      baseUrl: "https://api.example.com/search/v1",
      apiKey: "test-search-key",
      tenantId: undefined,
    });
  });
});
