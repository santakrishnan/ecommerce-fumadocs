import dealer1 from "@public/images/dealer/dealer-1.png";
import dealer2 from "@public/images/dealer/dealer-2.png";
import dealer3 from "@public/images/dealer/dealer-3.png";
import dealer4 from "@public/images/dealer/dealer-4.png";
import type { DealerOfferData } from "../types";

export const DEALER_OFFERS: DealerOfferData[] = [
  {
    id: "parkway-toyota",
    name: "Parkway Toyota",
    offerHeadline: "$1000 OFF HYBRID CARS AND SUVS",
    imageSrc: dealer1.src,
    imageAlt: "Parkway Toyota dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "light",
  },
  {
    id: "bay-ridge-toyota",
    name: "Bay Ridge Toyota",
    offerHeadline: "HIGHLANDER HYBRID 4.75% APR FOR 72 MO.",
    imageSrc: dealer2.src,
    imageAlt: "Bay Ridge Toyota dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "dark",
  },
  {
    id: "toyota-of-avalon",
    name: "Toyota of Avalon",
    offerHeadline: "4.75% APR ON RAV 4 HYBRID",
    imageSrc: dealer3.src,
    imageAlt: "Toyota of Avalon dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "light",
  },
  {
    id: "bay-ridge-toyota-2",
    name: "Bay Ridge Toyota",
    offerHeadline: "2022 HIGHLANDER 0% APR FOR 72 MO.",
    imageSrc: dealer4.src,
    imageAlt: "Bay Ridge Toyota dealership",
    icon: { type: "ai" },
    personalization: "Because you searched Electric SUV",
    textTheme: "dark",
  },
];
