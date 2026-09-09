import type { FiltersResponse, SelectedContextFilter } from "../contracts/filters-response.schema";

/**
 * Raw upstream response fixture — mirrors the shape returned by the upstream filters API.
 * Must stay in sync with FILTERS_SUCCESS_FIXTURE (mapper is a direct pass-through).
 */
export const FILTERS_UPSTREAM_FIXTURE = {
  data: {
    filters: [
      {
        key: "make",
        label: "Make",
        type: "MultiEnum",
        options: [
          { value: "Toyota", count: 312 },
          { value: "Honda", count: 278 },
          { value: "Ford", count: 201 },
          { value: "Chevrolet", count: 189 },
          { value: "Nissan", count: 156 },
          { value: "BMW", count: 134 },
          { value: "Mercedes-Benz", count: 121 },
          { value: "Hyundai", count: 118 },
          { value: "Kia", count: 97 },
          { value: "Subaru", count: 84 },
        ],
      },
      {
        key: "model",
        label: "Model",
        type: "MultiEnum",
        options: [
          { value: "RAV4 Hybrid", count: 124 },
          { value: "CR-V Hybrid", count: 89 },
          { value: "F-150", count: 76 },
          { value: "Camry", count: 68 },
          { value: "Civic", count: 64 },
          { value: "Silverado 1500", count: 61 },
          { value: "Tucson Hybrid", count: 55 },
          { value: "Outback", count: 48 },
        ],
      },
      {
        key: "year",
        label: "Year",
        type: "Range",
        min: 2018,
        max: 2025,
      },
      {
        key: "price",
        label: "Price",
        type: "Range",
        min: 8500,
        max: 89_900,
      },
      {
        key: "mileage",
        label: "Mileage",
        type: "Range",
        min: 0,
        max: 148_000,
      },
      {
        key: "bodyStyle",
        label: "Body Style",
        type: "MultiEnum",
        options: [
          { value: "SUV", label: "SUV / Crossover", count: 445 },
          { value: "Sedan", count: 289 },
          { value: "Truck", count: 178 },
          { value: "Hatchback", count: 112 },
          { value: "Minivan", count: 67 },
          { value: "Coupe", count: 54 },
          { value: "Convertible", count: 31 },
          { value: "Wagon", count: 24 },
        ],
      },
      {
        key: "powertrainType",
        label: "Powertrain",
        type: "MultiEnum",
        options: [
          { value: "Gas", count: 689 },
          { value: "Hybrid", count: 387 },
          { value: "Electric", count: 156 },
          { value: "Plug-In Hybrid", count: 98 },
          { value: "Diesel", count: 27 },
        ],
      },
      {
        key: "fuelType",
        label: "Fuel Type",
        type: "MultiEnum",
        options: [
          { value: "Regular Unleaded", count: 689 },
          { value: "Hybrid", count: 387 },
          { value: "Electric", count: 156 },
          { value: "Plug-In Hybrid", count: 98 },
          { value: "Premium Unleaded", count: 213 },
          { value: "Diesel", count: 27 },
        ],
      },
      {
        key: "drivetrain",
        label: "Drivetrain",
        type: "MultiEnum",
        options: [
          { value: "Front Wheel Drive", count: 487 },
          { value: "All Wheel Drive", count: 612 },
          { value: "Rear Wheel Drive", count: 201 },
          { value: "Four Wheel Drive", count: 157 },
        ],
      },
      {
        key: "transmissionType",
        label: "Transmission",
        type: "MultiEnum",
        options: [
          { value: "Automatic", count: 1234 },
          { value: "CVT", count: 187 },
          { value: "Manual", count: 36 },
        ],
      },
      {
        key: "exteriorColorFamily",
        label: "Exterior Color",
        type: "MultiEnum",
        options: [
          { value: "White", count: 312, metadata: { hex: "#F2F0EB" } },
          { value: "Black", count: 287, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 241, metadata: { hex: "#8C8C8C" } },
          { value: "Silver", count: 198, metadata: { hex: "#C0C0C0" } },
          { value: "Blue", count: 167, metadata: { hex: "#3B5998" } },
          { value: "Red", count: 134, metadata: { hex: "#C41E3A" } },
          { value: "Brown", count: 89, metadata: { hex: "#7B4F2E" } },
          { value: "Green", count: 45, metadata: { hex: "#4A7C59" } },
        ],
      },
      {
        key: "interiorColorFamily",
        label: "Interior Color",
        type: "MultiEnum",
        options: [
          { value: "Black", count: 876, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 412, metadata: { hex: "#8C8C8C" } },
          { value: "Beige", count: 234, metadata: { hex: "#D4C5A9" } },
          { value: "Brown", count: 112, metadata: { hex: "#7B4F2E" } },
          { value: "White", count: 67, metadata: { hex: "#F5F5F0" } },
          { value: "Red", count: 23, metadata: { hex: "#8B0000" } },
        ],
      },
      {
        key: "vehicleCategory",
        label: "Vehicle Category",
        type: "MultiEnum",
        options: [
          { value: "New", count: 834 },
          { value: "Used", count: 623 },
          { value: "Certified Pre-Owned", count: 134 },
        ],
      },
      {
        key: "dealRating",
        label: "Deal Rating",
        type: "MultiEnum",
        options: [
          { value: "Great Deal", count: 287 },
          { value: "Good Deal", count: 412 },
          { value: "Fair Deal", count: 389 },
        ],
      },
    ],
  },
  meta: {
    traceId: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    timestamp: "2026-06-18T14:42:16.177Z",
  },
};

/**
 * Successful BFF response fixture — first-time SRP load, unfiltered catalog.
 * Covers all FilterKey dimensions available in the upstream Search API spec.
 */
export const FILTERS_SUCCESS_FIXTURE: FiltersResponse = {
  data: {
    filters: [
      {
        key: "make",
        label: "Make",
        type: "MultiEnum",
        options: [
          { value: "Toyota", count: 312 },
          { value: "Honda", count: 278 },
          { value: "Ford", count: 201 },
          { value: "Chevrolet", count: 189 },
          { value: "Nissan", count: 156 },
          { value: "BMW", count: 134 },
          { value: "Mercedes-Benz", count: 121 },
          { value: "Hyundai", count: 118 },
          { value: "Kia", count: 97 },
          { value: "Subaru", count: 84 },
        ],
      },
      {
        key: "model",
        label: "Model",
        type: "MultiEnum",
        options: [
          { value: "RAV4 Hybrid", count: 124 },
          { value: "CR-V Hybrid", count: 89 },
          { value: "F-150", count: 76 },
          { value: "Camry", count: 68 },
          { value: "Civic", count: 64 },
          { value: "Silverado 1500", count: 61 },
          { value: "Tucson Hybrid", count: 55 },
          { value: "Outback", count: 48 },
        ],
      },
      {
        key: "year",
        label: "Year",
        type: "Range",
        min: 2018,
        max: 2025,
      },
      {
        key: "price",
        label: "Price",
        type: "Range",
        min: 8500,
        max: 89_900,
      },
      {
        key: "mileage",
        label: "Mileage",
        type: "Range",
        min: 0,
        max: 148_000,
      },
      {
        key: "bodyStyle",
        label: "Body Style",
        type: "MultiEnum",
        options: [
          { value: "SUV", label: "SUV / Crossover", count: 445 },
          { value: "Sedan", count: 289 },
          { value: "Truck", count: 178 },
          { value: "Hatchback", count: 112 },
          { value: "Minivan", count: 67 },
          { value: "Coupe", count: 54 },
          { value: "Convertible", count: 31 },
          { value: "Wagon", count: 24 },
        ],
      },
      {
        key: "powertrainType",
        label: "Powertrain",
        type: "MultiEnum",
        options: [
          { value: "Gas", count: 689 },
          { value: "Hybrid", count: 387 },
          { value: "Electric", count: 156 },
          { value: "Plug-In Hybrid", count: 98 },
          { value: "Diesel", count: 27 },
        ],
      },
      {
        key: "fuelType",
        label: "Fuel Type",
        type: "MultiEnum",
        options: [
          { value: "Regular Unleaded", count: 689 },
          { value: "Hybrid", count: 387 },
          { value: "Electric", count: 156 },
          { value: "Plug-In Hybrid", count: 98 },
          { value: "Premium Unleaded", count: 213 },
          { value: "Diesel", count: 27 },
        ],
      },
      {
        key: "drivetrain",
        label: "Drivetrain",
        type: "MultiEnum",
        options: [
          { value: "Front Wheel Drive", count: 487 },
          { value: "All Wheel Drive", count: 612 },
          { value: "Rear Wheel Drive", count: 201 },
          { value: "Four Wheel Drive", count: 157 },
        ],
      },
      {
        key: "transmissionType",
        label: "Transmission",
        type: "MultiEnum",
        options: [
          { value: "Automatic", count: 1234 },
          { value: "CVT", count: 187 },
          { value: "Manual", count: 36 },
        ],
      },
      {
        key: "exteriorColorFamily",
        label: "Exterior Color",
        type: "MultiEnum",
        options: [
          { value: "White", count: 312, metadata: { hex: "#F2F0EB" } },
          { value: "Black", count: 287, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 241, metadata: { hex: "#8C8C8C" } },
          { value: "Silver", count: 198, metadata: { hex: "#C0C0C0" } },
          { value: "Blue", count: 167, metadata: { hex: "#3B5998" } },
          { value: "Red", count: 134, metadata: { hex: "#C41E3A" } },
          { value: "Brown", count: 89, metadata: { hex: "#7B4F2E" } },
          { value: "Green", count: 45, metadata: { hex: "#4A7C59" } },
        ],
      },
      {
        key: "interiorColorFamily",
        label: "Interior Color",
        type: "MultiEnum",
        options: [
          { value: "Black", count: 876, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 412, metadata: { hex: "#8C8C8C" } },
          { value: "Beige", count: 234, metadata: { hex: "#D4C5A9" } },
          { value: "Brown", count: 112, metadata: { hex: "#7B4F2E" } },
          { value: "White", count: 67, metadata: { hex: "#F5F5F0" } },
          { value: "Red", count: 23, metadata: { hex: "#8B0000" } },
        ],
      },
      {
        key: "vehicleCategory",
        label: "Vehicle Category",
        type: "MultiEnum",
        options: [
          { value: "New", count: 834 },
          { value: "Used", count: 623 },
          { value: "Certified Pre-Owned", count: 134 },
        ],
      },
      {
        key: "dealRating",
        label: "Deal Rating",
        type: "MultiEnum",
        options: [
          { value: "Great Deal", count: 287 },
          { value: "Good Deal", count: 412 },
          { value: "Fair Deal", count: 389 },
        ],
      },
    ],
  },
  meta: {
    traceId: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    timestamp: "2026-06-18T14:42:16.177Z",
  },
};

/**
 * Empty result fixture — for locations with no matching inventory.
 */
export const FILTERS_EMPTY_FIXTURE: FiltersResponse = {
  data: {
    filters: [],
  },
  meta: {
    traceId: "",
    timestamp: "2026-06-15T17:28:17.569Z",
  },
};

/**
 * Mocked selected context filters — simulates what the upstream would return
 * when a searchId is associated with an agent-narrowed search session.
 *
 * Represents filters the AI agent applied during conversational search
 * (e.g., "Show me Hybrid Toyota SUVs under $50k").
 */
export const MOCK_SELECTED_CONTEXT_FILTERS: SelectedContextFilter[] = [
  { key: "make", values: ["Toyota"] },
  { key: "fuelType", values: ["Hybrid"] },
  { key: "bodyStyle", values: ["SUV"] },
  { key: "price", min: 0, max: 50_000 },
];

/**
 * Session-scoped filter fixture — counts reflect the agent's narrowed context.
 * Used when a `searchId` is passed to the filters endpoint.
 */
export const FILTERS_SCOPED_FIXTURE: FiltersResponse = {
  data: {
    filters: [
      {
        key: "make",
        label: "Make",
        type: "MultiEnum",
        options: [
          { value: "Toyota", count: 87 },
          { value: "Honda", count: 42 },
          { value: "Ford", count: 23 },
          { value: "Hyundai", count: 18 },
          { value: "Kia", count: 12 },
        ],
      },
      {
        key: "model",
        label: "Model",
        type: "MultiEnum",
        options: [
          { value: "RAV4 Hybrid", count: 34 },
          { value: "Highlander Hybrid", count: 21 },
          { value: "Venza", count: 15 },
          { value: "Grand Highlander Hybrid", count: 11 },
          { value: "Crown", count: 6 },
        ],
      },
      {
        key: "year",
        label: "Year",
        type: "Range",
        min: 2021,
        max: 2025,
      },
      {
        key: "price",
        label: "Price",
        type: "Range",
        min: 28_500,
        max: 49_900,
      },
      {
        key: "mileage",
        label: "Mileage",
        type: "Range",
        min: 0,
        max: 62_000,
      },
      {
        key: "fuelType",
        label: "Fuel Type",
        type: "MultiEnum",
        options: [
          { value: "Hybrid", count: 87 },
          { value: "Plug-In Hybrid", count: 12 },
        ],
      },
      {
        key: "drivetrain",
        label: "Drivetrain",
        type: "MultiEnum",
        options: [
          { value: "All Wheel Drive", count: 64 },
          { value: "Front Wheel Drive", count: 23 },
        ],
      },
      {
        key: "transmissionType",
        label: "Transmission",
        type: "MultiEnum",
        options: [
          { value: "CVT", count: 52 },
          { value: "Automatic", count: 35 },
        ],
      },
      {
        key: "exteriorColorFamily",
        label: "Exterior Color",
        type: "MultiEnum",
        options: [
          { value: "White", count: 22, metadata: { hex: "#F2F0EB" } },
          { value: "Black", count: 18, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 15, metadata: { hex: "#8C8C8C" } },
          { value: "Silver", count: 12, metadata: { hex: "#C0C0C0" } },
          { value: "Blue", count: 11, metadata: { hex: "#3B5998" } },
          { value: "Red", count: 9, metadata: { hex: "#C41E3A" } },
        ],
      },
      {
        key: "interiorColorFamily",
        label: "Interior Color",
        type: "MultiEnum",
        options: [
          { value: "Black", count: 54, metadata: { hex: "#1C1C1C" } },
          { value: "Gray", count: 21, metadata: { hex: "#8C8C8C" } },
          { value: "Brown", count: 12, metadata: { hex: "#7B4F2E" } },
        ],
      },
      {
        key: "dealRating",
        label: "Deal Rating",
        type: "MultiEnum",
        options: [
          { value: "Great Deal", count: 23 },
          { value: "Good Deal", count: 38 },
          { value: "Fair Deal", count: 26 },
        ],
      },
    ],
    selectedContextFilters: MOCK_SELECTED_CONTEXT_FILTERS,
  },
  meta: {
    traceId: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    timestamp: "2026-06-18T14:42:16.177Z",
  },
};
