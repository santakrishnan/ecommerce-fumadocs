// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSearchRecommendations } from "../services/get-search-recommendations";

const STARTS_WITH_SLASH_RE = /^\//;

// Mock server-only (throws in client — no-op in tests)
vi.mock("server-only", () => ({}));

// Mock next/cache (not available in jsdom)
const mockCacheLife = vi.fn();
vi.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => mockCacheLife(...args),
}));

// Mock the recommendations BFF use-case
const mockGetBecauseYouViewed = vi.fn();
vi.mock("@features/recommendations", () => ({
  getBecauseYouViewed: (...args: unknown[]) => mockGetBecauseYouViewed(...args),
}));

const MOCK_INVENTORY = {
  results: [
    {
      id: "veh-001",
      make: "Toyota",
      model: "Camry",
      year: 2024,
      trim: "XSE",
      price: 31_490,
      mileage: 12_000,
      imageUrl: "http://localhost:3000/inventory-card/inventory-card2.png",
      imageAlt: "2024 Toyota Camry XSE",
      ctaLink: "http://localhost:3000/vehicles/veh-001",
    },
    {
      id: "veh-002",
      make: "Toyota",
      model: "RAV4",
      year: 2023,
      trim: "Adventure",
      price: 38_200,
      mileage: 24_500,
      imageUrl: "http://localhost:3000/inventory-card/inventory-card3.png",
      imageAlt: "2023 Toyota RAV4 Adventure",
      ctaLink: "http://localhost:3000/vehicles/veh-002",
    },
  ],
  pagination: { nextCursor: "cursor-abc", hasNext: true },
};

describe("getSearchRecommendations", () => {
  beforeEach(() => {
    mockCacheLife.mockClear();
    mockGetBecauseYouViewed.mockClear();
  });

  it("returns mapped Vehicle[] when BFF succeeds", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    const vehicles = await getSearchRecommendations();

    expect(vehicles).toHaveLength(2);
    expect(vehicles[0]).toEqual({
      id: "veh-001",
      make: "Toyota",
      model: "Camry",
      year: 2024,
      trim: "XSE",
      price: 31_490,
      mileage: 12_000,
      imageUrl: "/inventory-card/inventory-card2.png",
      href: "http://localhost:3000/vehicles/veh-001",
      surface: "light",
      showBadge: false,
    });
  });

  it("returns empty array when BFF fails", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: false,
      error: {
        code: "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE",
        message: "unavailable",
        status: 503,
      },
    });

    const vehicles = await getSearchRecommendations();

    expect(vehicles).toEqual([]);
  });

  it("strips localhost origin from image URLs", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    const vehicles = await getSearchRecommendations();

    for (const vehicle of vehicles) {
      expect(vehicle.imageUrl).not.toContain("localhost");
      expect(vehicle.imageUrl).toMatch(STARTS_WITH_SLASH_RE);
    }
  });

  it("uses fallback image when imageUrl is empty", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: {
        results: [
          {
            ...MOCK_INVENTORY.results[0],
            imageUrl: "",
          },
        ],
      },
    });

    const vehicles = await getSearchRecommendations();

    expect(vehicles[0]?.imageUrl).toBe("/inventory-card/default.png");
  });

  it('calls cacheLife with "profile" profile', async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    await getSearchRecommendations();
    expect(mockCacheLife).toHaveBeenCalledWith("profile");
  });

  it('calls getBecauseYouViewed with empty request and "anonymous"', async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    await getSearchRecommendations();
    expect(mockGetBecauseYouViewed).toHaveBeenCalledWith({}, "anonymous");
  });

  it("passes explicit visitorId to getBecauseYouViewed when provided", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    await getSearchRecommendations("visitor-123");
    expect(mockGetBecauseYouViewed).toHaveBeenCalledWith({}, "visitor-123");
  });

  it("maps trim to empty string when undefined", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: {
        results: [
          {
            ...MOCK_INVENTORY.results[0],
            trim: undefined,
          },
        ],
      },
    });

    const vehicles = await getSearchRecommendations();

    expect(vehicles[0]?.trim).toBe("");
  });

  it("passes through surface from upstream when provided", async () => {
    mockGetBecauseYouViewed.mockResolvedValue({
      success: true,
      data: {
        results: [
          {
            ...MOCK_INVENTORY.results[0],
            surface: "dark",
          },
        ],
      },
    });

    const vehicles = await getSearchRecommendations();

    expect(vehicles[0]?.surface).toBe("dark");
  });

  it('defaults surface to "light" when upstream omits it', async () => {
    mockGetBecauseYouViewed.mockResolvedValue({ success: true, data: MOCK_INVENTORY });

    const vehicles = await getSearchRecommendations();

    expect(vehicles[0]?.surface).toBe("light");
  });
});
