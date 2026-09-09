import type { VehicleImage } from "../types/image-gallery";

export const EXTERIOR_IMAGES_FIXTURE: VehicleImage[] = [
  {
    url: "/images/vdp/gallery/vdp-exterior-1.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior front three-quarter view",
    type: "exterior",
  },
  {
    url: "/images/vdp/gallery/vdp-exterior-2.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior rear three-quarter view",
    type: "exterior",
  },
  {
    url: "/images/vdp/gallery/vdp-exterior-3.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior side profile",
    type: "exterior",
  },
  {
    url: "/images/vdp/gallery/vdp-exterior-4.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior front view",
    type: "exterior",
  },
  {
    url: "/images/vdp/gallery/vdp-exterior-5.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior rear view",
    type: "exterior",
  },
  {
    url: "/images/vdp/gallery/vdp-exterior-6.png",
    alt: "2023 Toyota Highlander Hybrid Limited — exterior detail view",
    type: "exterior",
  },
];

export const INTERIOR_IMAGES_FIXTURE: VehicleImage[] = [
  {
    url: "/images/vdp/gallery/vdp-interior-1.png",
    alt: "2023 Toyota Highlander Hybrid Limited — interior dashboard view",
    type: "interior",
  },
  {
    url: "/images/vdp/gallery/vdp-interior-2.png",
    alt: "2023 Toyota Highlander Hybrid Limited — interior center console view",
    type: "interior",
  },
  {
    url: "/images/vdp/gallery/vdp-interior-3.png",
    alt: "2023 Toyota Highlander Hybrid Limited — interior rear seat view",
    type: "interior",
  },
  {
    url: "/images/vdp/gallery/vdp-interior-4.png",
    alt: "2023 Toyota Highlander Hybrid Limited — interior detail view",
    type: "interior",
  },
];

export const VEHICLE_IMAGES_GALLERY_FIXTURE: VehicleImage[] = [
  ...EXTERIOR_IMAGES_FIXTURE,
  ...INTERIOR_IMAGES_FIXTURE,
];

export const THREE_SIXTY_IMAGES_FIXTURE: string[] = [
  "/images/vdp/gallery/vdp-exterior-1.png",
  "/images/vdp/gallery/vdp-exterior-2.png",
  "/images/vdp/gallery/vdp-exterior-3.png",
];
