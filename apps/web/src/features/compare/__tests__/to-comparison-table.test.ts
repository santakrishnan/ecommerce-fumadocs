// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { CompareVehicle } from "../__fixtures__/compare-vehicles.fixture";
import {
  COMPARE_VEHICLES_FIXTURE,
  makeCompareVehicle,
} from "../__fixtures__/compare-vehicles.fixture";
import {
  toComparisonVehicles,
  toHistoryAndConditionAttributes,
  toInteriorAndComfortAttributes,
  toPerformanceAttributes,
  toPriceAndValueAttributes,
  toSafetyAttributes,
} from "../lib/to-comparison-table";

const rav4 = COMPARE_VEHICLES_FIXTURE[0] as CompareVehicle;
const camry = COMPARE_VEHICLES_FIXTURE[1] as CompareVehicle;
const highlander = COMPARE_VEHICLES_FIXTURE[2] as CompareVehicle;
const twoVehicles: typeof COMPARE_VEHICLES_FIXTURE = [rav4, camry];
const threeVehicles: typeof COMPARE_VEHICLES_FIXTURE = [rav4, camry, highlander];

// ─── toComparisonVehicles ────────────────────────────────────────────────────

describe("toComparisonVehicles", () => {
  it("maps each vehicle to an id and name", () => {
    const result = toComparisonVehicles(twoVehicles);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: rav4.vin,
      name: `${rav4.make} ${rav4.model} ${rav4.trim}`,
    });
    expect(result[1]).toEqual({
      id: camry.vin,
      name: `${camry.make} ${camry.model} ${camry.trim}`,
    });
  });

  it("uses the VIN as the id", () => {
    const [vehicle] = toComparisonVehicles([rav4]);

    expect(vehicle?.id).toBe(rav4.vin);
  });

  it("builds the name as 'make model trim'", () => {
    const vehicle = makeCompareVehicle({ make: "Toyota", model: "Camry", trim: "XSE" });
    const [result] = toComparisonVehicles([vehicle]);

    expect(result?.name).toBe("Toyota Camry XSE");
  });

  it("returns an empty array when given no vehicles", () => {
    expect(toComparisonVehicles([])).toEqual([]);
  });

  it("preserves order for all fixture vehicles", () => {
    const result = toComparisonVehicles(COMPARE_VEHICLES_FIXTURE);

    expect(result.map((v) => v.id)).toEqual(COMPARE_VEHICLES_FIXTURE.map((v) => v.vin));
  });
});

// ─── toPriceAndValueAttributes ───────────────────────────────────────────────

describe("toPriceAndValueAttributes", () => {
  it("returns 5 attributes", () => {
    expect(toPriceAndValueAttributes(twoVehicles)).toHaveLength(5);
  });

  it("includes one cell per vehicle in each attribute", () => {
    const attributes = toPriceAndValueAttributes(threeVehicles);

    for (const attribute of attributes) {
      expect(attribute.cells).toHaveLength(3);
    }
  });

  it("formats selling price as USD currency", () => {
    const [sellingPriceAttr] = toPriceAndValueAttributes([rav4]);

    expect(sellingPriceAttr?.cells[0]?.value).toBe("$30,200");
  });

  it("formats monthly payment with '/ mo' suffix", () => {
    const attributes = toPriceAndValueAttributes([rav4]);
    const monthlyAttr = attributes.find((a) => a.id === "monthly-payment");

    expect(monthlyAttr?.cells[0]?.value).toBe("$491 / mo");
  });

  it("includes the price tag value verbatim", () => {
    const attributes = toPriceAndValueAttributes([rav4]);
    const priceTagAttr = attributes.find((a) => a.id === "price-tag");

    expect(priceTagAttr?.cells[0]?.value).toBe("Above market");
  });

  it("formats annual fuel cost estimate as USD currency", () => {
    const attributes = toPriceAndValueAttributes([rav4]);
    const fuelCostAttr = attributes.find((a) => a.id === "annual-fuel-cost");

    expect(fuelCostAttr?.cells[0]?.value).toBe("$1,480");
  });

  it("formats net cost out-of-pocket as USD currency", () => {
    const attributes = toPriceAndValueAttributes([rav4]);
    const netCostAttr = attributes.find((a) => a.id === "net-cost");

    expect(netCostAttr?.cells[0]?.value).toBe("$29,640");
  });

  it("assigns consistent cell labels across vehicles", () => {
    const [sellingPriceAttr] = toPriceAndValueAttributes(twoVehicles);

    for (const cell of sellingPriceAttr?.cells ?? []) {
      expect(cell.label).toBe("Selling price");
    }
  });

  it("uses unique ids for each attribute", () => {
    const attributes = toPriceAndValueAttributes([rav4]);
    const ids = attributes.map((a) => a.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── toPerformanceAttributes ─────────────────────────────────────────────────

describe("toPerformanceAttributes", () => {
  it("returns 4 attributes", () => {
    expect(toPerformanceAttributes(twoVehicles)).toHaveLength(4);
  });

  it("includes drivetrain value verbatim", () => {
    const [drivetrainAttr] = toPerformanceAttributes([rav4]);

    expect(drivetrainAttr?.cells[0]?.value).toBe("AWD");
  });

  it("appends 'mpg' to fuel economy", () => {
    const attributes = toPerformanceAttributes([rav4]);
    const fuelAttr = attributes.find((a) => a.id === "fuel-economy");

    expect(fuelAttr?.cells[0]?.value).toBe("41 mpg");
  });

  it("appends 'hp' to horsepower", () => {
    const attributes = toPerformanceAttributes([rav4]);
    const hpAttr = attributes.find((a) => a.id === "horsepower");

    expect(hpAttr?.cells[0]?.value).toBe("219 hp");
  });

  it("appends 'lb' to towing capacity when present", () => {
    const attributes = toPerformanceAttributes([rav4]);
    const towingAttr = attributes.find((a) => a.id === "towing-capacity");

    expect(towingAttr?.cells[0]?.value).toBe("1750 lb");
  });

  it("shows 'Not available' when towing capacity is null", () => {
    const noTowing = makeCompareVehicle({
      performance: { ...rav4.performance, towingCapacityLb: null },
    });
    const attributes = toPerformanceAttributes([noTowing]);
    const towingAttr = attributes.find((a) => a.id === "towing-capacity");

    expect(towingAttr?.cells[0]?.value).toBe("Not available");
  });

  it("includes one cell per vehicle in each attribute", () => {
    const attributes = toPerformanceAttributes(threeVehicles);

    for (const attribute of attributes) {
      expect(attribute.cells).toHaveLength(3);
    }
  });
});

// ─── toInteriorAndComfortAttributes ──────────────────────────────────────────

describe("toInteriorAndComfortAttributes", () => {
  it("returns 3 attributes", () => {
    expect(toInteriorAndComfortAttributes(twoVehicles)).toHaveLength(3);
  });

  it("converts seating capacity to a string", () => {
    const [seatingAttr] = toInteriorAndComfortAttributes([rav4]);

    expect(seatingAttr?.cells[0]?.value).toBe("5");
  });

  it("appends 'cu ft' to cargo volume when present", () => {
    const attributes = toInteriorAndComfortAttributes([rav4]);
    const cargoAttr = attributes.find((a) => a.id === "cargo-volume");

    expect(cargoAttr?.cells[0]?.value).toBe("37.6 cu ft");
  });

  it("shows 'Not available' when cargo volume is 0 (falsy)", () => {
    const noCargoVehicle = makeCompareVehicle({
      interior: { ...rav4.interior, cargoVolumeCuFt: 0 },
    });
    const attributes = toInteriorAndComfortAttributes([noCargoVehicle]);
    const cargoAttr = attributes.find((a) => a.id === "cargo-volume");

    expect(cargoAttr?.cells[0]?.value).toBe("Not available");
  });

  it("includes key equipment value verbatim", () => {
    const attributes = toInteriorAndComfortAttributes([rav4]);
    const equipmentAttr = attributes.find((a) => a.id === "key-equipment");

    expect(equipmentAttr?.cells[0]?.value).toBe(rav4.interior.keyEquipment);
  });

  it("shows 'Not available' when key equipment is empty string", () => {
    const noEquipment = makeCompareVehicle({ interior: { ...rav4.interior, keyEquipment: "" } });
    const attributes = toInteriorAndComfortAttributes([noEquipment]);
    const equipmentAttr = attributes.find((a) => a.id === "key-equipment");

    expect(equipmentAttr?.cells[0]?.value).toBe("Not available");
  });

  it("includes one cell per vehicle in each attribute", () => {
    const attributes = toInteriorAndComfortAttributes(threeVehicles);

    for (const attribute of attributes) {
      expect(attribute.cells).toHaveLength(3);
    }
  });
});

// ─── toSafetyAttributes ──────────────────────────────────────────────────────

describe("toSafetyAttributes", () => {
  it("returns 3 attributes", () => {
    expect(toSafetyAttributes(twoVehicles)).toHaveLength(3);
  });

  it("converts NHTSA stars to a string", () => {
    const [nhtsaAttr] = toSafetyAttributes([rav4]);

    expect(nhtsaAttr?.cells[0]?.value).toBe("5");
  });

  it("includes IIHS rating verbatim", () => {
    const attributes = toSafetyAttributes([rav4]);
    const iihsAttr = attributes.find((a) => a.id === "iihs-rating");

    expect(iihsAttr?.cells[0]?.value).toBe("Top Safety Pick+");
  });

  it("includes driver assistance value verbatim", () => {
    const attributes = toSafetyAttributes([rav4]);
    const driverAttr = attributes.find((a) => a.id === "driver-assistance");

    expect(driverAttr?.cells[0]?.value).toBe(rav4.safety.driverAssistance);
  });

  it("shows 'Not available' when driver assistance is empty string", () => {
    const noAssistance = makeCompareVehicle({ safety: { ...rav4.safety, driverAssistance: "" } });
    const attributes = toSafetyAttributes([noAssistance]);
    const driverAttr = attributes.find((a) => a.id === "driver-assistance");

    expect(driverAttr?.cells[0]?.value).toBe("Not available");
  });

  it("includes one cell per vehicle in each attribute", () => {
    const attributes = toSafetyAttributes(threeVehicles);

    for (const attribute of attributes) {
      expect(attribute.cells).toHaveLength(3);
    }
  });
});

// ─── toHistoryAndConditionAttributes ─────────────────────────────────────────

describe("toHistoryAndConditionAttributes", () => {
  it("returns 4 attributes", () => {
    expect(toHistoryAndConditionAttributes(twoVehicles)).toHaveLength(4);
  });

  it("includes accident history verbatim", () => {
    const [accidentAttr] = toHistoryAndConditionAttributes([rav4]);

    expect(accidentAttr?.cells[0]?.value).toBe("None reported");
  });

  it("converts owner count to a string", () => {
    const attributes = toHistoryAndConditionAttributes([rav4]);
    const ownerAttr = attributes.find((a) => a.id === "owner-count");

    expect(ownerAttr?.cells[0]?.value).toBe("1");
  });

  it("includes certification value verbatim", () => {
    const attributes = toHistoryAndConditionAttributes([rav4]);
    const certAttr = attributes.find((a) => a.id === "certification");

    expect(certAttr?.cells[0]?.value).toBe("Toyota CPO");
  });

  it("shows 'Not certified' for uncertified vehicles", () => {
    const uncertified = makeCompareVehicle({
      history: { ...rav4.history, certification: "Not certified" },
    });
    const attributes = toHistoryAndConditionAttributes([uncertified]);
    const certAttr = attributes.find((a) => a.id === "certification");

    expect(certAttr?.cells[0]?.value).toBe("Not certified");
  });

  it("converts days on lot to a string", () => {
    const attributes = toHistoryAndConditionAttributes([rav4]);
    const daysAttr = attributes.find((a) => a.id === "days-on-lot");

    expect(daysAttr?.cells[0]?.value).toBe("12");
  });

  it("includes one cell per vehicle in each attribute", () => {
    const attributes = toHistoryAndConditionAttributes(threeVehicles);

    for (const attribute of attributes) {
      expect(attribute.cells).toHaveLength(3);
    }
  });

  it("reflects multi-accident history verbatim", () => {
    const fourRunner = COMPARE_VEHICLES_FIXTURE[5] as CompareVehicle;
    const [accidentAttr] = toHistoryAndConditionAttributes([fourRunner]);

    expect(accidentAttr?.cells[0]?.value).toBe("1 minor reported");
  });
});
