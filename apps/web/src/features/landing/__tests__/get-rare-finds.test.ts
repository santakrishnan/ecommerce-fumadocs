// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRareFinds } from "../services/get-rare-finds";
import { fetchRareFindsUpstream } from "../services/rare-finds-upstream";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("../services/rare-finds-upstream", () => ({
  fetchRareFindsUpstream: vi.fn(),
}));

const mockedFetchUpstream = vi.mocked(fetchRareFindsUpstream);

function makeInventoryCard(vin: string, make = "Toyota", model = "Sequoia") {
  return {
    vin,
    vehicleInfo: { year: 2026, make, model, trim: "Platinum" },
    dealerInfo: { dealerCode: "D1", dealerName: "Test Dealer" },
    pricing: { listPrice: 0, sellingPrice: 89_000 },
    status: { mileage: 500, vehicleStatus: "Available" },
    media: { photos: [{ url: "https://cdn.example.com/photo.jpg", displayOrder: 11 }] },
  };
}

function makeUpstreamResponse(results: unknown[]) {
  return {
    data: {
      results,
      searchId: "test-search-id",
      totalCount: results.length,
      pagination: { limit: 3, offset: 0, total: results.length },
    },
    meta: { traceId: "test-trace", timestamp: new Date().toISOString() },
  };
}

describe("getRareFinds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped vehicles from the search upstream", async () => {
    mockedFetchUpstream.mockResolvedValue(
      makeUpstreamResponse([makeInventoryCard("1HGCG5655WA111111")]) as never
    );

    const result = await getRareFinds({
      zipCode: "91731",
      latitude: null,
      longitude: null,
      visitorId: null,
      sessionId: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({ id: "1HGCG5655WA111111", make: "Toyota", model: "Sequoia" })
    );
  });

  it("returns empty array when upstream returns null", async () => {
    mockedFetchUpstream.mockResolvedValue(null);

    const result = await getRareFinds();

    expect(result).toEqual([]);
  });

  it("deduplicates vehicles by VIN", async () => {
    const vin = "1HGCG5655WA111111";
    mockedFetchUpstream.mockResolvedValue(
      makeUpstreamResponse([makeInventoryCard(vin), makeInventoryCard(vin)]) as never
    );

    const result = await getRareFinds({
      zipCode: "91731",
      latitude: null,
      longitude: null,
      visitorId: null,
      sessionId: null,
    });

    expect(result).toHaveLength(1);
  });

  it("passes location and identity to upstream", async () => {
    mockedFetchUpstream.mockResolvedValue(makeUpstreamResponse([]) as never);

    await getRareFinds({
      zipCode: "91731",
      latitude: 34.071,
      longitude: -118.031,
      visitorId: "v-123",
      sessionId: "s-456",
    });

    expect(mockedFetchUpstream).toHaveBeenCalledWith(
      { zipCode: "91731", latitude: 34.071, longitude: -118.031 },
      { visitorId: "v-123", sessionId: "s-456" }
    );
  });
});
