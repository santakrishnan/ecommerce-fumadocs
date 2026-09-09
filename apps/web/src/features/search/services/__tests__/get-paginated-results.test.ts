// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { VEHICLE_FIXTURES } from "../../bff/__fixtures__/vehicle-results.fixture";
import { SEARCH_CONFIG } from "../../data/search-config";
import { getPaginatedResults } from "../get-paginated-results";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

describe("getPaginatedResults", () => {
  beforeEach(() => {
    vi.stubEnv("USE_SEARCH_RESULTS_MOCKS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps the mock BFF response into paginated page data", async () => {
    const paginatedData = await getPaginatedResults("e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f");

    expect(paginatedData.currentPage).toBe(1);
    expect(paginatedData.data).toHaveLength(SEARCH_CONFIG.PAGE_SIZE);
    expect(paginatedData.totalItems).toBe(VEHICLE_FIXTURES.length);
    expect(paginatedData.totalPages).toBe(
      Math.ceil(VEHICLE_FIXTURES.length / SEARCH_CONFIG.PAGE_SIZE)
    );
  });
});
