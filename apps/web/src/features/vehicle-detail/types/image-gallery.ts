export interface VehicleImage {
  alt: string;
  hotspots?: ManifestHotspot[];
  type: ImageSection;
  url: string;
}

export type ImageSection = "exterior" | "interior" | "detail" | "non-vehicle";

export interface HotspotData {
  label: string;
  section: ImageSection;
  x: number;
  y: number;
}

/**
 * A hotspot extracted from the Car-Cutter composition_v3 manifest.
 * Coordinates are normalized 0–1 (directly from the manifest position field).
 */
export interface ManifestHotspot {
  description?: string;
  title: string;
  type?: string;
  x: number;
  y: number;
}
