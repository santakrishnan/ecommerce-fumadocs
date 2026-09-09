import "server-only";

import { resolveVehicleImage } from "@ucmp/shared/vehicle-images";
import { isValidImageUrl, USE_STOCK_IMAGES } from "../../lib/card-mappers/stock-image-config";

export interface ResolveCardImageInput {
  /** Image URL from the API response. */
  apiImage: string | undefined;
  /**
   * Body type hint for intelligent fallback (e.g. "truck", "suv", "sedan").
   * Derived from card title, search context, or model classification.
   */
  bodyType?: string;
  /** Exterior color. */
  color?: string;
  /** Vehicle make (defaults to "Toyota"). */
  make?: string;
  /** Vehicle model (e.g. "Tacoma", "Camry"). */
  model?: string;
  /** Trim level. */
  trim?: string;
  /** Model year. */
  year?: number;
}

/**
 * Resolves the final image URL for a conversational search agent card.
 *
 * Applied at the BFF layer (server-side) before cards reach the client.
 * Both the v1 and v2 flows use this via `agent-card.mapper.ts`:
 *
 * - USE_STOCK_IMAGES="always"   → always return stock image, ignore API URL.
 * - USE_STOCK_IMAGES="fallback" → use API image if valid, stock if empty/invalid.
 * - USE_STOCK_IMAGES="none"     → pass through API image as-is.
 */
export function resolveCardImage(input: ResolveCardImageInput): string | undefined {
  const { apiImage, make = "Toyota", model, year, trim, color, bodyType } = input;

  const stockImage = resolveVehicleImage({
    bodyType,
    color,
    make,
    model: model ?? "",
    trim,
    year,
  });

  if (USE_STOCK_IMAGES === "always") {
    return stockImage;
  }

  if (USE_STOCK_IMAGES === "fallback") {
    return isValidImageUrl(apiImage) ? apiImage : stockImage;
  }

  // "none" — pass through whatever the API sent
  return apiImage;
}
