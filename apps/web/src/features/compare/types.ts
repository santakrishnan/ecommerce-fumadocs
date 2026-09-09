// ─── Comparison Table View Types ──────────────────────────────────────────────

interface ComparisonVehicle {
  id: string;
  name: string;
}

interface ComparisonCell {
  label: string;
  value: string;
}

interface ComparisonAttribute {
  cells: ComparisonCell[];
  id: string;
}

// ─── Compare Domain Types ─────────────────────────────────────────────────────
// Aligned with the upstream Arrow API contract:
//   POST /vehicles/v1/vehicles { vins: string[] }

interface CompareVehiclePricing {
  /** Estimated annual fuel cost in dollars. */
  annualFuelCostEstimate: number;
  /** Estimated monthly payment in dollars. */
  monthlyPaymentEstimate: number;
  /** Net out-of-pocket cost after incentives/trade-in. */
  netCostOutOfPocket: number;
  /** Market position: above, at, or below market value. */
  priceTag: "Above market" | "At market" | "Below market";
  /** Dealer selling price in dollars. */
  sellingPrice: number;
}

interface CompareVehiclePerformance {
  /** e.g. "AWD", "FWD", "RWD", "4WD" */
  drivetrain: string;
  /** Combined or city/hwy fuel economy in MPG. */
  fuelEconomyMpg: number;
  /** Engine horsepower. */
  horsepower: number;
  /** Towing capacity in pounds, or null if not available. */
  towingCapacityLb: number | null;
}

interface CompareVehicleInterior {
  /** Cargo volume in cubic feet. */
  cargoVolumeCuFt: number;
  /** Comma-separated key equipment summary. */
  keyEquipment: string;
  /** Number of passenger seats. */
  seatingCapacity: number;
}

interface CompareVehicleSafety {
  /** Comma-separated driver-assistance feature summary. */
  driverAssistance: string;
  /** IIHS rating label. */
  iihsRating: "Top Safety Pick+" | "Top Safety Pick" | "Not rated";
  /** NHTSA overall rating (1–5 stars). */
  nhtsaOverallStars: number;
}

interface CompareVehicleHistory {
  /** Accident history summary. */
  accidentHistory: "None reported" | `${number} minor reported` | `${number} reported`;
  /** Certification status. */
  certification: "Toyota CPO" | "Not certified";
  /** Days on dealer lot. */
  daysOnLot: number;
  /** Number of previous owners. */
  ownerCount: number;
}

interface CompareVehicle {
  /** Exterior color display name. */
  exteriorColor: string;
  /** Category: History & Condition */
  history: CompareVehicleHistory;
  /** Hero/thumbnail image URL. */
  imageUrl: string;
  /** Category: Interior & Comfort */
  interior: CompareVehicleInterior;
  /** Vehicle make (e.g. "Toyota"). */
  make: string;
  /** Odometer reading in miles. */
  mileage: number;
  /** Vehicle model (e.g. "RAV4"). */
  model: string;
  /** Category: Performance */
  performance: CompareVehiclePerformance;
  /** Category: Price & Value */
  pricing: CompareVehiclePricing;
  /** Category: Safety */
  safety: CompareVehicleSafety;
  /** Vehicle trim (e.g. "XSE"). */
  trim: string;
  /** 17-character VIN (ISO-3779). */
  vin: string;
  /** Year of the vehicle. */
  year: number;
}

/** Upstream API response envelope for vehicle comparison. */
interface CompareVehiclesResponse {
  data: {
    vehicles: CompareVehicle[];
    notFound: string[];
  };
  meta: {
    traceId: string;
    timestamp: string;
  };
}

/** API request body shape. */
interface CompareVehiclesRequest {
  vins: string[];
}

export type {
  CompareVehicle,
  CompareVehicleHistory,
  CompareVehicleInterior,
  CompareVehiclePerformance,
  CompareVehiclePricing,
  CompareVehicleSafety,
  CompareVehiclesRequest,
  CompareVehiclesResponse,
  ComparisonAttribute,
  ComparisonCell,
  ComparisonVehicle,
};
