import { ROUTES } from "@config/routes/constants";
import type { Vehicle } from "@shared/components/inventory-card";

/**
 * Temporary curated rare-find inventory until backend data is available.
 */
export const RARE_FINDS_VEHICLES: Vehicle[] = [
  {
    id: "rare-find-1",
    make: "Toyota",
    model: "Supra",
    year: 2024,
    trim: "3.0 Premium",
    vin: "WZ1DB4C01RW027483",
    price: 58_990,
    mileage: 2100,
    imageUrl: "/inventory-card/default.png",
    surface: "dark",
    showBadge: false,
    aiDescription: "Includes hard-to-find performance and entertainment packages",
    href:
      ROUTES.vdpSafe({
        make: "Toyota",
        model: "Supra",
        trim: "3.0 Premium",
        year: 2024,
        vin: "WZ1DB4C01RW027483",
      }) ?? "/",
  },
  {
    id: "rare-find-2",
    make: "Toyota",
    model: "GR Corolla",
    year: 2024,
    trim: "Circuit Edition",
    vin: "JTEBU5JR5P5901234",
    price: 46_200,
    mileage: 3650,
    imageUrl: "/inventory-card/inventory-card2.png",
    surface: "light",
    showBadge: false,
    aiDescription: "One of only 1,500 Circuit Editions produced this year",
    href:
      ROUTES.vdpSafe({
        make: "Toyota",
        model: "GR Corolla",
        trim: "Circuit Edition",
        year: 2024,
        vin: "JTEBU5JR5P5901234",
      }) ?? "/",
  },
  {
    id: "rare-find-3",
    make: "Toyota",
    model: "4Runner",
    year: 2023,
    trim: "TRD Pro",
    vin: "JTEEU5JR5N5246810",
    price: 54_900,
    mileage: 11_250,
    imageUrl: "/inventory-card/default.png",
    surface: "dark",
    showBadge: false,
    aiDescription: "Low miles with factory roof rack and skid plate upgrades",
    href:
      ROUTES.vdpSafe({
        make: "Toyota",
        model: "4Runner",
        trim: "TRD Pro",
        year: 2023,
        vin: "JTEEU5JR5N5246810",
      }) ?? "/",
  },
];
