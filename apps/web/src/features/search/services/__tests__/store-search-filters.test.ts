// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ set: mockCookieSet }),
}));

const mockReadVisitorIdentity = vi.fn();
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: () => mockReadVisitorIdentity(),
}));

const mockReadLocationFromCookies = vi.fn();
vi.mock("@features/location/server", () => ({
  readLocationFromCookies: () => mockReadLocationFromCookies(),
}));

const mockGetPaginatedResults = vi.fn();
vi.mock("../get-paginated-results", () => ({
  getPaginatedResults: (...args: unknown[]) => mockGetPaginatedResults(...args),
}));

import {
  MOCK_BED_IDENTITY,
  MOCK_SEARCH_LOCATION,
} from "../../__fixtures__/search-location.fixture";
import { storeSearchFilters } from "../store-search-filters";

const SEARCH_ID = "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789";

beforeEach(() => {
  mockReadVisitorIdentity.mockResolvedValue(MOCK_BED_IDENTITY);
  mockReadLocationFromCookies.mockResolvedValue(MOCK_SEARCH_LOCATION);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("storeSearchFilters — warm-up location", () => {
  it("passes the cookie-derived location into the getPaginatedResults warm-up", async () => {
    await storeSearchFilters(SEARCH_ID, []);

    expect(mockGetPaginatedResults).toHaveBeenCalledTimes(1);
    expect(mockGetPaginatedResults).toHaveBeenCalledWith(
      SEARCH_ID,
      [],
      MOCK_BED_IDENTITY,
      MOCK_SEARCH_LOCATION
    );
  });

  it("skips the warm-up entirely for an invalid searchId", async () => {
    await storeSearchFilters("not-a-uuid", []);

    expect(mockGetPaginatedResults).not.toHaveBeenCalled();
  });
});
