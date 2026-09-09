export type { Vehicle360ViewerProps } from "./components/vehicle-360-viewer";
export { Vehicle360Viewer } from "./components/vehicle-360-viewer";
// ─── Parse-composition utilities ─────────────────────────────────────────────
export type { GalleryCategory, GalleryCategoryItem } from "./lib/parse-composition";
export {
  extractGalleryCategories,
  extractNext360,
  fetchCompositionManifest,
  hasNext360,
  parseAspectRatio,
} from "./lib/parse-composition";
// ─── Composition types ────────────────────────────────────────────────────────
export type {
  CompositionCategory,
  CompositionV3,
  Hotspot,
  HotspotPosition,
  ImageItem,
  Next360Item,
  Next360Manifest,
  SpinImage,
} from "./types/composition-v3";
