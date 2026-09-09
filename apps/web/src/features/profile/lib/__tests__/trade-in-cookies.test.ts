import { TRADE_IN_VEHICLES_FIXTURE } from "@features/profile/bff/__fixtures__/trade-in.fixture";
import { describe, expect, it } from "vitest";
import { parseAddedVehicles, tradeInVehicleSchema } from "../trade-in-cookies";

const [validVehicle, secondVehicle] = TRADE_IN_VEHICLES_FIXTURE;

if (!(validVehicle && secondVehicle)) {
  throw new Error("The trade-in fixture must contain two vehicles for these tests.");
}

describe("tradeInVehicleSchema", () => {
  it("accepts a valid trade-in vehicle", () => {
    expect(tradeInVehicleSchema.safeParse(validVehicle).success).toBe(true);
  });

  it("rejects a vehicle with an invalid field", () => {
    const invalidVehicle = { ...validVehicle, year: "2025" };

    expect(tradeInVehicleSchema.safeParse(invalidVehicle).success).toBe(false);
  });
});

describe("parseAddedVehicles", () => {
  it("returns an ordered validated collection for valid array JSON", () => {
    expect(parseAddedVehicles(JSON.stringify([validVehicle, secondVehicle]))).toEqual([
      validVehicle,
      secondVehicle,
    ]);
  });

  it("preserves duplicate entries in a valid array", () => {
    expect(parseAddedVehicles(JSON.stringify([validVehicle, validVehicle]))).toEqual([
      validVehicle,
      validVehicle,
    ]);
  });

  it("normalizes a valid legacy single-object cookie to a one-item array", () => {
    expect(parseAddedVehicles(JSON.stringify(validVehicle))).toEqual([validVehicle]);
  });

  it("returns an empty array when the cookie is absent", () => {
    expect(parseAddedVehicles()).toEqual([]);
  });

  it("returns an empty array when the cookie is malformed JSON", () => {
    expect(parseAddedVehicles("{invalid-json")).toEqual([]);
  });

  it("returns an empty array when an array member fails schema validation", () => {
    const invalidMember = { ...validVehicle, estimatedValue: "20600" };

    expect(parseAddedVehicles(JSON.stringify([validVehicle, invalidMember]))).toEqual([]);
  });

  it("returns an empty array when the legacy object payload fails schema validation", () => {
    const invalidVehicle = { ...validVehicle, estimatedValue: "20600" };

    expect(parseAddedVehicles(JSON.stringify(invalidVehicle))).toEqual([]);
  });
});
