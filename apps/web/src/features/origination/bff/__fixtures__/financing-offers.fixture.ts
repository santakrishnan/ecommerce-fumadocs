export interface FinancingOffer {
  apr: number;
  downPayment: number;
  highlighted: boolean;
  monthlyPayment: number;
  offerId: string;
  primaryCtaLabel: string;
  termMonths: number;
  tradeInApplied?: number;
}

export interface FinancingOffersContext {
  offers: FinancingOffer[];
}

export const FINANCING_OFFERS_CONTEXT_FIXTURE: FinancingOffersContext = {
  offers: [
    {
      offerId: "81f0d366-956d-4a76-9c6a-f7f8d1d39927",
      highlighted: true,
      monthlyPayment: 526,
      apr: 7.66,
      termMonths: 60,
      downPayment: 3500,
      tradeInApplied: 21_800,
      primaryCtaLabel: "Continue with this option",
    },
    {
      offerId: "25972bc9-dd4a-4023-ac10-f44cf043d48d",
      highlighted: false,
      monthlyPayment: 468,
      apr: 8.7,
      termMonths: 72,
      downPayment: 3500,
      tradeInApplied: 21_800,
      primaryCtaLabel: "Continue with this option",
    },
    {
      offerId: "6ab7d127-91f5-48cc-828c-3c0f098597fa",
      highlighted: false,
      monthlyPayment: 634,
      apr: 7.66,
      termMonths: 48,
      downPayment: 3500,
      tradeInApplied: 21_800,
      primaryCtaLabel: "Continue with this option",
    },
    {
      offerId: "4b55166f-79fd-4763-b70c-99a55582ef14",
      highlighted: false,
      monthlyPayment: 525,
      apr: 8.25,
      termMonths: 72,
      downPayment: 1500,
      tradeInApplied: 21_800,
      primaryCtaLabel: "Continue with this option",
    },
  ],
};
