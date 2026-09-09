import type { VehicleCard } from "@features/landing/data/schemas/vehicle-card";

export const validVehicleCard = {
  id: "vin-1HGBH41JXMN109186",
  make: "Toyota",
  model: "Camry",
  year: 2024,
  trim: "XSE",
  price: 28_500,
  mileage: 0,
  imageUrl: "https://cdn.example.com/vehicles/camry-2024-xse.jpg",
  imageAlt: "2024 Toyota Camry XSE in Midnight Black",
  detailPageUrl: "https://example.com/vehicles/toyota-camry-2024-xse",
} as const satisfies VehicleCard;
