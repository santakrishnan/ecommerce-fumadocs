/**
 * Vehicle Detail (VDP) domain types for the Purchase card.
 *
 * The card composes **two independent sources** (see the Purchase Card epic):
 *  - `VehicleSummary` — header facts from the Inventory/VDP vehicle response.
 *  - `Origination`    — payment / prequal state from the Origination API.
 *
 * These are intentionally lightweight (no Zod yet); contracts get added when the
 * real backends land.
 */

export interface DealerSummary {
  /** Street line — NOT in the vehicle response today (gap); mocked for now. */
  addressLine1?: string;
  city: string;
  dealerCode: string;
  name: string;
  state: string;
  zip: string;
}

export interface VehicleSummary {
  /** "Below market" valuation signal — a separate source (mocked here). */
  belowMarket?: boolean;
  dealer: DealerSummary;
  /** Local image path (shared with the inventory card for the morph). */
  imageUrl: string;
  /** Struck-through "was" price. */
  listPrice: number;
  make: string;
  mileage: number;
  model: string;
  /** Sale price shown prominently. */
  sellingPrice: number;
  /** ISO date, present when `status === "sold"`. */
  soldAt?: string;
  status: "active" | "sold";
  stockNumber: string;
  trim: string;
  vehicleId: number;
  vin: string;
  year: number;
}

/**
 * Payment / prequal state. Discriminated on `kind`:
 *  - `none`     → S1 Default      ("Get pre-approved")
 *  - `estimate` → S2 Estimated    ("Get pre-approved")
 *  - `offer`    → S3 Active offer  ("Continue purchase")
 *  - `expired`  → S4 Expired       ("Restart purchase")
 */
export type Origination =
  | { kind: "none" }
  | { kind: "estimate"; estimatedMonthly: number; downPayment: number }
  | { kind: "offer"; monthly: number; apr: number; termMonths: number; expiresAt: string }
  | { kind: "expired" };

export type OriginationKind = Origination["kind"];

/** Merged data the Purchase card consumes. Sold-ness comes from `vehicle.status`. */
export interface PurchaseCardData {
  origination: Origination;
  vehicle: VehicleSummary;
}

/** A single day's operating hours */
export interface DealerHoursEntry {
  close: string | null;
  day: string;
  open: string | null;
}

/** Full dealer information displayed in the DealerInfoDialog */
export interface DealerInfo {
  address: string;
  hours: DealerHoursEntry[];
  mapThumbnailUrl: string;
  name: string;
  phone: string;
  photos: string[];
  rating: number;
  reviewCount: number;
}

/** Image entry for dealer gallery (photo or map) */
export interface DealerImage {
  alt?: string;
  type: "photo" | "map" | "map-thumbnail";
  url: string;
}

/** Contract-shaped dealer info for deterministic rendering */
export interface DealerInfoData {
  address: { line1: string; city: string; state: string; zip: string };
  dealerCode: string;
  hours: {
    statusText: string;
    isOpenNow: boolean;
    weekly: DealerHoursEntry[];
  };
  images: DealerImage[];
  name: string;
  phone?: string;
  rating?: { value: number; count: number };
  /** Test drive scheduling availability. */
  testDrive?: {
    dayLabel: string;
    date: string;
    slots: string[];
  } | null;
}

/** Upstream pricing-card data consumed by the PriceComparison card. */
export interface PriceComparisonData {
  amountBelowMarketValue: number;
  averagePrice: number;
  marketValuePercentage: number;
  nearbyComparedVehiclesCount: number;
  priceRangeEnd: number;
  priceRangeStart: number;
  thisCarPrice: number;
  valueDirection: "above" | "below";
}
