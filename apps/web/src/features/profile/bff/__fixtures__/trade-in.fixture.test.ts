import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TRADE_IN_VEHICLES_FIXTURE } from "./trade-in.fixture";

const LEADING_SLASH_PATTERN = /^\/+/;
const TRADE_IN_IMAGE_PATH_PATTERN = /^\/images\/trade-in\/(sedan|suv|truck)\.png$/;

describe("TRADE_IN_VEHICLES_FIXTURE", () => {
  it("references valid image paths and existing public assets", () => {
    for (const vehicle of TRADE_IN_VEHICLES_FIXTURE) {
      expect(vehicle.imageUrl).toMatch(TRADE_IN_IMAGE_PATH_PATTERN);

      const relativeAssetPath = vehicle.imageUrl.replace(LEADING_SLASH_PATTERN, "");
      const assetPath = path.resolve(
        import.meta.dirname,
        "../../../../..",
        "public",
        relativeAssetPath
      );

      expect(existsSync(assetPath)).toBe(true);
    }
  });

  it("uses the corrected paths for the affected fixture vehicles", () => {
    const previa = TRADE_IN_VEHICLES_FIXTURE.find((vehicle) => vehicle.id === "trade-in-002");
    const corolla = TRADE_IN_VEHICLES_FIXTURE.find((vehicle) => vehicle.id === "trade-in-003");

    expect(previa?.imageUrl).toBe("/images/trade-in/truck.png");
    expect(corolla?.imageUrl).toBe("/images/trade-in/sedan.png");
  });
});
