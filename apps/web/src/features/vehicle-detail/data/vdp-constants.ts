/**
 * VDP constants and fallback values.
 *
 * Centralises magic strings, placeholder images, and default display values
 * used across the Vehicle Detail Page. Import from here rather than
 * hardcoding strings in components.
 */

/** Fallback hero image shown when no dealer photos exist. */
export const FALLBACK_HERO_IMAGE = "/images/vehicles/placeholder/illustrative-hero.png";

/** Default hero image for vehicles with photos. */
export const DEFAULT_HERO_IMAGE = "/images/vdp/vdp-hero.png";

/** Fallback vehicle image (generic no-image placeholder). */
export const FALLBACK_VEHICLE_IMAGE = "/images/noimage.png";

/** Placeholder label when color swatch is not available from BFF. */
export const COLOR_NOT_AVAILABLE_LABEL = "Color not available";
