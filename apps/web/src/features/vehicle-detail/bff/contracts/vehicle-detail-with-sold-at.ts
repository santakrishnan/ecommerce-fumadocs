import type { VehicleDetail } from "@ucmp/sdk-search-api";
import type { VehicleInfoExtended } from "./vehicle-info-extended";

/**
 * Computed/derived fields returned by the upstream v360 pipeline.
 * The SDK does not yet include this type — mirrors `VehicleDataComputed`
 * from the OpenAPI spec until the SDK catches up.
 */
export interface UpstreamVehicleComputed {
  comparisonProfile?: string;
  horsepower?: number;
  seating?: number;
  [key: string]: unknown;
}

// TODO(@ucmp/sdk-search-api): Remove `computed`/`vehicleInfo` overrides once the SDK ships these fields.
export type VehicleDetailWithSoldAt = Omit<VehicleDetail, "vehicleInfo"> & {
  computed?: UpstreamVehicleComputed;
  soldAt?: string;
  vehicleInfo: VehicleInfoExtended;
};
