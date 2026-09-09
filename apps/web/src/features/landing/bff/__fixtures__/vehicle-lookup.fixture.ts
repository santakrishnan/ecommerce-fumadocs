import type { VehicleLookupResponse } from "../contracts/vehicle-deal.schema";

/**
 * Fixture mimicking the upstream Search API `POST /vehicles` response envelope.
 * Swap this export for a different vehicle to exercise other scenarios.
 */
export const VEHICLE_LOOKUP_FIXTURE: VehicleLookupResponse = {
  data: {
    vehicles: [
      {
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
            { url: "/images/deal/four-runner-img.png", displayOrder: 1 },
            { url: "/images/deal/four-runner-img.png", displayOrder: 2 },
          ],
          videos: [],
        },
      },
    ],
    notFound: [],
  },
  meta: {
    traceId: "00-fixture-trace-id-001",
    timestamp: "2026-01-01T00:00:00.000Z",
  },
};
