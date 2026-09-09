/**
 * Static content config for the pre-financing readiness screen.
 *
 * All display strings and the item list are co-located here so the component
 * stays data-driven and easy to swap for a CMS/API source later without
 * touching component logic.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single "have ready" checklist item shown on the readiness screen.
 *
 * `id` is stable across renders and used as the React list key.
 * When wired to a CMS the backing shape must satisfy this interface.
 */
export interface ReadinessItem {
  /** Stable identifier — used as React list key and for CMS reference. */
  id: string;
  /** Display label rendered in the checklist card. */
  label: string;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

/** Page heading rendered as the panel title. */
export const READINESS_TITLE = "Before you begin financing, have ready:";

/** Subheading rendered as the panel description. */
export const READINESS_DESCRIPTION =
  "Complete your purchase by reviewing pricing, selecting options, and submitting your information.";

/** Card eyebrow / section label above the checklist items. */
export const READINESS_CARD_LABEL = "You'll need";

/** Primary CTA label. */
export const READINESS_CONTINUE_LABEL = "Continue";

// ─── Items ────────────────────────────────────────────────────────────────────

/**
 * Ordered list of documents/information the user should have on hand.
 *
 * TODO(CMS): replace this static array with a fetch from the content API
 * once the readiness-items endpoint is available.
 */
export const READINESS_ITEMS: ReadinessItem[] = [
  {
    id: "drivers-license",
    label: "Driver's license",
  },
  {
    id: "financial-banking-info",
    label: "Financial or banking information",
  },
  {
    id: "trade-in-details",
    label: "Trade-in details (if applicable)",
  },
];
