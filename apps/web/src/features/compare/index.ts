/**
 * Compare feature — public surface.
 *
 * Re-exports public components for the Compare section:
 * - VehicleSelector / VehicleSelectorList: dropdown vehicle switcher
 * - VehicleSelectorCarousel: carousel wrapper with selection state
 * - CompareSection: client orchestrator wiring selection → comparison tables
 * - ComparisonTableSection: comparison data table
 *
 * Everything else in the feature (sub-views, toggle, helpers, fixtures) is
 * internal and must not be imported across the feature boundary.
 */

export { COMPARE_SECTIONS } from "./__fixtures__/compare-sections.fixture";
export {
  CompareNavigation,
  type CompareNavigationProps,
  type CompareNavigationSection,
} from "./components/compare-navigation";
export {
  type CompareCategoryKey,
  type CompareComparisonSection,
  CompareSection,
  type CompareSectionProps,
} from "./components/compare-section";
export {
  CompareStructuredData,
  toVehicleJsonLd,
  type VehicleJsonLd,
  type VehicleJsonLdOffer,
} from "./components/compare-structured-data";

export {
  type ComparisonTableDensity,
  ComparisonTableSection,
  type ComparisonTableSectionProps,
  type ComparisonTableSectionSlotClasses,
} from "./components/comparison-table-section";
export {
  VehicleSelector,
  VehicleSelectorList,
} from "./components/vehicle-selector/vehicle-selector";
export {
  VehicleSelectorCarousel,
  type VehicleSelectorCarouselProps,
} from "./components/vehicle-selector/vehicle-selector-carousel";
export {
  buildCompareDescription,
  buildCompareTitle,
  toVehicleLabel,
} from "./lib/compare-metadata";
export {
  toComparisonVehicles,
  toHistoryAndConditionAttributes,
  toInteriorAndComfortAttributes,
  toPerformanceAttributes,
  toPriceAndValueAttributes,
  toSafetyAttributes,
} from "./lib/to-comparison-table";
export type { ComparisonAttribute, ComparisonCell, ComparisonVehicle } from "./types";
