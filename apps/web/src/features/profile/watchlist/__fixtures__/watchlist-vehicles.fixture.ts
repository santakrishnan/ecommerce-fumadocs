import { WATCHLIST_ITEMS_FIXTURE } from "./watchlist-items.fixture";

export interface WatchlistVehicleFixture {
  bodyStyle: string;
  dealerDistance: number;
  dealerName: string;
  exteriorColor: string;
  images: string[];
  listPrice: number;
  make: string;
  mileage: number;
  model: string;
  title: string;
  trim: string;
  vin: string;
  year: number;
}

function fallbackTitle(vehicle: WatchlistVehicleFixture): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
}

export const WATCHLIST_VEHICLES_FIXTURE: WatchlistVehicleFixture[] = [
  {
    vin: "4T1DAACK0SU158850",
    title: "2025 Toyota Camry XSE Hybrid",
    year: 2025,
    make: "Toyota",
    model: "Camry",
    trim: "XSE Hybrid",
    bodyStyle: "Sedan",
    listPrice: 44_180,
    mileage: 2340,
    exteriorColor: "Supersonic Red",
    images: ["/vehicles/4T1DAACK0SU158850/1.webp", "/vehicles/4T1DAACK0SU158850/2.webp"],
    dealerName: "Toyota of Bay Ridge",
    dealerDistance: 4.8,
  },
  {
    vin: "4T1DAACK9SU529231",
    title: "2025 Toyota Camry XSE AWD",
    year: 2025,
    make: "Toyota",
    model: "Camry",
    trim: "XSE AWD",
    bodyStyle: "Sedan",
    listPrice: 45_295,
    mileage: 1975,
    exteriorColor: "Wind Chill Pearl",
    images: ["/vehicles/4T1DAACK9SU529231/1.webp", "/vehicles/4T1DAACK9SU529231/2.webp"],
    dealerName: "Toyota of Manhattan",
    dealerDistance: 7.2,
  },
  {
    vin: "4T1DAACK3SU647503",
    title: "2025 Toyota Camry XLE",
    year: 2025,
    make: "Toyota",
    model: "Camry",
    trim: "XLE",
    bodyStyle: "Sedan",
    listPrice: 43_650,
    mileage: 4110,
    exteriorColor: "Celestite",
    images: ["/vehicles/4T1DAACK3SU647503/1.webp", "/vehicles/4T1DAACK3SU647503/2.webp"],
    dealerName: "Toyota of Brooklyn",
    dealerDistance: 6.5,
  },
  {
    vin: "3TMKB5FN8RM019070",
    title: "2024 Toyota Tacoma TRD Off-Road",
    year: 2024,
    make: "Toyota",
    model: "Tacoma",
    trim: "TRD Off-Road",
    bodyStyle: "Truck",
    listPrice: 53_400,
    mileage: 9845,
    exteriorColor: "Underground",
    images: ["/vehicles/3TMKB5FN8RM019070/1.webp", "/vehicles/3TMKB5FN8RM019070/2.webp"],
    dealerName: "Longo Toyota",
    dealerDistance: 12.1,
  },
  {
    vin: "4T1G11AK6RU907810",
    title: "2024 Toyota Camry XSE",
    year: 2024,
    make: "Toyota",
    model: "Camry",
    trim: "XSE",
    bodyStyle: "Sedan",
    listPrice: 41_900,
    mileage: 15_430,
    exteriorColor: "Midnight Black Metallic",
    images: ["/vehicles/4T1G11AK6RU907810/1.webp", "/vehicles/4T1G11AK6RU907810/2.webp"],
    dealerName: "Toyota of Staten Island",
    dealerDistance: 15.6,
  },
  {
    vin: "4T1DAACK9TU708693",
    title: "2026 Toyota Camry SE",
    year: 2026,
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    bodyStyle: "Sedan",
    listPrice: 39_580,
    mileage: 488,
    exteriorColor: "Reservoir Blue",
    images: ["/vehicles/4T1DAACK9TU708693/1.webp", "/vehicles/4T1DAACK9TU708693/2.webp"],
    dealerName: "Toyota of Queens",
    dealerDistance: 9.4,
  },
];

/**
 * Partial vehicle lookup fixture aligned with WATCHLIST_PARTIAL_DATA_FIXTURE.
 * Covers missing image arrays and missing list prices.
 */
export const WATCHLIST_PARTIAL_VEHICLES_FIXTURE: WatchlistVehicleFixture[] = [
  {
    vin: "4T1DAACK4SU158687",
    title: "2025 Toyota Camry LE",
    year: 2025,
    make: "Toyota",
    model: "Camry",
    trim: "LE",
    bodyStyle: "Sedan",
    listPrice: 0,
    mileage: 0,
    exteriorColor: "Ice Cap",
    images: [],
    dealerName: "Toyota of Bay Ridge",
    dealerDistance: 5.1,
  },
  {
    vin: "4T1DAACK1SU646995",
    title: "2025 Toyota Camry",
    year: 2025,
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    bodyStyle: "Sedan",
    listPrice: 0,
    mileage: 0,
    exteriorColor: "Underground",
    images: [],
    dealerName: "Toyota of Manhattan",
    dealerDistance: 7,
  },
  {
    vin: "JTDACAAU0R3035958",
    title: "2024 Toyota Prius",
    year: 2024,
    make: "Toyota",
    model: "Prius",
    trim: "XLE",
    bodyStyle: "Hatchback",
    listPrice: 0,
    mileage: 18_200,
    exteriorColor: "Cutting Edge",
    images: [],
    dealerName: "Toyota of Brooklyn",
    dealerDistance: 6.3,
  },
];

/**
 * Handy VIN-keyed map for watchlist listing joins.
 */
export const WATCHLIST_VEHICLES_BY_VIN_FIXTURE: Record<string, WatchlistVehicleFixture> =
  Object.fromEntries(WATCHLIST_VEHICLES_FIXTURE.map((vehicle) => [vehicle.vin, vehicle]));

/**
 * Runtime guard to ensure all list items have corresponding vehicle details.
 */
for (const item of WATCHLIST_ITEMS_FIXTURE) {
  const vehicle = WATCHLIST_VEHICLES_BY_VIN_FIXTURE[item.vin];
  if (!vehicle) {
    throw new Error(`Missing watchlist vehicle fixture for VIN ${item.vin}`);
  }
  if (!vehicle.title) {
    vehicle.title = fallbackTitle(vehicle);
  }
}
