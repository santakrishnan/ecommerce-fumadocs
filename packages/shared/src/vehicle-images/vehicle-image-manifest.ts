import otherMakesRaw from "./manifest/other-makes.json";
import sedansAndCarsRaw from "./manifest/sedans-and-cars.json";
import suvsRaw from "./manifest/suvs.json";
import trucksRaw from "./manifest/trucks.json";
import type { VehicleImageEntry } from "./types";

/** Normalize a JSON default import — handles both ESM (array) and CJS (wrapped) shapes. */
function unwrap(mod: unknown): VehicleImageEntry[] {
  if (Array.isArray(mod)) {
    return mod as VehicleImageEntry[];
  }
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default: VehicleImageEntry[] }).default;
  }
  return [];
}

const vehicleImageManifest: VehicleImageEntry[] = [
  ...unwrap(trucksRaw),
  ...unwrap(suvsRaw),
  ...unwrap(sedansAndCarsRaw),
  ...unwrap(otherMakesRaw),
];

export { vehicleImageManifest };
