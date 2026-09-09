import { normalizeImageUrl, sortMediaByFilenamePrefix } from "@shared/lib/media";
import type { CompositionV3 } from "@ucmp/vehicle-360";
import { extractGalleryCategories } from "@ucmp/vehicle-360";
import type { ImageSection, ManifestHotspot, VehicleImage } from "../../types/image-gallery";

/**
 * Maps upstream `classification` values to internal `ImageSection`.
 * Unknown values default to `"exterior"` (safe fallback — most upstream photos
 * without classification are exterior shots).
 */
const CLASSIFICATION_TO_SECTION: Record<string, ImageSection> = {
  VehicleExterior: "exterior",
  VehicleInterior: "interior",
  Detail: "detail",
  NonVehicle: "non-vehicle",
};

/**
 * Maps Car-Cutter manifest category IDs to internal `ImageSection`.
 * "others" maps to "non-vehicle" to match the existing "Other" tab label.
 */
const MANIFEST_CATEGORY_TO_SECTION: Record<string, ImageSection> = {
  exterior: "exterior",
  interior: "interior",
  detail: "detail",
  others: "non-vehicle",
};

/**
 * Resolves a photo's classification to an `ImageSection`.
 * Returns `null` for photos that should be excluded from the gallery.
 */
function resolveSection(classification?: string | null): ImageSection {
  if (!classification) {
    return "exterior";
  }
  return CLASSIFICATION_TO_SECTION[classification] ?? "exterior";
}

/**
 * Builds the ordered `VehicleImage[]` array from raw upstream `media.photos`.
 *
 * - Sorts by filename prefix (numeric digits before the first dash in the URL).
 * - Maps `classification` → `ImageSection` (exterior, interior, detail, non-vehicle).
 * - Absent/unknown classification defaults to `"exterior"`.
 * - Alt text uses a 1-based index over the included photos only.
 *
 * Extracted as a pure utility so both the BFF service and test fixtures share
 * the same mapping logic and cannot silently diverge.
 */
export function buildGalleryImages(
  photos: Array<{ url: string; displayOrder?: number | null; classification?: string | null }>,
  identity: { year: number; make: string; model: string }
): VehicleImage[] {
  const { year, make, model } = identity;
  return sortMediaByFilenamePrefix(photos).map((photo, index) => ({
    url: normalizeImageUrl(photo.url),
    alt: `${year} ${make} ${model} — photo ${index + 1}`,
    type: resolveSection(photo.classification),
  }));
}

/**
 * Extracts the `sourceId` from a Car-Cutter CDN image URL.
 *
 * Car-Cutter filenames embed the upstream `sourceId` as a 24-character hex
 * segment immediately before the `_CC_` marker, e.g.:
 *   `…/486dad5134-534438565_6a60e832e84b5331b10fa567_CC_d059dbf…_a.jpg`
 *                                      ^^^^^^^^^^^^^^^^^^^^^^^^
 *
 * Returns `null` when the URL does not match the expected pattern (e.g. a
 * non-Car-Cutter URL or a malformed filename).
 */
const SOURCE_ID_PATTERN = /_([0-9a-f]{24})_CC_/i;

export function extractSourceIdFromManifestSrc(src: string): string | null {
  const match = SOURCE_ID_PATTERN.exec(src);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Builds the ordered `VehicleImage[]` array from a Car-Cutter composition_v3 manifest.
 *
 * - Skips the "next360" category (used separately by the 360 viewer).
 * - Maps category IDs to `ImageSection` values.
 * - Converts manifest hotspot coordinates from normalized 0–1 to `ManifestHotspot`.
 * - Alt text is generated from category ID and index.
 * - When `allowedSourceIds` is provided, only items whose `sourceId` (parsed
 *   from the Car-Cutter filename) is present in the set are included. Items
 *   whose `sourceId` cannot be extracted are also excluded. Pass `undefined`
 *   to skip filtering entirely (preserves existing behaviour).
 *
 * Falls back to an empty array when the manifest has no non-360 image categories.
 */
export function buildGalleryImagesFromManifest(
  manifest: CompositionV3,
  identity: { year: number; make: string; model: string },
  allowedSourceIds?: ReadonlySet<string>
): VehicleImage[] {
  const { year, make, model } = identity;
  const categories = extractGalleryCategories(manifest);

  return categories.flatMap((category) => {
    const section = MANIFEST_CATEGORY_TO_SECTION[category.id] ?? "non-vehicle";
    const images: VehicleImage[] = [];
    let galleryIndex = 0;

    for (const item of category.items) {
      if (allowedSourceIds !== undefined) {
        const sourceId = extractSourceIdFromManifestSrc(item.src);
        if (!(sourceId && allowedSourceIds.has(sourceId))) {
          continue;
        }
      }

      const hotspots: ManifestHotspot[] | undefined =
        item.hotspots && item.hotspots.length > 0
          ? item.hotspots.map((h) => ({
              title: h.title,
              description: h.description,
              type: h.type,
              x: h.position.x,
              y: h.position.y,
            }))
          : undefined;

      images.push({
        url: item.src,
        alt: `${year} ${make} ${model} — ${category.id} photo ${galleryIndex + 1}`,
        type: section,
        hotspots,
      });
      galleryIndex++;
    }

    return images;
  });
}
