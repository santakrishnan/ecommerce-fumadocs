import { ROUTES } from "@config/routes";
import type { CategoryCardData } from "../types";

/** Happy path — single fully populated category card */
export const categoryCardFixture: CategoryCardData = {
  name: "TRUCKS",
  description: "Power for every job, from daily commutes to heavy-duty hauling.",
  imageAlt: "Toyota truck side view",
  imageUrl: "/images/categories/truck.png",
  shopUrl: ROUTES.SEARCH_TRUCK,
};

/** 4 category cards — happy path list */
export const categoryCardsListFixture: CategoryCardData[] = [
  {
    name: "CARS & MINIVANS",
    description: "Reliable sedans, hatchbacks, and family-friendly minivans for every lifestyle.",
    imageAlt: "Toyota sedan side view",
    imageUrl: "/images/categories/sedan.png",
    shopUrl: ROUTES.SEARCH_CAR,
  },
  {
    name: "TRUCKS",
    description: "Power for every job, from daily commutes to heavy-duty hauling.",
    imageAlt: "Toyota truck side view",
    imageUrl: "/images/categories/truck.png",
    shopUrl: ROUTES.SEARCH_TRUCK,
  },
  {
    name: "CROSSOVERS & SUVs",
    description: "Built for adventure with the space and versatility your lifestyle demands.",
    imageAlt: "Toyota SUV side view",
    imageUrl: "/images/categories/suv.png",
    shopUrl: ROUTES.SEARCH_SUV,
  },
  {
    name: "ELECTRIC",
    description: "Zero emissions, full performance — the future of driving starts here.",
    imageAlt: "Toyota electric vehicle side view",
    imageUrl: "/images/categories/electric.png",
    shopUrl: ROUTES.SEARCH_ELECTRIC,
  },
];

/** Empty list — no categories */
export const categoryCardsEmptyFixture: CategoryCardData[] = [];
