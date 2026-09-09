// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEALER_OFFERS } from "../data/dealer-cards";
import { getDealerOffers } from "../services/get-dealer-offers";

// Mock server-only (throws in client — no-op in tests)
vi.mock("server-only", () => ({}));

// Mock next/cache (not available in jsdom)
const mockCacheLife = vi.fn();
const mockCacheTag = vi.fn();
vi.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => mockCacheLife(...args),
  cacheTag: (...args: unknown[]) => mockCacheTag(...args),
}));

describe("getDealerOffers", () => {
  beforeEach(() => {
    mockCacheLife.mockClear();
    mockCacheTag.mockClear();
  });
  it("returns dealer offers from the seed data", async () => {
    const offers = await getDealerOffers();
    expect(offers).toEqual(DEALER_OFFERS.slice(0, 4));
  });

  it("returns at most 4 offers", async () => {
    const offers = await getDealerOffers();
    expect(offers.length).toBeLessThanOrEqual(4);
  });

  it("each offer has the required shape", async () => {
    const offers = await getDealerOffers();
    for (const offer of offers) {
      expect(offer).toHaveProperty("id");
      expect(offer).toHaveProperty("name");
      expect(offer).toHaveProperty("offerHeadline");
      expect(offer).toHaveProperty("imageSrc");
      expect(offer).toHaveProperty("imageAlt");
      expect(typeof offer.id).toBe("string");
      expect(typeof offer.name).toBe("string");
      expect(typeof offer.offerHeadline).toBe("string");
    }
  });

  it("returns the same data regardless of zip code (V1 hardcoded behavior)", async () => {
    const offersA = await getDealerOffers("10001");
    const offersB = await getDealerOffers("90210");
    expect(offersA).toEqual(offersB);
  });

  it("uses default zip code when none is provided", async () => {
    const offersDefault = await getDealerOffers();
    const offersExplicit = await getDealerOffers("10001");
    expect(offersDefault).toEqual(offersExplicit);
  });

  it("returns offers with unique ids", async () => {
    const offers = await getDealerOffers();
    const ids = offers.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('calls cacheLife with "landing" profile', async () => {
    await getDealerOffers();
    expect(mockCacheLife).toHaveBeenCalledWith("landing");
  });

  it("calls cacheTag with base and zip-specific tags (default zip)", async () => {
    await getDealerOffers();
    expect(mockCacheTag).toHaveBeenCalledWith("dealer-offers", "dealer-offers:10001");
  });

  it("calls cacheTag with the provided zip code", async () => {
    await getDealerOffers("90210");
    expect(mockCacheTag).toHaveBeenCalledWith("dealer-offers", "dealer-offers:90210");
  });
});
