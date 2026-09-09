import type { VehicleInfo } from "@ucmp/sdk-search-api";

/**
 * Extends the SDK VehicleInfo type with color/media fields that are present in
 * the current vehicle-detail payloads but not yet represented in the SDK.
 */
export interface VehicleInfoExtended extends VehicleInfo {
  exteriorColor?: string;
  exteriorColorFamily?: string;
  interiorColor?: string;
  interiorColorFamily?: string;
  interiorMaterial?: string | null;
  interiorTextureImage?: string;
}
