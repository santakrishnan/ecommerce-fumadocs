import { IMAGE_BASE_URL } from "@config/images";
import type {
  VehicleDealResponse,
  VehicleDetailUpstream,
} from "../bff/contracts/vehicle-deal.schema";

/**
 * Fixture typed against the SDK-generated `VehicleDetail` from @ucmp/sdk-search-api.
 * Mirrors the v360 canonical shape returned by the Search API.
 */
export const VEHICLE_FIXTURE: VehicleDetailUpstream = {
  vin: "JTERU5JR7N6123456",
  vehicleId: 82_860_001,
  stockNumber: "STK-78432",
  vehicleInfo: {
    year: 2023,
    make: "Toyota",
    model: "4Runner",
    trim: "TRD Off Road",
    bodyStyle: "SUV",
    drivetrain: "Four Wheel Drive",
    fuelType: "Gasoline",
    engine: "4.0L V6",
    exteriorColor: "Lunar Rock",
    exteriorColorFamily: "Gray",
    isNew: false,
    isActive: true,
  },
  dealerInfo: {
    dealerCode: "5012",
    dealerName: "Bay Area Toyota",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
  },
  pricing: {
    msrp: 36_900,
    listPrice: 29_900,
    sellingPrice: 29_900,
  },
  status: {
    mileage: 36_435,
    daysInStock: 5,
    vehicleStatus: "In Stock",
    isCertified: false,
  },
  media: {
    photos: [
      { url: `${IMAGE_BASE_URL}/images/deal/four-runner-img.png`, displayOrder: 1 },
      { url: `${IMAGE_BASE_URL}/images/deal/four-runner-img.png`, displayOrder: 2 },
    ],
    videos: [],
  },
};

export const DEAL_FIXTURE: VehicleDealResponse = {
  vin: "JTERU5JR7N6123456",
  financing: {
    monthlyPayment: 408,
    totalPrice: 32_490,
    msrp: 36_900,
    termMonths: 60,
    aprPercent: 5.49,
    minCreditScore: 700,
  },
  urgencyMessage: "Act fast, these models usually sell within 5 days",
  buyNowHref: "/vehicle/JTERU5JR7N6123456/buy",
};
