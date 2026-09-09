import type { WatchlistItem } from "../bff/contracts/watchlist-item.schema";

interface WatchlistItemFixtureInput {
  createdAt: string;
  lastActiveAt: string;
  price: number;
  title: string;
  vehicleId: string;
  vin: string;
}

function makeWatchlistItem(input: WatchlistItemFixtureInput): WatchlistItem {
  return {
    createdAt: input.createdAt,
    lastActiveAt: input.lastActiveAt,
    price: input.price,
    title: input.title,
    updatedAt: input.lastActiveAt,
    vehicleId: input.vehicleId,
    vin: input.vin,
  };
}

/**
 * Baseline fixture for watchlist listing work.
 * Mirrors the GET /api/v1/profile/watchlist envelope data shape.
 */
export const WATCHLIST_ITEMS_FIXTURE: WatchlistItem[] = [
  makeWatchlistItem({
    createdAt: "2026-08-04T21:43:29.610Z",
    lastActiveAt: "2026-08-04T21:43:29.610Z",
    price: 44_180,
    title: "2025 Toyota Camry XSE Hybrid",
    vehicleId: "veh-camry-xse-2025-8850",
    vin: "4T1DAACK0SU158850",
  }),
  makeWatchlistItem({
    createdAt: "2026-08-04T19:28:42.743Z",
    lastActiveAt: "2026-08-04T19:28:42.743Z",
    price: 45_295,
    title: "2025 Toyota Camry XSE AWD",
    vehicleId: "veh-camry-xse-awd-9231",
    vin: "4T1DAACK9SU529231",
  }),
  makeWatchlistItem({
    createdAt: "2026-08-04T19:21:21.449Z",
    lastActiveAt: "2026-08-04T19:21:21.449Z",
    price: 43_650,
    title: "2025 Toyota Camry XLE",
    vehicleId: "veh-camry-xle-7503",
    vin: "4T1DAACK3SU647503",
  }),
  makeWatchlistItem({
    createdAt: "2026-08-04T19:21:02.571Z",
    lastActiveAt: "2026-08-04T19:21:02.571Z",
    price: 53_400,
    title: "2024 Toyota Tacoma TRD Off-Road",
    vehicleId: "veh-tacoma-trd-offroad-9070",
    vin: "3TMKB5FN8RM019070",
  }),
  makeWatchlistItem({
    createdAt: "2026-08-04T19:21:01.419Z",
    lastActiveAt: "2026-08-04T19:21:01.419Z",
    price: 41_900,
    title: "2024 Toyota Camry XSE",
    vehicleId: "veh-camry-xse-7810",
    vin: "4T1G11AK6RU907810",
  }),
  makeWatchlistItem({
    createdAt: "2026-07-31T16:06:13.812Z",
    lastActiveAt: "2026-07-31T16:06:13.812Z",
    price: 39_580,
    title: "2026 Toyota Camry SE",
    vehicleId: "veh-camry-se-8693",
    vin: "4T1DAACK9TU708693",
  }),
];

export const WATCHLIST_EMPTY_FIXTURE: WatchlistItem[] = [];

export const WATCHLIST_SINGLE_ITEM_FIXTURE: WatchlistItem[] = [
  makeWatchlistItem({
    createdAt: "2026-08-04T21:43:29.610Z",
    lastActiveAt: "2026-08-04T21:43:29.610Z",
    price: 44_180,
    title: "2025 Toyota Camry XSE Hybrid",
    vehicleId: "veh-camry-xse-2025-8850",
    vin: "4T1DAACK0SU158850",
  }),
];

const WATCHLIST_MAX_VINS = [
  "4T1DAACK0SU158850",
  "4T1DAACK9SU529231",
  "4T1DAACK3SU647503",
  "3TMKB5FN8RM019070",
  "4T1G11AK6RU907810",
  "4T1DAACK9TU708693",
  "4T1DAACK8TU250998",
  "4T1DAACKXTU316368",
  "4T1DAACK8TU335761",
  "4T1DAACK2TU903261",
  "4T1DAACKXTU777151",
  "4T1DAACK4TU323395",
  "4T1DAACK8TU212803",
  "4T1DAACK3TU235566",
  "4T1DAACK6TU714810",
  "7SVAAABA3RX036689",
  "4T1DAACK0SU171968",
  "4T1DAACK0SU616483",
  "4T1DAACK3SU549815",
  "5TDAAAB57TS145134",
] as const;

export const WATCHLIST_MAX_ITEMS_FIXTURE: WatchlistItem[] = WATCHLIST_MAX_VINS.map((vin, index) => {
  const baseDate = new Date("2026-07-31T14:47:00.000Z");
  baseDate.setMinutes(baseDate.getMinutes() - index * 3);
  const timestamp = baseDate.toISOString();

  return makeWatchlistItem({
    createdAt: timestamp,
    lastActiveAt: timestamp,
    price: 32_500 + index * 650,
    title: `202${(index % 4) + 3} Toyota Watchlist Vehicle ${index + 1}`,
    vehicleId: `veh-watchlist-max-${String(index + 1).padStart(2, "0")}`,
    vin,
  });
});

/**
 * Partial data case for UI fallback behavior.
 * - First record: no title, no vehicleId, zero price
 * - Remaining records: sparse but valid identifiers
 */
export const WATCHLIST_PARTIAL_DATA_FIXTURE: WatchlistItem[] = [
  makeWatchlistItem({
    createdAt: "2026-08-01T11:31:00.000Z",
    lastActiveAt: "2026-08-01T11:31:00.000Z",
    price: 0,
    title: "",
    vehicleId: "",
    vin: "4T1DAACK4SU158687",
  }),
  makeWatchlistItem({
    createdAt: "2026-08-01T09:15:00.000Z",
    lastActiveAt: "2026-08-01T09:15:00.000Z",
    price: 0,
    title: "2025 Toyota Camry",
    vehicleId: "veh-partial-camry-6995",
    vin: "4T1DAACK1SU646995",
  }),
  makeWatchlistItem({
    createdAt: "2026-07-23T16:09:15.093Z",
    lastActiveAt: "2026-07-23T16:09:15.093Z",
    price: 0,
    title: "",
    vehicleId: "veh-partial-prius-5958",
    vin: "JTDACAAU0R3035958",
  }),
];
