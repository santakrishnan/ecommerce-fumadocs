/**
 * VDP carousel fixtures.
 *
 * Provides data for the "More matches" and "Continue shopping" carousels
 * in the bottom section of the VDP.
 */

export interface CarouselVehicle {
  imageUrl: string;
  mileage: number;
  model: string;
  price: number;
  surface: "light" | "dark";
  trim: string;
  vin: string;
  year: number;
}

export interface VehicleCarouselData {
  continueShopping: CarouselVehicle[];
  moreMatches: CarouselVehicle[];
}

/** Standard carousel data */
export const CAROUSEL_FIXTURE_STANDARD: VehicleCarouselData = {
  moreMatches: [
    {
      vin: "MM01",
      imageUrl: "/inventory-card/inventory-card-01.png",
      price: 29_500,
      model: "Highlander",
      trim: "Hybrid XLE",
      year: 2023,
      mileage: 28_400,
      surface: "light",
    },
    {
      vin: "MM02",
      imageUrl: "/inventory-card/inventory-card-02.png",
      price: 31_200,
      model: "Highlander",
      trim: "Limited",
      year: 2023,
      mileage: 22_100,
      surface: "light",
    },
    {
      vin: "MM03",
      imageUrl: "/inventory-card/inventory-card-03.png",
      price: 27_800,
      model: "Highlander",
      trim: "LE",
      year: 2022,
      mileage: 41_300,
      surface: "light",
    },
    {
      vin: "MM04",
      imageUrl: "/inventory-card/inventory-card-04.png",
      price: 33_900,
      model: "Highlander",
      trim: "Hybrid Limited",
      year: 2024,
      mileage: 12_500,
      surface: "light",
    },
    {
      vin: "MM05",
      imageUrl: "/inventory-card/inventory-card-05.png",
      price: 26_200,
      model: "RAV4",
      trim: "XLE",
      year: 2023,
      mileage: 35_800,
      surface: "light",
    },
    {
      vin: "MM06",
      imageUrl: "/inventory-card/inventory-card-06.png",
      price: 28_700,
      model: "Camry",
      trim: "SE",
      year: 2024,
      mileage: 18_200,
      surface: "dark",
    },
  ],
  continueShopping: [
    {
      vin: "CS01",
      imageUrl: "/inventory-card/inventory-card-07.png",
      price: 34_500,
      model: "Highlander",
      trim: "Hybrid XSE",
      year: 2023,
      mileage: 19_800,
      surface: "dark",
    },
    {
      vin: "CS02",
      imageUrl: "/inventory-card/inventory-card-08.png",
      price: 29_900,
      model: "Venza",
      trim: "XLE",
      year: 2023,
      mileage: 24_600,
      surface: "dark",
    },
    {
      vin: "CS03",
      imageUrl: "/inventory-card/inventory-card-09.png",
      price: 38_200,
      model: "Sienna",
      trim: "Limited",
      year: 2024,
      mileage: 8900,
      surface: "light",
    },
    {
      vin: "CS04",
      imageUrl: "/inventory-card/inventory-card-10.png",
      price: 42_100,
      model: "Tundra",
      trim: "SR5",
      year: 2023,
      mileage: 31_200,
      surface: "dark",
    },
    {
      vin: "CS05",
      imageUrl: "/inventory-card/inventory-card-11.png",
      price: 31_500,
      model: "GR86",
      trim: "Base",
      year: 2024,
      mileage: 5400,
      surface: "dark",
    },
    {
      vin: "CS06",
      imageUrl: "/inventory-card/inventory-card-12.png",
      price: 48_700,
      model: "Supra",
      trim: "3.0",
      year: 2023,
      mileage: 14_800,
      surface: "dark",
    },
  ],
};

/** Sparse data — few results */
export const CAROUSEL_FIXTURE_SPARSE: VehicleCarouselData = {
  moreMatches: CAROUSEL_FIXTURE_STANDARD.moreMatches.slice(0, 2),
  continueShopping: [],
};

/** Carousel section headers */
export function getCarouselHeaders() {
  return {
    moreMatches: "More matches",
    continueShopping: "Continue shopping",
  };
}
