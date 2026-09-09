import type { ImageSection, VehicleImage } from "../../types/image-gallery";

/** Canonical ordering of image sections for gallery rendering. */
export const SECTION_ORDER: ImageSection[] = ["exterior", "interior", "detail", "non-vehicle"];

/** Human-readable labels for each section. */
export const SECTION_LABELS: Record<ImageSection, string> = {
  exterior: "Exterior",
  interior: "Interior",
  detail: "Detail",
  "non-vehicle": "Other",
};

/**
 * Groups an array of VehicleImage objects by their `type` (section),
 * maintaining the canonical order and omitting empty sections.
 *
 * @returns A tuple of [imagesBySection map, presentSections list]
 */
export function groupImagesBySection(
  images: VehicleImage[]
): [Partial<Record<VehicleImage["type"], VehicleImage[]>>, VehicleImage["type"][]] {
  const imagesBySection = SECTION_ORDER.reduce<
    Partial<Record<VehicleImage["type"], VehicleImage[]>>
  >((acc, section) => {
    const sectionImages = images.filter((img) => img.type === section);
    if (sectionImages.length > 0) {
      acc[section] = sectionImages;
    }
    return acc;
  }, {});

  const presentSections = SECTION_ORDER.filter((s) => imagesBySection[s] !== undefined);

  return [imagesBySection, presentSections];
}
