import tradeInSedan from "@public/images/trade-in/sedan.png";
import tradeInSuv from "@public/images/trade-in/suv.png";
import tradeInTruck from "@public/images/trade-in/truck.png";

/** Decorative carousel image for the invitation card. */
export interface TradeInCarouselImage {
  alt: string;
  id: string;
  price: string;
  src: string;
}

/**
 * Static decorative vehicle images for the invitation carousel.
 * Static imports give compile-time path validation.
 * `.src` satisfies `TradeInCarouselImage.src: string` (consumed by <Image src={img.src}>).
 */
export const TRADE_IN_CAROUSEL_IMAGES: TradeInCarouselImage[] = [
  { id: "carousel-1", src: tradeInTruck.src, alt: "", price: "$32,400" },
  { id: "carousel-2", src: tradeInSuv.src, alt: "", price: "$28,600" },
  { id: "carousel-3", src: tradeInSedan.src, alt: "", price: "$17,900" },
  { id: "carousel-4", src: tradeInTruck.src, alt: "", price: "$29,100" },
  { id: "carousel-5", src: tradeInSuv.src, alt: "", price: "$24,500" },
];

/** US states for the state dropdown. */
export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;
