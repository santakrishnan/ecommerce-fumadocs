import type { DealerOfferData } from "../types";

/** Happy path — fully populated dealer offer with icon and personalization */
export const dealerOfferFullFixture: DealerOfferData = {
  id: "parkway-toyota",
  name: "Parkway Toyota",
  offerHeadline: "$1000 OFF HYBRID CARS AND SUVS",
  imageSrc: "/images/dealer/dealer-1.webp",
  imageAlt: "Parkway Toyota dealership",
  badge: { label: "Featured", variant: "red" },
  icon: { type: "location" },
  personalization: "2.3 mi away",
  textTheme: "light",
};

/** Dealer offer without personalization */
export const dealerOfferNoPersonalizationFixture: DealerOfferData = {
  id: "bay-ridge-toyota",
  name: "Bay Ridge Toyota",
  offerHeadline: "4.75% APR FOR 72 MO.",
  imageSrc: "/images/dealer/dealer-2.webp",
  imageAlt: "Bay Ridge Toyota dealership",
};

/** 4 dealer offers — happy path list */
export const dealerOffersListFixture: DealerOfferData[] = [
  {
    id: "parkway-toyota",
    name: "Parkway Toyota",
    offerHeadline: "$1000 OFF HYBRID CARS AND SUVS",
    imageSrc: "/images/dealer/dealer-1.webp",
    imageAlt: "Parkway Toyota dealership",
    icon: { type: "location" },
    personalization: "2.3 mi away",
    textTheme: "light",
  },
  {
    id: "bay-ridge-toyota",
    name: "Bay Ridge Toyota",
    offerHeadline: "HIGHLANDER HYBRID 4.75% APR FOR 72 MO.",
    imageSrc: "/images/dealer/dealer-2.webp",
    imageAlt: "Bay Ridge Toyota dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "dark",
  },
  {
    id: "toyota-of-avalon",
    name: "Toyota of Avalon",
    offerHeadline: "4.75% APR ON RAV 4 HYBRID",
    imageSrc: "/images/dealer/dealer-3.webp",
    imageAlt: "Toyota of Avalon dealership",
    icon: { type: "location" },
    personalization: "8.4 mi away",
    textTheme: "light",
  },
  {
    id: "bay-ridge-toyota-2",
    name: "Bay Ridge Toyota",
    offerHeadline: "2022 HIGHLANDER 0% APR FOR 72 MO.",
    imageSrc: "/images/dealer/dealer-4.jpg",
    imageAlt: "Bay Ridge Toyota dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "dark",
  },
];

/** Empty list — no offers returned */
export const dealerOffersEmptyFixture: DealerOfferData[] = [];

/** Partial list — fewer than 4 offers */
export const dealerOffersPartialFixture: DealerOfferData[] = dealerOffersListFixture.slice(0, 2);

/**
 * Seed data for the landing page data service.
 * Typed as `unknown[]` so Zod's safeParse acts as the runtime type gate.
 * All objects conform to dealerOfferSchema (id, name, offerHeadline, imageSrc, imageAlt).
 */
export const DEALER_OFFERS: unknown[] = [
  {
    id: "parkway-toyota",
    name: "Parkway Toyota",
    offerHeadline: "$1,000 OFF HYBRID CARS AND SUVS",
    imageSrc: "https://images.example.com/dealers/parkway-toyota.webp",
    imageAlt: "Parkway Toyota dealership exterior",
  },
  {
    id: "bay-ridge-toyota",
    name: "Bay Ridge Toyota",
    offerHeadline: "HIGHLANDER HYBRID 4.75% APR FOR 72 MONTHS",
    imageSrc: "https://images.example.com/dealers/bay-ridge-toyota.webp",
    imageAlt: "Bay Ridge Toyota dealership exterior",
  },
  {
    id: "toyota-of-avalon",
    name: "Toyota of Avalon",
    offerHeadline: "RAV4 HYBRID — 4.75% APR, LIMITED TIME OFFER",
    imageSrc: "https://images.example.com/dealers/toyota-of-avalon.webp",
    imageAlt: "Toyota of Avalon dealership exterior",
  },
  {
    id: "sunrise-toyota",
    name: "Sunrise Toyota",
    offerHeadline: "2022 HIGHLANDER 0% APR FOR 72 MONTHS",
    imageSrc: "https://images.example.com/dealers/sunrise-toyota.webp",
    imageAlt: "Sunrise Toyota dealership exterior",
  },
  {
    id: "manhattan-toyota",
    name: "Manhattan Toyota",
    offerHeadline: "LEASE A NEW CAMRY FROM $299/MO WITH $0 DOWN",
    imageSrc: "https://images.example.com/dealers/manhattan-toyota.webp",
    imageAlt: "Manhattan Toyota dealership exterior",
  },
];
