import type { InventoryCardResponse } from "../contracts/search-response.schema";

/** Minimal valid {@link InventoryCardResponse} for use across mapper test cases. */
export const baseInventoryCardResponse: InventoryCardResponse = {
  vin: "1HGBH41JXMN109186",
  vehicleInfo: {
    year: 2024,
    make: "Toyota",
    model: "Highlander",
    trim: "XLE",
  },
  dealerInfo: {
    dealerCode: "TYT001",
    dealerName: "Toyota of Springfield",
  },
  pricing: {
    listPrice: 42_000,
    msrp: 44_500,
  },
  status: {
    mileage: 12_500,
    vehicleStatus: "Available",
  },
  media: {
    photos: [{ url: "https://cdn.example.com/photos/abc.jpg", displayOrder: 1 }],
  },
  description: "Spacious hybrid SUV with excellent fuel economy.",
};
