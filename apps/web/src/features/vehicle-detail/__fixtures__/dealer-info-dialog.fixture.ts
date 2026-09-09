import { IMAGE_BASE_URL } from "@config/images";
import type { DealerInfoData } from "../types";

// ─── Contract-shaped fixtures (DealerInfoData) ───────────────────────────────

const DEFAULTS: DealerInfoData = {
  dealerCode: "toyota-bay-ridge",
  name: "Toyota of Bay Ridge",
  rating: { value: 4.2, count: 2140 },
  address: { line1: "6401 6th Ave", city: "Brooklyn", state: "NY", zip: "11220" },
  phone: "(929) 538-3803",
  hours: {
    statusText: "Open till 8 PM",
    isOpenNow: true,
    weekly: [
      { day: "Sunday", open: "11:00 AM", close: "5:00 PM" },
      { day: "Monday", open: "9:00 AM", close: "9:00 PM" },
      { day: "Tuesday", open: "9:00 AM", close: "9:00 PM" },
      { day: "Wednesday", open: "9:00 AM", close: "9:00 PM" },
      { day: "Thursday", open: "9:00 AM", close: "9:00 PM" },
      { day: "Friday", open: "9:00 AM", close: "7:00 PM" },
      { day: "Saturday", open: "9:00 AM", close: "6:00 PM" },
    ],
  },
  images: [
    {
      type: "photo",
      url: `${IMAGE_BASE_URL}/images/dealer/dealer-1.png`,
      alt: "Toyota of Bay Ridge exterior",
    },
    {
      type: "photo",
      url: `${IMAGE_BASE_URL}/images/dealer/dealer-5.png`,
      alt: "Toyota of Bay Ridge showroom",
    },
    {
      type: "map",
      url: `${IMAGE_BASE_URL}/images/dealer/dealer-info-map-img.png`,
      alt: "Map location",
    },
    {
      type: "map-thumbnail",
      url: `${IMAGE_BASE_URL}/images/vdp/purchase-card-map.png`,
      alt: "Bay Ridge map thumbnail",
    },
  ],
  testDrive: {
    dayLabel: "Today",
    date: new Date().toISOString().slice(0, 10),
    slots: ["12:00 PM", "2:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"],
  },
};

export function generateDealerFixture(overrides?: Partial<DealerInfoData>): DealerInfoData {
  return { ...DEFAULTS, ...overrides };
}

/** AC2: Handoff-accurate primary fixture */
export const DEALER_BAY_RIDGE = generateDealerFixture();

/** AC3: Edge fixture — no rating / no reviews */
export const DEALER_NO_REVIEWS = generateDealerFixture({
  dealerCode: "dealer-no-reviews",
  rating: undefined,
});

/** AC3: Edge fixture — no photos (map only) */
export const DEALER_NO_PHOTOS = generateDealerFixture({
  dealerCode: "dealer-no-photos",
  hours: { ...DEFAULTS.hours, statusText: "Closed", isOpenNow: false },
  images: [
    {
      type: "map",
      url: `${IMAGE_BASE_URL}/images/dealer/dealer-info-map-img.png`,
      alt: "Map location",
    },
  ],
});
