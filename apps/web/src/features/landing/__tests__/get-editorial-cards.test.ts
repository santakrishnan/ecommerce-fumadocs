// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEditorialCards } from "../services/get-editorial-cards";

// Mock server-only (throws in client — no-op in tests)
vi.mock("server-only", () => ({}));

// Mock next/cache (not available in jsdom)
const mockCacheLife = vi.fn();
vi.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => mockCacheLife(...args),
}));

// Mock the profile suggestions use-case
const mockGetProfileSuggestions = vi.fn();
vi.mock("@features/profile", () => ({
  getProfileSuggestions: (...args: unknown[]) => mockGetProfileSuggestions(...args),
}));

describe("getEditorialCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success: true with mapped editorial cards on success", async () => {
    mockGetProfileSuggestions.mockResolvedValue({
      success: true,
      data: [
        {
          eyebrow: "Trending near you",
          headline: "Our most popular models in Greater LA",
          href: "/search/a1b2c3d4-1111-4000-8000-000000000001",
          iconName: "location",
          imageUrl: "/editorial-card/carousel2.png",
          matches: 9,
          surface: "light",
        },
        {
          eyebrow: "Based on your search for a Family SUV",
          headline: "Family friendly SUVs with top rated safety",
          href: "/search/a1b2c3d4-2222-4000-8000-000000000002",
          imageUrl: "/editorial-card/carousel1.png",
          matches: 5,
          surface: "dark",
        },
        {
          eyebrow: "Get ready to purchase",
          headline: "Apply a trade-in to your next purchase",
          href: "/search/a1b2c3d4-3333-4000-8000-000000000003",
          iconName: "bolt",
          imageUrl: "/editorial-card/carousel4.png",
          surface: "dark",
        },
        {
          eyebrow: "Perfect for city driving",
          headline: "Fuel efficient hybrids and EVs",
          href: "/search/a1b2c3d4-4444-4000-8000-000000000004",
          iconName: "bolt",
          imageUrl: "/editorial-card/carousel3.png",
          matches: 10,
          surface: "dark",
        },
      ],
    });

    const result = await getEditorialCards();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data[0]).toEqual({
      eyebrow: "Trending near you",
      headline: "Our most popular models in Greater LA",
      href: "/search/a1b2c3d4-1111-4000-8000-000000000001",
      matches: 9,
      imageUrl: "/editorial-card/carousel2.png",
      iconName: "location",
      surface: "light",
    });
  });

  it("returns empty data when upstream returns empty suggestions", async () => {
    mockGetProfileSuggestions.mockResolvedValue({ success: true, data: [] });

    const result = await getEditorialCards();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns success: false with empty data when use-case fails", async () => {
    mockGetProfileSuggestions.mockResolvedValue({ success: false, error: "upstream error" });

    const result = await getEditorialCards();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  it('calls cacheLife with "landing" profile', async () => {
    mockGetProfileSuggestions.mockResolvedValue({ success: true, data: [] });

    await getEditorialCards();

    expect(mockCacheLife).toHaveBeenCalledWith("landing");
  });

  it("each card has the required shape (no size property)", async () => {
    mockGetProfileSuggestions.mockResolvedValue({
      success: true,
      data: [
        {
          eyebrow: "Test",
          headline: "Test headline",
          href: "/search/test",
          imageUrl: "/editorial-card/carousel1.png",
          matches: 3,
          surface: "dark",
        },
      ],
    });

    const result = await getEditorialCards();

    expect(result.data[0]).toHaveProperty("surface");
    expect(result.data[0]).not.toHaveProperty("size");
  });
});
