// @vitest-environment node
import { cacheLife, cacheTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFeaturedVehicles } from "../services/inventory-vehicles-service";
import { fetchNewTodayUpstream } from "../services/new-today-upstream";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("../services/new-today-upstream", () => ({
  fetchNewTodayUpstream: vi.fn(),
}));

const mockedCacheLife = vi.mocked(cacheLife);
const mockedCacheTag = vi.mocked(cacheTag);
const mockedFetchUpstream = vi.mocked(fetchNewTodayUpstream);

/** Minimal InventoryCard fixture matching the SDK shape. */
function makeInventoryCard(vin: string, make = "Toyota", model = "Camry") {
  return {
    vin,
    vehicleId: 1,
    vehicleInfo: { year: 2024, make, model, trim: "SE" },
    dealerInfo: { dealerCode: "D1", dealerName: "Test Dealer" },
    pricing: { listPrice: 30_000 },
    status: { mileage: 15_000, vehicleStatus: "Available" },
    media: { photos: [{ url: "https://cdn.example.com/photo.jpg", displayOrder: 1 }] },
  };
}

function makeUpstreamResponse(results: unknown[]) {
  return {
    data: {
      results,
      searchId: "test-search-id",
      totalCount: results.length,
      pagination: { limit: 20, offset: 0, total: results.length },
    },
    meta: { traceId: "test-trace", timestamp: new Date().toISOString() },
  };
}

describe("getFeaturedVehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped vehicles from the search upstream", async () => {
    mockedFetchUpstream.mockResolvedValue(
      makeUpstreamResponse([makeInventoryCard("1HGCG5655WA123456")]) as never
    );

    const result = await getFeaturedVehicles();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "1HGCG5655WA123456",
        vin: "1HGCG5655WA123456",
        make: "Toyota",
        model: "Camry",
        year: 2024,
        price: 30_000,
      })
    );
  });

  it("returns empty array when upstream returns null (service unavailable)", async () => {
    mockedFetchUpstream.mockResolvedValue(null);

    const result = await getFeaturedVehicles();

    expect(result).toEqual([]);
  });

  it("deduplicates vehicles by VIN", async () => {
    const vin = "1HGCG5655WA123456";
    mockedFetchUpstream.mockResolvedValue(
      makeUpstreamResponse([makeInventoryCard(vin), makeInventoryCard(vin)]) as never
    );

    const result = await getFeaturedVehicles();

    expect(result).toHaveLength(1);
  });

  it("passes location and identity to upstream", async () => {
    mockedFetchUpstream.mockResolvedValue(makeUpstreamResponse([]) as never);

    await getFeaturedVehicles({
      zipCode: "91731",
      latitude: 34.071,
      longitude: -118.031,
      visitorId: "visitor-123",
      sessionId: "session-456",
    });

    expect(mockedFetchUpstream).toHaveBeenCalledWith(
      { zipCode: "91731", latitude: 34.071, longitude: -118.031 },
      { visitorId: "visitor-123", sessionId: "session-456" }
    );
  });

  // TODO: re-enable when caching is restored
  it.skip("applies landing cache profile and new-today cache tags", async () => {
    mockedFetchUpstream.mockResolvedValue(makeUpstreamResponse([]) as never);

    await getFeaturedVehicles({
      zipCode: "90210",
      latitude: null,
      longitude: null,
      visitorId: null,
      sessionId: null,
    });

    expect(mockedCacheLife).toHaveBeenCalledWith("landing");
    expect(mockedCacheTag).toHaveBeenCalledWith("new-today-inventory");
    expect(mockedCacheTag).toHaveBeenCalledWith("new-today-inventory:90210");
  });

  // TODO: re-enable when caching is restored
  it.skip("does not add a zip-scoped tag when no zip code is provided", async () => {
    mockedFetchUpstream.mockResolvedValue(makeUpstreamResponse([]) as never);

    await getFeaturedVehicles();

    expect(mockedCacheTag).toHaveBeenCalledWith("new-today-inventory");
    expect(mockedCacheTag).not.toHaveBeenCalledWith(
      expect.stringContaining("new-today-inventory:")
    );
  });
});
