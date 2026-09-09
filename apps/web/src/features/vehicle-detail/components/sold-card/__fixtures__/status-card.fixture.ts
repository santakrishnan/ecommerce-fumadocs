import type { StatusCardDealer, StatusCardVehicle } from "../status-card.types";

export const SOLD_VEHICLE_FIXTURE: StatusCardVehicle = {
  make: "Toyota",
  model: "Highlander Hybrid",
  trim: "Limited",
  year: 2023,
  bodyStyle: "SUV",
};

export const SOLD_DEALER_FIXTURE: StatusCardDealer = {
  name: "Toyota of Bay Ridge",
};

export const SOLD_DATE_FIXTURE = "2026-03-24";

export const VEHICLE_SOLD_FIXTURE = {
  vehicle: SOLD_VEHICLE_FIXTURE,
  dealer: SOLD_DEALER_FIXTURE,
  heroImageUrl: "/images/vdp/sold-hero-mobile.png",
  heroImageUrlDesktop: "/images/vdp/sold-hero-desktop.png",
  heroImageUrlTablet: "/images/vdp/sold-hero.png",
  soldDate: SOLD_DATE_FIXTURE,
} as const;
