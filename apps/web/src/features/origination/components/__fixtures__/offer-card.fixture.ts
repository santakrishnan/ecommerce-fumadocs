import type { OfferCardProps } from "../offer-card";

export const OFFER_CARD_FIXTURE = {
  apr: 7.66,
  downPayment: 3500,
  header: "Recommended for you",
  monthlyPayment: 526,
  supplementalText: "Expires in 7 days (on July 3, 2026)",
  termMonths: 60,
  totalFinanced: 14_399,
  tradeInValue: 21_800,
} satisfies OfferCardProps;
