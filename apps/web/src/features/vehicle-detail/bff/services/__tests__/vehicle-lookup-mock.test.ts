// @vitest-environment node
import {
  VDP_VEHICLES_BY_VIN,
  VDP_VINS,
} from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { describe, expect, it } from "vitest";
import { mockVehicleLookup } from "../vehicle-lookup-mock";

describe("mockVehicleLookup", () => {
  it("returns the registered fixture for a known VIN", async () => {
    const result = await mockVehicleLookup(VDP_VINS.highlanderDefault);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderDefault]);
    }
  });

  it("is case-insensitive for known VINs", async () => {
    const result = await mockVehicleLookup(VDP_VINS.highlanderDefault.toLowerCase());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderDefault]);
    }
  });

  it("falls back to the default Highlander fixture for an unknown VIN", async () => {
    const unknownVin = "1MFCK000000000099";
    const result = await mockVehicleLookup(unknownVin);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vin).toBe(unknownVin.toUpperCase());
      // Should have the same vehicle data as the default fixture (minus vin)
      const defaultFixture = VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderDefault];
      expect(defaultFixture).toBeDefined();
      expect(result.data.vehicleInfo.make).toBe(defaultFixture?.vehicleInfo.make);
      expect(result.data.vehicleInfo.model).toBe(defaultFixture?.vehicleInfo.model);
      expect(result.data.pricing.listPrice).toBe(defaultFixture?.pricing.listPrice);
    }
  });

  it("returns the unknown VIN uppercased on the fallback data", async () => {
    const unknownVin = "1mfck000000000042";
    const result = await mockVehicleLookup(unknownVin);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vin).toBe("1MFCK000000000042");
    }
  });
});
