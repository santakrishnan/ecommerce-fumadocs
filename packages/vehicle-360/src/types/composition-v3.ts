export interface HotspotPosition {
  x: number;
  y: number;
}

export interface Hotspot {
  description?: string;
  position: HotspotPosition;
  title: string;
  type?: string;
}

export interface SpinImage {
  hotspots?: Hotspot[];
  src: string;
}

export interface Next360Item {
  images: SpinImage[];
  type: "next360";
}

/** A still-photo item from a non-360 category (exterior, interior, detail, others). */
export interface ImageItem {
  hotspots?: Hotspot[];
  src: string;
  type: "image";
}

export interface CompositionCategory {
  id: string;
  items: Array<Next360Item | ImageItem | { type: string; src?: string }>;
  title: string;
}

export interface CompositionV3 {
  aspectRatio: string;
  categories: CompositionCategory[];
  imageHdWidth: number;
  imageSubWidths: number[];
  version: number;
}

export interface Next360Manifest {
  aspectRatio: string;
  frameCount: number;
  frames: SpinImage[];
}
