// @vitest-environment node
import type { VdpComputed } from "../../contracts/vdp-response.schema";
import type { VehicleInfoExtended } from "../../contracts/vehicle-info-extended";
import { mapVehicleInfoToSpecsCategories } from "../vehicle-info-to-specs-categories.mapper";

const fullVehicleInfo: VehicleInfoExtended = {
  year: 2024,
  make: "Toyota",
  model: "Camry",
  trim: "XSE",
  engine: "2.5L I-4 cyl",
  cityMpg: 28,
  hwyMpg: 39,
  drivetrain: "FWD",
  fuelType: "Gas",
  transmission: "Automatic",
  transmissionType: "CVT",
  exteriorColor: "#1a2b3c",
  interiorColor: "#4d5e6f",
};

const fullComputed: VdpComputed = {
  horsepower: 203,
  seating: 5,
};

const VIN = "1HGCV1F34PA000001";
const STOCK_NUMBER = "STK-12345";

describe("mapVehicleInfoToSpecsCategories", () => {
  it("populates all dynamic fields when vehicleInfo and computed are fully populated", () => {
    const result = mapVehicleInfoToSpecsCategories(
      fullVehicleInfo,
      fullComputed,
      VIN,
      STOCK_NUMBER
    );

    expect(result).toHaveLength(4);

    // vehicle-details
    expect(result[0]).toEqual({
      id: "vehicle-details",
      title: "Vehicle Details",
      items: [
        { label: "VIN", value: VIN },
        { label: "Stock number", value: STOCK_NUMBER },
        { label: "Number of Keys", value: "1" },
      ],
    });

    // mechanical — uses transmissionType when available
    expect(result[1]).toEqual({
      id: "mechanical",
      title: "Mechanical",
      items: [
        { label: "Engine", value: "2.5L I-4 cyl" },
        { label: "Transmission", value: "CVT" },
        { label: "Drivetrain", value: "FWD" },
        { label: "Fuel type", value: "Gas" },
      ],
    });

    // performance
    expect(result[2]).toEqual({
      id: "performance",
      title: "Performance",
      items: [
        { label: "City / Hwy MPG", value: "28 / 39" },
        { label: "Horsepower", value: "203" },
      ],
    });

    // measurements (static)
    const measurements = result[3];
    expect(measurements?.id).toBe("measurements");
    expect(measurements?.items).toHaveLength(9);
  });

  it("omits horsepower row from performance when computed.horsepower is undefined", () => {
    const computedNoHp: VdpComputed = { seating: 5 };

    const result = mapVehicleInfoToSpecsCategories(
      fullVehicleInfo,
      computedNoHp,
      VIN,
      STOCK_NUMBER
    );

    const performance = result[2];
    expect(performance).toBeDefined();
    if (!performance) {
      return;
    }
    expect(performance.id).toBe("performance");
    expect(performance.items.find((i) => i.label === "Horsepower")).toBeUndefined();
    expect(performance.items.find((i) => i.label === "City / Hwy MPG")).toBeDefined();
  });

  it("omits MPG row from performance when cityMpg is undefined", () => {
    const vehicleNoCityMpg: VehicleInfoExtended = {
      ...fullVehicleInfo,
      cityMpg: undefined,
    };

    const result = mapVehicleInfoToSpecsCategories(
      vehicleNoCityMpg,
      fullComputed,
      VIN,
      STOCK_NUMBER
    );

    const performance = result[2];
    expect(performance).toBeDefined();
    if (!performance) {
      return;
    }
    expect(performance.items.find((i) => i.label === "City / Hwy MPG")).toBeUndefined();
    expect(performance.items.find((i) => i.label === "Horsepower")).toBeDefined();
  });

  it("omits MPG row from performance when hwyMpg is undefined", () => {
    const vehicleNoHwyMpg: VehicleInfoExtended = {
      ...fullVehicleInfo,
      hwyMpg: undefined,
    };

    const result = mapVehicleInfoToSpecsCategories(
      vehicleNoHwyMpg,
      fullComputed,
      VIN,
      STOCK_NUMBER
    );

    const performance = result[2];
    expect(performance).toBeDefined();
    if (!performance) {
      return;
    }
    expect(performance.items.find((i) => i.label === "City / Hwy MPG")).toBeUndefined();
  });

  it("always returns 4 categories in the correct order", () => {
    const minimalVehicleInfo: VehicleInfoExtended = {
      year: 2024,
      make: "Honda",
      model: "Civic",
    };
    const emptyComputed: VdpComputed = {};

    const result = mapVehicleInfoToSpecsCategories(
      minimalVehicleInfo,
      emptyComputed,
      VIN,
      STOCK_NUMBER
    );

    expect(result).toHaveLength(4);
    expect(result[0]?.id).toBe("vehicle-details");
    expect(result[1]?.id).toBe("mechanical");
    expect(result[2]?.id).toBe("performance");
    expect(result[3]?.id).toBe("measurements");
  });

  it("always includes VIN and stock number in vehicle-details", () => {
    const minimalVehicleInfo: VehicleInfoExtended = {
      year: 2024,
      make: "Honda",
      model: "Civic",
    };
    const emptyComputed: VdpComputed = {};

    const result = mapVehicleInfoToSpecsCategories(
      minimalVehicleInfo,
      emptyComputed,
      VIN,
      STOCK_NUMBER
    );

    const vehicleDetails = result[0];
    expect(vehicleDetails).toBeDefined();
    if (!vehicleDetails) {
      return;
    }
    expect(vehicleDetails.items).toContainEqual({ label: "VIN", value: VIN });
    expect(vehicleDetails.items).toContainEqual({ label: "Stock number", value: STOCK_NUMBER });
  });

  it("falls back to transmission when transmissionType is undefined", () => {
    const vehicleNoTransmissionType: VehicleInfoExtended = {
      ...fullVehicleInfo,
      transmissionType: undefined,
    };

    const result = mapVehicleInfoToSpecsCategories(
      vehicleNoTransmissionType,
      fullComputed,
      VIN,
      STOCK_NUMBER
    );

    const mechanical = result[1];
    expect(mechanical).toBeDefined();
    if (!mechanical) {
      return;
    }
    expect(mechanical.items.find((i) => i.label === "Transmission")).toEqual({
      label: "Transmission",
      value: "Automatic",
    });
  });

  it("prefers vehicleInfo.seatingCapacity over computed.seating for measurements", () => {
    const vehicleWithSeatingCapacity: VehicleInfoExtended = {
      ...fullVehicleInfo,
      seatingCapacity: 7,
    };

    const result = mapVehicleInfoToSpecsCategories(
      vehicleWithSeatingCapacity,
      fullComputed,
      VIN,
      STOCK_NUMBER
    );

    const measurements = result[3];
    expect(measurements).toBeDefined();
    if (!measurements) {
      return;
    }
    expect(measurements.items[0]).toEqual({ label: "Seating capacity", value: "7 seats" });
  });
});
