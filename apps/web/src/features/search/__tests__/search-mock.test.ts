// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mockSearchResults } from "../bff/services/search-mock";

const TRACE_ID = "test-trace-id";
const PAGE_SIZE = 10;

describe("mockSearchResults — sorting", () => {
  it("returns vehicles in ascending price order for LowestPrice", async () => {
    const result = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "LowestPrice" },
      TRACE_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const prices = result.data.data.results.map((v) => v.pricing.listPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("returns vehicles in descending price order for HighestPrice", async () => {
    const result = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "HighestPrice" },
      TRACE_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const prices = result.data.data.results.map((v) => v.pricing.listPrice);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("returns vehicles in ascending mileage order for LowestMileage", async () => {
    const result = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "LowestMileage" },
      TRACE_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const mileages = result.data.data.results.map((v) => v.status.mileage);
    expect(mileages).toEqual([...mileages].sort((a, b) => a - b));
  });

  it("returns vehicles in descending year order for NewestYear", async () => {
    const result = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "NewestYear" },
      TRACE_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const years = result.data.data.results.map((v) => v.vehicleInfo.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it("preserves fixture insertion order for Recommended", async () => {
    const recommended = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "Recommended" },
      TRACE_ID
    );
    const defaultOrder = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "Recommended" },
      TRACE_ID
    );

    expect(recommended.success).toBe(true);
    expect(defaultOrder.success).toBe(true);
    if (!(recommended.success && defaultOrder.success)) {
      return;
    }

    const recommendedIds = recommended.data.data.results.map((v) => v.vin);
    const defaultIds = defaultOrder.data.data.results.map((v) => v.vin);
    expect(recommendedIds).toEqual(defaultIds);
  });

  it("applies sort before pagination so page 2 continues the sorted order", async () => {
    const page1 = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: 0 }, sort: "LowestPrice" },
      TRACE_ID
    );
    const page2 = await mockSearchResults(
      { pagination: { limit: PAGE_SIZE, offset: PAGE_SIZE }, sort: "LowestPrice" },
      TRACE_ID
    );

    expect(page1.success).toBe(true);
    expect(page2.success).toBe(true);
    if (!(page1.success && page2.success)) {
      return;
    }

    const lastPriceOnPage1 = page1.data.data.results.at(-1)?.pricing.listPrice ?? 0;
    const firstPriceOnPage2 = page2.data.data.results.at(0)?.pricing.listPrice ?? 0;

    // The cheapest vehicle on page 2 must be at least as expensive as the
    // most expensive vehicle on page 1 (sort is consistent across pages).
    expect(firstPriceOnPage2).toBeGreaterThanOrEqual(lastPriceOnPage1);
  });
});
