// @vitest-environment node
import type { VdpComputed } from "@features/vehicle-detail/bff/contracts/vdp-response.schema";
import type { VehicleInfoExtended } from "@features/vehicle-detail/bff/contracts/vehicle-info-extended";
import { mapVehicleInfoToSpecs } from "../vehicle-info-to-specs.mapper";

const fullVehicleInfo: VehicleInfoExtended = {
  year: 2024,
  make: "Toyota",
  model: "Camry",
  trim: "XSE",
  engine: "I-4 cyl",
  cityMpg: 28,
  hwyMpg: 39,
  drivetrain: "FWD",
  fuelType: "Gas",
  transmissionType: "CVT",
  exteriorColor: "#1a2b3c",
  interiorColor: "#4d5e6f",
};

const fullComputed: VdpComputed = {
  horsepower: 203,
  seating: 5,
};

describe("mapVehicleInfoToSpecs", () => {
  it("maps all spec fields when vehicleInfo and computed are fully populated", () => {
    const result = mapVehicleInfoToSpecs(fullVehicleInfo, fullComputed);

    expect(result).toEqual({
      cityMpg: 28,
      drivetrain: "FWD",
      engine: "I-4 cyl",
      fuelType: "Gas",
      horsepower: 203,
      hwyMpg: 39,
      seating: 5,
      transmissionType: "CVT",
    });
  });

  it("falls back to transmission when transmissionType is undefined", () => {
    const vehicleInfoWithoutTransmissionType: VehicleInfoExtended = {
      ...fullVehicleInfo,
      transmissionType: undefined,
      transmission: "Automatic",
    };

    const result = mapVehicleInfoToSpecs(vehicleInfoWithoutTransmissionType, fullComputed);

    expect(result.transmissionType).toBe("Automatic");
  });

  it("returns undefined for seating and horsepower when computed fields are missing", () => {
    const emptyComputed: VdpComputed = {};

    const result = mapVehicleInfoToSpecs(fullVehicleInfo, emptyComputed);

    expect(result.seating).toBeUndefined();
    expect(result.horsepower).toBeUndefined();
    expect(result.cityMpg).toBe(28);
    expect(result.drivetrain).toBe("FWD");
  });

  it("returns undefined for optional spec fields when vehicleInfo is minimal", () => {
    const minimalVehicleInfo: VehicleInfoExtended = {
      year: 2024,
      make: "Honda",
      model: "Civic",
    };
    const emptyComputed: VdpComputed = {};

    const result = mapVehicleInfoToSpecs(minimalVehicleInfo, emptyComputed);

    expect(result).toEqual({
      cityMpg: undefined,
      drivetrain: undefined,
      engine: undefined,
      fuelType: undefined,
      horsepower: undefined,
      hwyMpg: undefined,
      seating: undefined,
      transmissionType: undefined,
    });
  });
});
