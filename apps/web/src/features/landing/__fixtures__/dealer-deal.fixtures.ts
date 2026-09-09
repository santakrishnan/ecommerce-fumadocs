import type { DealerDeal } from "../data/schemas/dealer-deal";

/** Happy path — fully populated dealer deal with all optional fields */
export const dealerDealFullFixture: DealerDeal = {
  vehicleId: "4runner-trd-off-road-2023",
  year: 2023,
  make: "Toyota",
  model: "4Runner",
  trim: "TRD Off Road",
  mileage: 36_435,
  imageUrl: "/images/deal/four-runner-img.png",
  imageAlt: "2023 Toyota 4Runner TRD Off Road on sandy terrain",
  askingPrice: 29_900,
  financing: {
    monthlyPayment: 408,
    totalPrice: 32_490,
    msrp: 36_900,
    termMonths: 60,
    aprPercent: 5.49,
    minCreditScore: 700,
  },
  urgencyMessage: "Act fast, these models usually sell within 5 days",
  buyNowHref: "/vehicle/4runner-trd-off-road-2023/buy",
};

/** Minimal deal — no optional fields (trim, msrp, urgencyMessage) */
export const dealerDealMinimalFixture: DealerDeal = {
  vehicleId: "camry-le-2024",
  year: 2024,
  make: "Toyota",
  model: "Camry",
  mileage: 12_000,
  imageUrl: "/images/deal/camry.png",
  imageAlt: "2024 Toyota Camry LE",
  askingPrice: 25_000,
  financing: {
    monthlyPayment: 350,
    totalPrice: 27_000,
    termMonths: 72,
    aprPercent: 4.99,
    minCreditScore: 680,
  },
  buyNowHref: "/vehicle/camry-le-2024/buy",
};
