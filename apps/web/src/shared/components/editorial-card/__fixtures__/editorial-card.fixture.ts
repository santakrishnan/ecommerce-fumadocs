import { ROUTES } from "@config/routes/constants";
import type { LinkEditorialCardProps } from "@shared/components/editorial-card";
import { IconLocation } from "@ucmp/ui/icons";

export const defaultEditorialCard: LinkEditorialCardProps = {
  imageUrl: "/editorial-card/card-demo.png",
  eyebrow: "5 new matches",
  headline: "A Highlander newer than 2020 in Midnight Black Metallic for under $35K",
  href: `${ROUTES.SEARCH}?model=highlander&color=black&maxPrice=35000`,
  size: "medium",
};

export const largeEditorialCard: LinkEditorialCardProps = {
  imageUrl: "/editorial-card/card-demo.png",
  eyebrow: "Based on your recent search",
  headline: "A 2021 Supra MkV in Absolute Zero White with under 80K miles",
  href: `${ROUTES.SEARCH}?model=supra&color=white&maxMiles=80000`,
  size: "large",
};

export const editorialCardWithIcon: LinkEditorialCardProps = {
  imageUrl: "/editorial-card/card-demo.png",
  eyebrow: "Trending near you",
  headline: "Our most popular models in Greater LA",
  href: `${ROUTES.SEARCH}?trending=true&location=greater%20la`,
  icon: IconLocation,
  size: "medium",
};
