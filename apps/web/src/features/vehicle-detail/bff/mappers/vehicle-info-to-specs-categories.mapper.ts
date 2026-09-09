import type { Category } from "../../types/categorized-modal";
import type { VdpComputed } from "../contracts/vdp-response.schema";
import type { VehicleInfoExtended } from "../contracts/vehicle-info-extended";

const STATIC_MEASUREMENTS: Category = {
  id: "measurements",
  title: "Measurements",
  items: [
    { label: "Seating capacity", value: "5 seats" },
    { label: "Seat headroom", value: "120 cm" },
    { label: "Front legroom", value: "43 in" },
    { label: "Front console", value: "84.3/1" },
    { label: "Shoulder distance", value: "3 in" },
    { label: "Overall length", value: "184.3 in" },
    { label: "Overall width", value: "75 in" },
    { label: "Overall height", value: "60.1 in" },
    { label: "Wheelbase", value: "114.2 in" },
  ],
};

/**
 * Pure mapper — transforms VehicleInfoExtended + computed enrichments into
 * the categorized specs array consumed by the specs modal component.
 *
 * Returns exactly 4 categories in order:
 * vehicle-details, mechanical, performance, measurements.
 *
 * Items whose value is undefined or empty are omitted from their category.
 */
export function mapVehicleInfoToSpecsCategories(
  vehicleInfo: VehicleInfoExtended,
  computed: VdpComputed,
  vin: string,
  stockNumber: string
): Category[] {
  const vehicleDetails: Category = {
    id: "vehicle-details",
    title: "Vehicle Details",
    items: [
      { label: "VIN", value: vin },
      { label: "Stock number", value: stockNumber },
      { label: "Number of Keys", value: "1" },
    ],
  };

  const transmissionValue = vehicleInfo.transmissionType ?? vehicleInfo.transmission;

  const mechanicalItems = [
    vehicleInfo.engine ? { label: "Engine", value: vehicleInfo.engine } : undefined,
    transmissionValue ? { label: "Transmission", value: transmissionValue } : undefined,
    vehicleInfo.drivetrain ? { label: "Drivetrain", value: vehicleInfo.drivetrain } : undefined,
    vehicleInfo.fuelType ? { label: "Fuel type", value: vehicleInfo.fuelType } : undefined,
  ].filter((item): item is NonNullable<typeof item> => item !== undefined);

  const mechanical: Category = {
    id: "mechanical",
    title: "Mechanical",
    items: mechanicalItems,
  };

  const performanceItems = [
    vehicleInfo.cityMpg !== undefined && vehicleInfo.hwyMpg !== undefined
      ? { label: "City / Hwy MPG", value: `${vehicleInfo.cityMpg} / ${vehicleInfo.hwyMpg}` }
      : undefined,
    computed.horsepower === undefined
      ? undefined
      : { label: "Horsepower", value: String(computed.horsepower) },
  ].filter((item): item is NonNullable<typeof item> => item !== undefined);

  const performance: Category = {
    id: "performance",
    title: "Performance",
    items: performanceItems,
  };

  const seatingCapacityValue = vehicleInfo.seatingCapacity ?? computed.seating;
  const seatingCapacity =
    seatingCapacityValue === undefined
      ? STATIC_MEASUREMENTS.items[0]?.value
      : `${seatingCapacityValue} seats`;
  const seatingItem = STATIC_MEASUREMENTS.items[0] ?? {
    label: "Seating capacity",
    value: "5 seats",
  };

  const measurements: Category = {
    ...STATIC_MEASUREMENTS,
    items: [
      { ...seatingItem, value: seatingCapacity ?? "5 seats" },
      ...STATIC_MEASUREMENTS.items.slice(1),
    ],
  };

  return [vehicleDetails, mechanical, performance, measurements];
}
