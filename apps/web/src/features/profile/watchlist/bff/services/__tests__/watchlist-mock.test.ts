// @vitest-environment node
import { WATCHLIST_VEHICLE_COUNT_COOKIE } from "@config/watchlist-vehicle-count";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WATCHLIST_ITEMS_FIXTURE } from "../../../__fixtures__/watchlist-items.fixture";
import {
  mockDeleteWatchlistItem,
  mockFetchWatchlist,
  mockPostWatchlistItem,
} from "../watchlist-mock";

const { mockCookieGet } = vi.hoisted(() => ({ mockCookieGet: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}));

function setDemoCount(value?: string) {
  mockCookieGet.mockImplementation((name: string) =>
    name === WATCHLIST_VEHICLE_COUNT_COOKIE && value !== undefined ? { value } : undefined
  );
}

let visitorCounter = 0;

function nextVisitorIdentity() {
  visitorCounter += 1;
  return {
    visitorId: `watchlist-mock-test-visitor-${visitorCounter}`,
  };
}

beforeEach(() => {
  mockCookieGet.mockReset();
  setDemoCount(undefined);
});

describe("watchlist-mock service", () => {
  it("returns seeded fixture data for default visitor", async () => {
    const result = await mockFetchWatchlist({
      visitorId: "dd07a7b4-e73c-470a-a028-4174307c7794",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toHaveLength(WATCHLIST_ITEMS_FIXTURE.length);
    expect(result.data[0]?.vin).toBe(WATCHLIST_ITEMS_FIXTURE[0]?.vin);
  });

  it("adds a new item and returns it in the fetched list", async () => {
    const identity = nextVisitorIdentity();

    const postResult = await mockPostWatchlistItem(
      {
        vin: "5TDYRKEC4TS327705",
        vehicleId: "veh-new-7705",
        title: "2026 Toyota Sienna Limited",
        price: 52_900,
      },
      identity
    );

    expect(postResult.success).toBe(true);

    const fetchResult = await mockFetchWatchlist(identity);
    expect(fetchResult.success).toBe(true);
    if (!fetchResult.success) {
      return;
    }

    expect(fetchResult.data[0]?.vin).toBe("5TDYRKEC4TS327705");
    expect(fetchResult.data[0]?.title).toBe("2026 Toyota Sienna Limited");
    expect(fetchResult.data[0]?.price).toBe(52_900);
  });

  it("updates existing VIN instead of creating duplicates", async () => {
    const identity = nextVisitorIdentity();
    const existingVin = WATCHLIST_ITEMS_FIXTURE[0]?.vin;
    expect(existingVin).toBeDefined();
    if (!existingVin) {
      return;
    }

    const before = await mockFetchWatchlist(identity);
    expect(before.success).toBe(true);
    if (!before.success) {
      return;
    }

    const initialCount = before.data.length;
    const updatedTitle = "2026 Toyota Camry Nightshade";

    const postResult = await mockPostWatchlistItem(
      {
        vin: existingVin,
        vehicleId: "veh-updated-camry-nightshade",
        title: updatedTitle,
        price: 46_300,
      },
      identity
    );

    expect(postResult.success).toBe(true);
    if (!postResult.success) {
      return;
    }

    expect(postResult.data).toHaveLength(initialCount);
    const updated = postResult.data.find((item) => item.vin === existingVin);
    expect(updated?.title).toBe(updatedTitle);
    expect(updated?.price).toBe(46_300);
    expect(updated?.vehicleId).toBe("veh-updated-camry-nightshade");
  });

  it("removes an existing VIN", async () => {
    const identity = nextVisitorIdentity();
    const vin = "JTDACAAU0R3035958";

    await mockPostWatchlistItem(
      {
        vin,
        vehicleId: "veh-remove-5958",
        title: "2024 Toyota Prius XLE",
        price: 31_200,
      },
      identity
    );

    const deleteResult = await mockDeleteWatchlistItem(vin, identity);
    expect(deleteResult.success).toBe(true);

    const fetchResult = await mockFetchWatchlist(identity);
    expect(fetchResult.success).toBe(true);
    if (!fetchResult.success) {
      return;
    }

    expect(fetchResult.data.some((item) => item.vin === vin)).toBe(false);
  });

  it("returns WATCHLIST_NOT_FOUND when deleting a non-existent VIN", async () => {
    const identity = nextVisitorIdentity();

    const deleteResult = await mockDeleteWatchlistItem("4T1DAACK8TU212803", identity);
    expect(deleteResult.success).toBe(false);
    if (deleteResult.success) {
      return;
    }

    expect(deleteResult.error.code).toBe("WATCHLIST_NOT_FOUND");
    expect(deleteResult.error.status).toBe(404);
  });
});
