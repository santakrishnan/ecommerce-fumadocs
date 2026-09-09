// @vitest-environment node
import type { VehiclePackage } from "@ucmp/sdk-search-api";
import { mapVehiclePackagesToModal } from "../packages-to-modal.mapper";

describe("mapVehiclePackagesToModal", () => {
  it("maps single package to correct Package shape", () => {
    const packages: VehiclePackage[] = [
      {
        code: "PKG-001",
        description: "Includes premium sound system and navigation",
        includedFeatures: ["sound", "nav"],
        msrp: 2500,
        name: "Technology Package",
      },
    ];

    const result = mapVehiclePackagesToModal(packages);

    expect(result).toEqual({
      id: "packages",
      items: [
        {
          items: [{ label: "Includes premium sound system and navigation" }],
          packageName: "Technology Package includes:",
        },
      ],
      title: "Package",
    });
  });

  it("maps multiple packages to Package with multiple PackageItem entries", () => {
    const packages: VehiclePackage[] = [
      {
        code: "PKG-001",
        description: "Premium sound and nav",
        includedFeatures: ["sound", "nav"],
        msrp: 2500,
        name: "Technology Package",
      },
      {
        code: "PKG-002",
        description: "Leather and heated seats",
        includedFeatures: ["leather", "heated-seats"],
        msrp: 1800,
        name: "Comfort Package",
      },
    ];

    const result = mapVehiclePackagesToModal(packages);

    expect(result).toEqual({
      id: "packages",
      items: [
        {
          items: [{ label: "Premium sound and nav" }],
          packageName: "Technology Package includes:",
        },
        {
          items: [{ label: "Leather and heated seats" }],
          packageName: "Comfort Package includes:",
        },
      ],
      title: "Package",
    });
  });

  it("returns undefined for empty array", () => {
    expect(mapVehiclePackagesToModal([])).toBeUndefined();
  });

  it("falls back to name as item label when description is empty", () => {
    const packages: VehiclePackage[] = [
      {
        code: "PKG-003",
        description: "",
        includedFeatures: [],
        msrp: 1000,
        name: "Sport Package",
      },
    ];

    const result = mapVehiclePackagesToModal(packages);

    expect(result?.items[0]?.items[0]?.label).toBe("Sport Package");
  });
});
