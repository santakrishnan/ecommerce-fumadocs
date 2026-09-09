/**
 * "Buy with no hidden surprises" trust block fixture.
 *
 * Surface-agnostic content — heading, hero image, and a list of benefits.
 * Likely sourced from a CMS later; today it's a static fixture so the VDP
 * can render the section without an API contract.
 */

export interface BuyWithConfidenceBenefit {
  /** Short benefit description shown beneath the title. */
  description: string;
  /** Stable id for React keys / future analytics. */
  id: string;
  /** Bold benefit name (e.g. "7-Day Returns"). */
  title: string;
}

export interface BuyWithConfidenceImage {
  /** Descriptive alt text for the lifestyle image. */
  alt: string;
  /** Public image path (e.g. /images/vdp/buy-with-confidence.png). */
  src: string;
}

export interface BuyWithConfidenceData {
  /** Ordered list of trust benefits. */
  benefits: BuyWithConfidenceBenefit[];
  /** Section heading (h2). */
  heading: string;
  /** Left-column lifestyle image. */
  image: BuyWithConfidenceImage;
}

/** Default content from the Figma handoff. */
export const BUY_WITH_CONFIDENCE_FIXTURE: BuyWithConfidenceData = {
  heading: "Buy with no hidden surprises",
  image: {
    src: "/images/vdp/buy-with-confidence.png",
    alt: "Two people smiling inside a Toyota vehicle on a coastal drive",
  },
  benefits: [
    {
      id: "seven-day-returns",
      title: "7-Day Returns",
      description: "Not quite a fit? Return it for a full refund, no questions asked.",
    },
    {
      id: "ninety-day-warranty",
      title: "Complimentary 90-Day Warranty",
      description: "Every car includes 90 days of free limited warranty coverage.",
    },
    {
      id: "no-hassle-pricing",
      title: "No-Hassle Pricing",
      description: "Set prices on every listing, so there's no guesswork.",
    },
  ],
};
