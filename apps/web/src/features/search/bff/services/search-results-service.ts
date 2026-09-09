import { matchesRangeFilterKey } from "@features/search/lib/filter-keys";
import type { Vehicle } from "@shared/components/inventory-card";
import type { SmartFilter, SortOrder } from "@ucmp/sdk-search-api";
import { sortOrderEnum } from "@ucmp/sdk-search-api";
import { parseNumericFilterValue } from "../../lib/parse-numeric-filter-value";

export interface ActiveVehicleFilter {
  key: string;
  value: string;
}

const VEHICLE_FILTER_KEY_MAP = {
  drivetrain: "drivetrain",
  exteriorColorFamily: "color",
  features: "features",
  fuelType: "fuel-type",
  mileage: "mileage",
  model: "model",
  price: "price",
  transmissionType: "transmission",
  year: "year",
} as const;

export function searchFiltersToActiveVehicleFilters(filters: SmartFilter[]): ActiveVehicleFilter[] {
  return filters.flatMap((filter) => {
    const mappedKey = VEHICLE_FILTER_KEY_MAP[filter.key as keyof typeof VEHICLE_FILTER_KEY_MAP];

    if (!mappedKey) {
      return [];
    }

    if (filter.type === "Range") {
      const hasMin = typeof filter.min === "number";
      const hasMax = typeof filter.max === "number";

      if (filter.min === undefined && filter.max === undefined) {
        return [];
      }

      if (hasMin && hasMax) {
        return [{ key: mappedKey, value: `${filter.min}-${filter.max}` }];
      }

      return [{ key: mappedKey, value: String(hasMin ? filter.min : filter.max) }];
    }

    if (filter.type === "Enum" || filter.type === "MultiEnum") {
      return filter.options.map((option) => ({ key: mappedKey, value: String(option.value) }));
    }

    return [];
  });
}

export interface PaginatedData<T> {
  currentPage: number;
  data: T[];
  totalItems: number;
  totalPages: number;
}

/**
 * Client-side sorting utility for vehicle results.
 * TODO: Will be server-side in the future when we have real data and sort options from the API.
 */
export function sortVehicles(vehicles: Vehicle[], option: SortOrder): Vehicle[] {
  if (option === sortOrderEnum.Recommended) {
    return vehicles;
  }
  const sorted = [...vehicles];

  switch (option) {
    case sortOrderEnum.LowestPrice:
      return sorted.sort((a, b) => a.price - b.price);
    case sortOrderEnum.HighestPrice:
      return sorted.sort((a, b) => b.price - a.price);
    case sortOrderEnum.LowestMileage:
      return sorted.sort((a, b) => a.mileage - b.mileage);
    case sortOrderEnum.NewestYear:
      return sorted.sort((a, b) => b.year - a.year);
    default:
      return vehicles;
  }
}

function parseRangeFilterValue(value: string): { max: number | null; min: number | null } | null {
  if (!value.includes("-")) {
    return null;
  }

  const [minValue = "", maxValue = ""] = value.split("-", 2);

  return {
    min: parseNumericFilterValue(minValue),
    max: parseNumericFilterValue(maxValue),
  };
}

function applyRangeFilter(
  vehicles: Vehicle[],
  range: { max: number | null; min: number | null },
  valueSelector: (vehicle: Vehicle) => number
): Vehicle[] {
  return vehicles.filter((vehicle) => {
    const comparableValue = valueSelector(vehicle);

    if (range.min !== null && comparableValue < range.min) {
      return false;
    }

    if (range.max !== null && comparableValue > range.max) {
      return false;
    }

    return true;
  });
}

function applyMaxPriceFilter(vehicles: Vehicle[], value: string): Vehicle[] {
  const range = parseRangeFilterValue(value);

  if (range !== null) {
    return applyRangeFilter(vehicles, range, (vehicle) => vehicle.price);
  }

  const maxPrice = parseNumericFilterValue(value);
  if (maxPrice === null) {
    return vehicles;
  }

  return vehicles.filter((vehicle) => vehicle.price <= maxPrice);
}

function applyMaxMileageFilter(vehicles: Vehicle[], value: string): Vehicle[] {
  const range = parseRangeFilterValue(value);

  if (range !== null) {
    return applyRangeFilter(vehicles, range, (vehicle) => vehicle.mileage);
  }

  const maxMileage = parseNumericFilterValue(value);
  if (maxMileage === null) {
    return vehicles;
  }

  return vehicles.filter((vehicle) => vehicle.mileage <= maxMileage);
}

function applyMinYearFilter(vehicles: Vehicle[], value: string): Vehicle[] {
  const range = parseRangeFilterValue(value);

  if (range !== null) {
    return applyRangeFilter(vehicles, range, (vehicle) => vehicle.year);
  }

  const minYear = parseNumericFilterValue(value);
  if (minYear === null) {
    return vehicles;
  }

  return vehicles.filter((vehicle) => vehicle.year >= minYear);
}

function applyModelFilter(vehicles: Vehicle[], value: string): Vehicle[] {
  const targetModel = value.toLowerCase();
  return vehicles.filter(
    (vehicle) =>
      vehicle.model.toLowerCase() === targetModel ||
      (vehicle.trim?.toLowerCase() ?? "") === targetModel
  );
}

function applyVehicleFilter(vehicles: Vehicle[], filter: ActiveVehicleFilter): Vehicle[] {
  if (matchesRangeFilterKey(filter.key, "price")) {
    return applyMaxPriceFilter(vehicles, filter.value);
  }

  if (matchesRangeFilterKey(filter.key, "mileage")) {
    return applyMaxMileageFilter(vehicles, filter.value);
  }

  if (matchesRangeFilterKey(filter.key, "year")) {
    return applyMinYearFilter(vehicles, filter.value);
  }

  if (filter.key === "model" || filter.key === "models") {
    return applyModelFilter(vehicles, filter.value);
  }

  return vehicles;
}

/**
 * Client-side mock filtering for applied filters.
 * Mirrors how sort is handled in the shell until server-side filtering is added.
 */
export function filterVehiclesByActiveFilters(
  vehicles: Vehicle[],
  activeFilters: ActiveVehicleFilter[]
): Vehicle[] {
  let filteredVehicles = vehicles;

  for (const filter of activeFilters) {
    filteredVehicles = applyVehicleFilter(filteredVehicles, filter);
  }

  return filteredVehicles;
}
