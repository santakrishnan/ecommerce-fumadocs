// @vitest-environment node
import {
  rav4Xse,
  rav4XseNoImage,
  rav4XseNoTrim,
} from "@features/compare/__fixtures__/compare-vehicle";
import { describe, expect, it } from "vitest";

import { composeVehicleAlt, composeVehicleTitle, toVehicleCardProps } from "../vehicle-card.lib";

describe("composeVehicleTitle", () => {
  it("returns make/model/trim joined by space", () => {
    expect(composeVehicleTitle(rav4Xse)).toBe("TOYOTA RAV4 XSE");
  });

  it("skips undefined trim", () => {
    expect(composeVehicleTitle(rav4XseNoTrim)).toBe("TOYOTA RAV4");
  });

  it("skips empty string trim", () => {
    const vehicle = { ...rav4Xse, trim: "" };
    expect(composeVehicleTitle(vehicle)).toBe("TOYOTA RAV4");
  });
});

describe("composeVehicleAlt", () => {
  it("returns year/make/model/trim joined by space", () => {
    expect(composeVehicleAlt(rav4Xse)).toBe("2023 TOYOTA RAV4 XSE");
  });

  it("skips undefined trim", () => {
    expect(composeVehicleAlt(rav4XseNoTrim)).toBe("2023 TOYOTA RAV4");
  });
});

describe("toVehicleCardProps", () => {
  it("returns the correct shape with all fields", () => {
    const props = toVehicleCardProps(rav4Xse);

    expect(props).toStrictEqual({
      title: "TOYOTA RAV4 XSE",
      imageAlt: "2023 TOYOTA RAV4 XSE",
      imageSrc: "/compare-card/compare-card-01.png",
      year: 2023,
      mileage: 36_435,
    });
  });

  it("returns fallback imageSrc when imageUrl is empty", () => {
    const props = toVehicleCardProps(rav4XseNoImage);

    expect(props.imageSrc).toBe("/inventory-card/inventory-card1.png");
  });
});
