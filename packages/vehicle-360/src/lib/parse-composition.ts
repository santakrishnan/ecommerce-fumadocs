import type { CompositionV3, ImageItem, Next360Manifest } from "../types/composition-v3";

export function parseAspectRatio(aspectRatio: string): number {
  const [width, height] = aspectRatio.split(":").map(Number);
  if (!(width && height)) {
    return 4 / 3;
  }
  return width / height;
}

export function extractNext360(manifest: CompositionV3): Next360Manifest | null {
  const category = manifest.categories.find((entry) => entry.id === "next360");
  if (!category) {
    return null;
  }

  const spinItem = category.items.find(
    (item): item is { type: "next360"; images: Next360Manifest["frames"] } =>
      item.type === "next360" && "images" in item && Array.isArray(item.images)
  );

  if (!spinItem?.images.length) {
    return null;
  }

  return {
    aspectRatio: manifest.aspectRatio,
    frameCount: spinItem.images.length,
    frames: spinItem.images,
  };
}

/**
 * Returns true when the manifest contains a populated next360 category.
 * Used server-side to determine whether to enable the 360 viewer.
 */
export function hasNext360(manifest: CompositionV3): boolean {
  return extractNext360(manifest) !== null;
}

/** A single still-photo item extracted from a non-360 gallery category. */
export interface GalleryCategoryItem {
  hotspots?: ImageItem["hotspots"];
  src: string;
}

/** A non-360 manifest category with its still-photo items. */
export interface GalleryCategory {
  id: string;
  items: GalleryCategoryItem[];
}

/**
 * Extracts all non-360 still-image categories from a manifest.
 * Filters out the "next360" category and items that are not of type "image".
 * Empty categories (no valid image items) are omitted.
 */
export function extractGalleryCategories(manifest: CompositionV3): GalleryCategory[] {
  return manifest.categories
    .filter((category) => category.id !== "next360")
    .map((category) => ({
      id: category.id,
      items: category.items
        .filter((item): item is ImageItem => item.type === "image" && typeof item.src === "string")
        .map((item) => ({ src: item.src, hotspots: item.hotspots })),
    }))
    .filter((cat) => cat.items.length > 0);
}

export async function fetchCompositionManifest(url: string): Promise<CompositionV3> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load manifest (${response.status})`);
  }
  return response.json() as Promise<CompositionV3>;
}
