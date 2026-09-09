import type { VehicleSpecs } from "../../components/vehicle-specs-card";
import type { VdpComputed } from "../contracts/vdp-response.schema";
import type { VehicleInfoExtended } from "../contracts/vehicle-info-extended";

/**
 * Pure mapper — transforms VehicleInfoExtended + computed enrichments
 * into the flat VehicleSpecs shape consumed by the specs card component.
 */
export function mapVehicleInfoToSpecs(
  vehicleInfo: VehicleInfoExtended,
  computed: VdpComputed
): VehicleSpecs {
  return {
    cityMpg: vehicleInfo.cityMpg,
    drivetrain: vehicleInfo.drivetrain,
    engine: vehicleInfo.engine,
    fuelType: vehicleInfo.fuelType,
    horsepower: computed.horsepower,
    hwyMpg: vehicleInfo.hwyMpg,
    seating: vehicleInfo.seatingCapacity ?? computed.seating,
    transmissionType: vehicleInfo.transmissionType ?? vehicleInfo.transmission,
  };
}
