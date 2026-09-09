/**
 * Compare Vehicles fixtures — mock data for the profile Compare section.
 *
 * Aligned with the upstream Arrow API contract:
 *   POST /vehicles/v1/vehicles { vins: string[] }
 *
 * Data points match the Figma compare view categories:
 *   - Price & Value
 *   - Performance
 *   - Interior & Comfort
 *   - Safety
 *   - History & Condition
 *
 * @see https://www.figma.com/design/S84HaAL9hckSZcWm8k2Vk2/Handoff?node-id=11286-334331
 */

import type { CompareVehicle, CompareVehiclesRequest, CompareVehiclesResponse } from "../types";

// Re-exported for backward compatibility — the domain types now live in `../types`.
export type {
  CompareVehicle,
  CompareVehicleHistory,
  CompareVehicleInterior,
  CompareVehiclePerformance,
  CompareVehiclePricing,
  CompareVehicleSafety,
  CompareVehiclesRequest,
  CompareVehiclesResponse,
} from "../types";

// ─── Compare Categories ─────────────────────────────────────────────────────

export const COMPARE_CATEGORIES = [
  "Price & Value",
  "Performance",
  "Interior & Comfort",
  "Safety",
  "History & Condition",
] as const;

export type CompareCategory = (typeof COMPARE_CATEGORIES)[number];

// ─── VIN Constants ───────────────────────────────────────────────────────────

/** Deterministic timestamp for fixture responses (avoids snapshot flakiness). */
const FIXTURE_TIMESTAMP = "2026-08-03T12:00:00.000Z";

/**
 * 7 demo VINs for the compare fixture.
 * Includes the two known API sandbox VINs plus 5 additional Toyota vehicles.
 */
export const COMPARE_VINS = {
  /** RAV4 — from Arrow sandbox example. */
  rav4Xse2023: "3TYJDAHN7TT054674",
  /** Camry — from Arrow sandbox example. */
  camryXse2024: "4T1C11AK7PU185002",
  /** Highlander Hybrid Limited — mid-range SUV. */
  highlanderHybrid2023: "5TDKZRFH8NS112233",
  /** Tacoma TRD Pro — truck segment. */
  tacomaTrd2024: "3TMCZ5AN9PM200145",
  /** Corolla Hybrid — economy sedan. */
  corollaHybrid2024: "JTDBCRHE6PJ012345",
  /** 4Runner TRD Off-Road — large SUV, no hybrid. */
  fourRunner2023: "JTEEU5JR9P6100789",
  /** Prius Prime — plug-in hybrid. */
  priusPrime2024: "JTDKN3DU0P3123456",
} as const;

// ─── Factory ─────────────────────────────────────────────────────────────────

const COMPARE_VEHICLE_DEFAULTS: CompareVehicle = {
  vin: COMPARE_VINS.rav4Xse2023,
  year: 2023,
  make: "Toyota",
  model: "RAV4",
  trim: "XSE",
  mileage: 36_435,
  imageUrl: "/inventory-card/inventory-card1.png",
  exteriorColor: "Wind Chill Pearl",
  pricing: {
    sellingPrice: 30_200,
    monthlyPaymentEstimate: 491,
    priceTag: "Above market",
    annualFuelCostEstimate: 1480,
    netCostOutOfPocket: 29_640,
  },
  performance: {
    drivetrain: "AWD",
    fuelEconomyMpg: 41,
    horsepower: 219,
    towingCapacityLb: 1750,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 37.6,
    keyEquipment: 'Heated seats, moonroof, wireless charging, 10.5" screen',
  },
  safety: {
    nhtsaOverallStars: 5,
    iihsRating: "Top Safety Pick+",
    driverAssistance: "Pre-collision, lane departure, radar cruise, blind spot",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 1,
    certification: "Toyota CPO",
    daysOnLot: 12,
  },
};

/**
 * Factory function to generate a compare vehicle with optional overrides.
 *
 * @example
 * ```ts
 * const truck = makeCompareVehicle({ model: "Tacoma", trim: "TRD Pro" });
 * ```
 */
export function makeCompareVehicle(overrides?: Partial<CompareVehicle>): CompareVehicle {
  return {
    ...COMPARE_VEHICLE_DEFAULTS,
    ...overrides,
    pricing: { ...COMPARE_VEHICLE_DEFAULTS.pricing, ...overrides?.pricing },
    performance: {
      ...COMPARE_VEHICLE_DEFAULTS.performance,
      ...overrides?.performance,
    },
    interior: { ...COMPARE_VEHICLE_DEFAULTS.interior, ...overrides?.interior },
    safety: { ...COMPARE_VEHICLE_DEFAULTS.safety, ...overrides?.safety },
    history: { ...COMPARE_VEHICLE_DEFAULTS.history, ...overrides?.history },
  };
}

// ─── Vehicle Fixtures ────────────────────────────────────────────────────────

/** RAV4 XSE 2023 — mid-tier SUV, certified, good condition (matches defaults). */
const rav4Xse: CompareVehicle = makeCompareVehicle();

/** Camry XSE 2024 — sedan, at market price. */
const camryXse: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.camryXse2024,
  year: 2024,
  make: "Toyota",
  model: "Camry",
  trim: "XSE",
  mileage: 12_870,
  imageUrl: "/inventory-card/inventory-card2.png",
  exteriorColor: "Midnight Black Metallic",
  pricing: {
    sellingPrice: 25_800,
    monthlyPaymentEstimate: 421,
    priceTag: "At market",
    annualFuelCostEstimate: 1560,
    netCostOutOfPocket: 25_440,
  },
  performance: {
    drivetrain: "FWD",
    fuelEconomyMpg: 32,
    horsepower: 203,
    towingCapacityLb: null,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 15.1,
    keyEquipment: 'Heated seats, moonroof, wireless charging, 8" screen',
  },
  safety: {
    nhtsaOverallStars: 5,
    iihsRating: "Top Safety Pick+",
    driverAssistance: "Pre-collision, lane departure, radar cruise",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 1,
    certification: "Toyota CPO",
    daysOnLot: 34,
  },
});

/** Highlander Hybrid Limited 2023 — 3-row SUV, above market. */
const highlanderHybrid: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.highlanderHybrid2023,
  year: 2023,
  make: "Toyota",
  model: "Highlander",
  trim: "Hybrid Limited",
  mileage: 28_100,
  imageUrl: "/inventory-card/inventory-card3.png",
  exteriorColor: "Ruby Red Flare Pearl",
  pricing: {
    sellingPrice: 42_500,
    monthlyPaymentEstimate: 692,
    priceTag: "Above market",
    annualFuelCostEstimate: 1200,
    netCostOutOfPocket: 41_800,
  },
  performance: {
    drivetrain: "AWD",
    fuelEconomyMpg: 35,
    horsepower: 243,
    towingCapacityLb: 3500,
  },
  interior: {
    seatingCapacity: 8,
    cargoVolumeCuFt: 16.0,
    keyEquipment: 'Heated & ventilated seats, panoramic moonroof, JBL audio, 12.3" screen',
  },
  safety: {
    nhtsaOverallStars: 5,
    iihsRating: "Top Safety Pick+",
    driverAssistance: "Pre-collision, lane departure, radar cruise, blind spot",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 1,
    certification: "Toyota CPO",
    daysOnLot: 8,
  },
});

/** Tacoma TRD Pro 2024 — truck, high towing capacity. */
const tacomaTrd: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.tacomaTrd2024,
  year: 2024,
  make: "Toyota",
  model: "Tacoma",
  trim: "TRD Pro",
  mileage: 5200,
  imageUrl: "/inventory-card/inventory-card4.png",
  exteriorColor: "Ice Cap",
  pricing: {
    sellingPrice: 52_300,
    monthlyPaymentEstimate: 851,
    priceTag: "At market",
    annualFuelCostEstimate: 2400,
    netCostOutOfPocket: 51_900,
  },
  performance: {
    drivetrain: "4WD",
    fuelEconomyMpg: 21,
    horsepower: 326,
    towingCapacityLb: 6000,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 30.9,
    keyEquipment: 'Heated seats, 14" screen, crawl control, Multi-Terrain Monitor',
  },
  safety: {
    nhtsaOverallStars: 4,
    iihsRating: "Top Safety Pick",
    driverAssistance: "Pre-collision, lane departure, radar cruise",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 1,
    certification: "Not certified",
    daysOnLot: 5,
  },
});

/** Corolla Hybrid 2024 — economy sedan, below market (great deal). */
const corollaHybrid: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.corollaHybrid2024,
  year: 2024,
  make: "Toyota",
  model: "Corolla",
  trim: "Hybrid LE",
  mileage: 18_430,
  imageUrl: "/inventory-card/inventory-card5.png",
  exteriorColor: "Celestite Gray",
  pricing: {
    sellingPrice: 26_500,
    monthlyPaymentEstimate: 433,
    priceTag: "Below market",
    annualFuelCostEstimate: 650,
    netCostOutOfPocket: 26_160,
  },
  performance: {
    drivetrain: "FWD",
    fuelEconomyMpg: 53,
    horsepower: 138,
    towingCapacityLb: null,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 13.1,
    keyEquipment: '8" screen',
  },
  safety: {
    nhtsaOverallStars: 5,
    iihsRating: "Top Safety Pick+",
    driverAssistance: "Pre-collision, lane departure, radar cruise",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 2,
    certification: "Not certified",
    daysOnLot: 58,
  },
});

/** 4Runner TRD Off-Road 2023 — full-size SUV, 1 minor accident. */
const fourRunner: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.fourRunner2023,
  year: 2023,
  make: "Toyota",
  model: "4Runner",
  trim: "TRD Off-Road",
  mileage: 42_780,
  imageUrl: "/inventory-card/inventory-card6.png",
  exteriorColor: "Army Green",
  pricing: {
    sellingPrice: 38_900,
    monthlyPaymentEstimate: 633,
    priceTag: "Below market",
    annualFuelCostEstimate: 2650,
    netCostOutOfPocket: 38_200,
  },
  performance: {
    drivetrain: "4WD",
    fuelEconomyMpg: 17,
    horsepower: 270,
    towingCapacityLb: 5000,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 47.2,
    keyEquipment: "Crawl control, Multi-Terrain Select, sliding rear cargo deck",
  },
  safety: {
    nhtsaOverallStars: 4,
    iihsRating: "Not rated",
    driverAssistance: "Pre-collision, lane departure, radar cruise",
  },
  history: {
    accidentHistory: "1 minor reported",
    ownerCount: 2,
    certification: "Not certified",
    daysOnLot: 45,
  },
});

/** Prius Prime 2024 — plug-in hybrid, lowest fuel cost. */
const priusPrime: CompareVehicle = makeCompareVehicle({
  vin: COMPARE_VINS.priusPrime2024,
  year: 2024,
  make: "Toyota",
  model: "Prius",
  trim: "Prime XSE",
  mileage: 8920,
  imageUrl: "/inventory-card/inventory-card7.png",
  exteriorColor: "Supersonic Red",
  pricing: {
    sellingPrice: 35_400,
    monthlyPaymentEstimate: 576,
    priceTag: "At market",
    annualFuelCostEstimate: 550,
    netCostOutOfPocket: 34_800,
  },
  performance: {
    drivetrain: "FWD",
    fuelEconomyMpg: 52,
    horsepower: 220,
    towingCapacityLb: null,
  },
  interior: {
    seatingCapacity: 5,
    cargoVolumeCuFt: 20.3,
    keyEquipment: 'Heated seats, wireless charging, 12.3" screen, head-up display',
  },
  safety: {
    nhtsaOverallStars: 5,
    iihsRating: "Top Safety Pick+",
    driverAssistance: "Pre-collision, lane departure, radar cruise, blind spot",
  },
  history: {
    accidentHistory: "None reported",
    ownerCount: 1,
    certification: "Toyota CPO",
    daysOnLot: 14,
  },
});

// ─── Exports ─────────────────────────────────────────────────────────────────

/** All 7 compare vehicles indexed by VIN. */
export const COMPARE_VEHICLES_BY_VIN: Record<string, CompareVehicle> = {
  [COMPARE_VINS.rav4Xse2023]: rav4Xse,
  [COMPARE_VINS.camryXse2024]: camryXse,
  [COMPARE_VINS.highlanderHybrid2023]: highlanderHybrid,
  [COMPARE_VINS.tacomaTrd2024]: tacomaTrd,
  [COMPARE_VINS.corollaHybrid2024]: corollaHybrid,
  [COMPARE_VINS.fourRunner2023]: fourRunner,
  [COMPARE_VINS.priusPrime2024]: priusPrime,
};

/** Ordered array of all 7 compare vehicles. */
export const COMPARE_VEHICLES_FIXTURE: CompareVehicle[] = [
  rav4Xse,
  camryXse,
  highlanderHybrid,
  tacomaTrd,
  corollaHybrid,
  fourRunner,
  priusPrime,
];

/** API request fixture — all 7 VINs. */
export const COMPARE_REQUEST_FIXTURE: CompareVehiclesRequest = {
  vins: Object.values(COMPARE_VINS),
};

/**
 * Upstream API response fixture — simulates the Arrow API response.
 * Wraps vehicles in the standard envelope with metadata.
 */
export const COMPARE_VEHICLES_UPSTREAM_FIXTURE: CompareVehiclesResponse = {
  data: {
    vehicles: COMPARE_VEHICLES_FIXTURE,
    notFound: [],
  },
  meta: {
    traceId: "compare-fixture-trace-001",
    timestamp: FIXTURE_TIMESTAMP,
  },
};

/**
 * Generates an upstream response for a given set of VINs.
 * Unknown VINs are placed in the `notFound` array.
 */
export function compareVehicleResponse(vins: string[]): CompareVehiclesResponse {
  const vehicles: CompareVehicle[] = [];
  const notFound: string[] = [];

  for (const vin of vins) {
    const vehicle = COMPARE_VEHICLES_BY_VIN[vin.toUpperCase()];
    if (vehicle) {
      vehicles.push(vehicle);
    } else {
      notFound.push(vin);
    }
  }

  return {
    data: { vehicles, notFound },
    meta: {
      traceId: "compare-fixture-trace",
      timestamp: FIXTURE_TIMESTAMP,
    },
  };
}
