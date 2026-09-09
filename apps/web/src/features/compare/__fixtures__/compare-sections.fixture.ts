/**
 * Compare Sections fixture — static section metadata shared by
 * CompareLayout (table headings + AskQuestion) and CompareNavigation.
 *
 * Vehicle-specific attributes (toPriceAndValueAttributes, etc.) are computed
 * in the layout from live vehicle data and are NOT stored here.
 */

import type { CompareFaqCategory } from "./compare-faq.fixture";
import {
  COMPARE_FAQ_HISTORY,
  COMPARE_FAQ_INTERIOR,
  COMPARE_FAQ_PERFORMANCE,
  COMPARE_FAQ_PRICE_VALUE,
  COMPARE_FAQ_SAFETY,
} from "./compare-faq.fixture";

export interface CompareSection {
  faq: CompareFaqCategory;
  /** Matches `faq.id` — surfaced here for convenience when iterating sections. */
  id: string;
  title: string;
}

export const COMPARE_SECTION_PRICE_VALUE: CompareSection = {
  id: COMPARE_FAQ_PRICE_VALUE.id,
  title: "Price & Value",
  faq: COMPARE_FAQ_PRICE_VALUE,
};

export const COMPARE_SECTION_PERFORMANCE: CompareSection = {
  id: COMPARE_FAQ_PERFORMANCE.id,
  title: "Performance",
  faq: COMPARE_FAQ_PERFORMANCE,
};

export const COMPARE_SECTION_INTERIOR: CompareSection = {
  id: COMPARE_FAQ_INTERIOR.id,
  title: "Interior & Comfort",
  faq: COMPARE_FAQ_INTERIOR,
};

export const COMPARE_SECTION_SAFETY: CompareSection = {
  id: COMPARE_FAQ_SAFETY.id,
  title: "Safety",
  faq: COMPARE_FAQ_SAFETY,
};

export const COMPARE_SECTION_HISTORY: CompareSection = {
  id: COMPARE_FAQ_HISTORY.id,
  title: "History & Condition",
  faq: COMPARE_FAQ_HISTORY,
};

/** All 5 compare sections in display order. */
export const COMPARE_SECTIONS: CompareSection[] = [
  COMPARE_SECTION_PRICE_VALUE,
  COMPARE_SECTION_PERFORMANCE,
  COMPARE_SECTION_INTERIOR,
  COMPARE_SECTION_SAFETY,
  COMPARE_SECTION_HISTORY,
];
