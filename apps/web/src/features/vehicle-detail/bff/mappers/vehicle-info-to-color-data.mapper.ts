import { isValidCssColor, isValidHexColor } from "utils";

import type { VehicleInfoExtended } from "../contracts/vehicle-info-extended";

/**
 * Sanitized color data ready for direct use in component styles.
 * `exteriorColor` / `interiorColor` are guaranteed to be valid CSS color
 * values (hex or named) or `undefined` when the API returns unusable names.
 */
export interface VehicleColorData {
  /** Valid CSS color for the exterior swatch, or undefined if not renderable. */
  exteriorColor: string | undefined;
  /** Display name for the exterior color (e.g. "Ruby Red Flare Pearl"). */
  exteriorColorFamily: string;
  /** Valid CSS color for the interior swatch, or undefined if not renderable. */
  interiorColor: string | undefined;
  /** Display name for the interior color (e.g. "Black"). */
  interiorColorFamily: string;
  /** Interior material description (e.g. "Leather", "SofTex"). */
  interiorMaterial: string;
  /** URL to a texture image used as interior swatch when hex is unavailable. */
  interiorTextureImage?: string;
}

const COLOR_NOT_AVAILABLE_LABEL = "Color not available";

/**
 * Normalize a color value for use in inline CSS.
 * Adds `#` prefix to bare hex strings; passes named colors unchanged.
 */
function normalizeColor(value: string): string {
  if (isValidHexColor(value) && !value.startsWith("#")) {
    return `#${value}`;
  }
  return value;
}

/**
 * Extract and sanitize color data from the upstream vehicleInfo payload.
 * Validates that color values are usable CSS (hex or named color) before
 * passing them through — prevents invalid multi-word names like "Cutting Edge"
 * from reaching component inline styles.
 */
export function mapVehicleInfoToColorData(
  vehicleInfo: VehicleInfoExtended | undefined
): VehicleColorData | undefined {
  if (!vehicleInfo) {
    return;
  }

  const rawExterior = vehicleInfo.exteriorColor?.trim() ?? "";
  const rawInterior = vehicleInfo.interiorColor?.trim() ?? "";

  return {
    exteriorColor:
      rawExterior && isValidCssColor(rawExterior) ? normalizeColor(rawExterior) : undefined,
    exteriorColorFamily: vehicleInfo.exteriorColorFamily ?? COLOR_NOT_AVAILABLE_LABEL,
    interiorColor:
      rawInterior && isValidCssColor(rawInterior) ? normalizeColor(rawInterior) : undefined,
    interiorColorFamily: vehicleInfo.interiorColorFamily ?? COLOR_NOT_AVAILABLE_LABEL,
    interiorMaterial: vehicleInfo.interiorMaterial ?? "",
    interiorTextureImage: vehicleInfo.interiorTextureImage,
  };
}
