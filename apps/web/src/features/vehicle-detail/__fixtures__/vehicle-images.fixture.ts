/**
 * VDP vehicle image fixtures.
 *
 * Provides deterministic image data for the detail page cards.
 * Maps placeholder images from public/images/vehicles/placeholder/.
 */

export interface VehicleImages {
  /** Primary exterior shot */
  exterior: { imageUrl: string; label: string; subLabel?: string; badge?: string };
  /** Primary interior shot */
  interior: { imageUrl: string; label: string; subLabel?: string; badge?: string };
  /** Wheel close-up */
  wheels: { imageUrl: string; label: string; subLabel?: string; badge?: string };
}

/** Default vehicle images using placeholder assets */
export const VEHICLE_IMAGES_FIXTURE: VehicleImages = {
  exterior: {
    imageUrl: "/images/vehicles/placeholder/exterior.png",
    label: "Midnight Black Metallic",
    subLabel: "Exterior color",
  },
  interior: {
    imageUrl: "/images/vehicles/placeholder/interior.png",
    label: "Black",
    subLabel: "Interior",
  },
  wheels: {
    imageUrl: "/images/vehicles/placeholder/wheels.png",
    label: '20" Alloy',
    subLabel: "Wheels",
  },
};
