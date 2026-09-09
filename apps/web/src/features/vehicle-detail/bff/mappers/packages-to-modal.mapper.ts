import type { VehiclePackage } from "@ucmp/sdk-search-api";
import type { Package, PackageItem } from "../../types/categorized-modal";

/**
 * Maps SDK VehiclePackage[] into the UI Package shape for the categorized
 * detail modal. Returns undefined when there are no packages.
 */
export function mapVehiclePackagesToModal(packages: VehiclePackage[]): Package | undefined {
  if (packages.length === 0) {
    return;
  }

  const items: PackageItem[] = packages.map((pkg) => ({
    items: [
      {
        label: pkg.description && pkg.description.trim().length > 0 ? pkg.description : pkg.name,
      },
    ],
    packageName: `${pkg.name} includes:`,
  }));

  return {
    id: "packages",
    items,
    title: "Package",
  };
}
