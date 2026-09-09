/**
 * Static definition of all filter section categories.
 * Used by both the left nav and the right content panel.
 */
export interface FilterSection {
  id: string;
  key: string;
  label: string;
}

/** The "search" entry that triggers the search input in the right panel. */
export const FILTER_SEARCH_KEY = "search";

export const FILTER_SECTIONS: FilterSection[] = [
  { id: "filter-price", key: "price", label: "Price" },
  { id: "filter-year", key: "year", label: "Year" },
  { id: "filter-mileage", key: "mileage", label: "Mileage" },
  { id: "filter-make", key: "make", label: "Make" },
  { id: "filter-model", key: "model", label: "Model" },
  { id: "filter-trim", key: "trim", label: "Trim" },
  { id: "filter-body-style", key: "body-style", label: "Body Style" },
  { id: "filter-color", key: "color", label: "Color" },
  { id: "filter-fuel-type", key: "fuel-type", label: "Fuel Type" },
  { id: "filter-drivetrain", key: "drivetrain", label: "Drivetrain" },
  { id: "filter-features", key: "features", label: "Features" },
  { id: "filter-transmission", key: "transmission", label: "Transmission" },
];
