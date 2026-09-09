import type { VehicleSpecs } from "../components/vehicle-specs-card";

/**
 * VDP vehicle specs fixtures.
 *
 * Covers Carfax, warranty, and key features data for the specs section.
 */

export interface CarfaxData {
  accidentFree: boolean;
  ownerCount: number;
  reportUrl: string;
}

export interface WarrantyData {
  expiration: string;
  type: string;
}

export interface VehicleSpecsData {
  carfax: CarfaxData;
  cityMpg: number;
  drivetrain: string;
  engine: string;
  features: string[];
  fuelType: string;
  horsepower: number;
  hwyMpg: number;
  seating: number;
  transmissionType: string;
  warranty: WarrantyData;
}

const ALL_FEATURES = [
  "Power Tailgate",
  "Android Auto",
  "Apple CarPlay",
  "Lane Tracking Assist",
  "Adaptive Cruise Control",
  "Rear View Camera",
  "Lane Departure Warning",
  "Alloy Wheels",
  "Keyless Entry",
  "LED Daytime Running Lights",
  "Electronic Stability Control",
];

/** Full specs — all features visible */
export const SPECS_FIXTURE_FULL: VehicleSpecsData = {
  carfax: {
    reportUrl: "https://www.carfax.com/vehicle/1234567890ABCDEFG",
    accidentFree: true,
    ownerCount: 1,
  },
  warranty: {
    type: "Toyota Certified Powertrain",
    expiration: "12/2026 or 100,000 mi",
  },
  features: ALL_FEATURES,
  drivetrain: "AWD",
  cityMpg: 35,
  hwyMpg: 34,
  seating: 7,
  transmissionType: "Automatic",
  engine: "I-4 cyl",
  horsepower: 295,
  fuelType: "Hybrid",
};

/** Minimal specs — no features listed */
export const SPECS_FIXTURE_MINIMAL: VehicleSpecsData = {
  carfax: {
    reportUrl: "https://www.carfax.com/vehicle/MINI567890ABCDEFG",
    accidentFree: true,
    ownerCount: 2,
  },
  warranty: {
    type: "Standard Powertrain",
    expiration: "06/2025 or 60,000 mi",
  },
  features: [],
  drivetrain: "FWD",
  cityMpg: 28,
  hwyMpg: 32,
  seating: 5,
  transmissionType: "Automatic",
  engine: "I-4 cyl",
  horsepower: 203,
  fuelType: "Gas",
};

/** Partial specs — few features */
export const SPECS_FIXTURE_FEW: VehicleSpecsData = {
  carfax: {
    reportUrl: "https://www.carfax.com/vehicle/SLVR567890ABCDEFG",
    accidentFree: false,
    ownerCount: 2,
  },
  warranty: {
    type: "Toyota Certified Limited",
    expiration: "03/2026 or 80,000 mi",
  },
  features: ALL_FEATURES.slice(0, 4),
  drivetrain: "AWD",
  cityMpg: 35,
  hwyMpg: 34,
  seating: 7,
  transmissionType: "Automatic",
  engine: "I-4 cyl",
  horsepower: 295,
  fuelType: "Hybrid",
};

/**
 * Helper: extract VehicleSpecs from VehicleSpecsData for VehicleSpecsCard.
 */
export function toVehicleSpecs(data: VehicleSpecsData): VehicleSpecs {
  return {
    drivetrain: data.drivetrain,
    cityMpg: data.cityMpg,
    hwyMpg: data.hwyMpg,
    seating: data.seating,
    transmissionType: data.transmissionType,
    engine: data.engine,
    horsepower: data.horsepower,
    fuelType: data.fuelType,
  };
}

/**
 * Get feature list sliced by feature count flag value.
 *
 * @param allFeatures - Full feature list from fixture
 * @param featureCount - Flag value: "none" | "1" | "2" | "3"
 * @returns Sliced feature array
 */
export function getVisibleFeatures(
  allFeatures: string[],
  featureCount: "none" | "1" | "2" | "3"
): string[] {
  switch (featureCount) {
    case "none":
      return [];
    case "1":
      return allFeatures.slice(0, 4);
    case "2":
      return allFeatures.slice(0, 7);
    case "3":
      return allFeatures;
    default:
      return [];
  }
}
