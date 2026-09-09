/**
 * Formats the vehicle context heading used in the VDP overlay.
 * Normalizes whitespace so empty or multi-spaced model/trim values
 * produce a clean single-spaced string.
 */
export function formatVehicleHeading(model: string, trim: string): string {
  return `Toyota ${model} ${trim}`.replace(/\s+/g, " ").trim();
}
