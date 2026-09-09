/**
 * Compare FAQ — question pill labels by comparison category.
 *
 * These define which questions appear as suggested (currently non-interactive) pills on the Compare
 * AskQuestionSection. Each category (Price & Value, Performance, etc.) has
 * a heading and a set of contextual questions.
 *
 * Future: these will be AI-generated based on the vehicles being compared.
 */

// ─── Question Constants ─────────────────────────────────────────────────────

export const COMPARE_FAQ_QUESTION_BEST_VALUE = "Which one is the best value?";
export const COMPARE_FAQ_QUESTION_HOLD_VALUE = "Which will hold its value over time?";
export const COMPARE_FAQ_QUESTION_LOWER_PAYMENT = "Can I lower the monthly payment?";

// ─── Category Fixtures ──────────────────────────────────────────────────────

export interface CompareFaqCategory {
  /** Section heading (e.g. "Ask a question about Price & Value") */
  heading: string;
  /** Category key for routing/analytics */
  id: string;
  /** Suggested question pills */
  questions: string[];
}

export const COMPARE_FAQ_PRICE_VALUE: CompareFaqCategory = {
  id: "price-value",
  heading: "Ask a question about Price & Value",
  questions: [
    COMPARE_FAQ_QUESTION_BEST_VALUE,
    COMPARE_FAQ_QUESTION_HOLD_VALUE,
    COMPARE_FAQ_QUESTION_LOWER_PAYMENT,
  ],
};

export const COMPARE_FAQ_PERFORMANCE: CompareFaqCategory = {
  id: "performance",
  heading: "Ask a question about Performance",
  questions: [
    "Which one is faster?",
    "Which handles better in bad weather?",
    "How does the towing compare?",
  ],
};

export const COMPARE_FAQ_INTERIOR: CompareFaqCategory = {
  id: "interior",
  heading: "Ask a question about Interior & Comfort",
  questions: [
    "Which has more legroom?",
    "Which has the better sound system?",
    "How do the seats compare?",
  ],
};

export const COMPARE_FAQ_SAFETY: CompareFaqCategory = {
  id: "safety",
  heading: "Ask a question about Safety",
  questions: [
    "Which one is safer?",
    "What safety features are different?",
    "How do the crash ratings compare?",
  ],
};

export const COMPARE_FAQ_HISTORY: CompareFaqCategory = {
  id: "history",
  heading: "Ask a question about History & Condition",
  questions: [
    "Which has the cleanest history?",
    "What does certified mean?",
    "Why has this been on the lot for so long?",
  ],
};

/**
 * All compare FAQ categories in display order.
 * Used by the compare page to render one AskQuestionSection per category.
 */
export const COMPARE_FAQ_CATEGORIES: CompareFaqCategory[] = [
  COMPARE_FAQ_PRICE_VALUE,
  COMPARE_FAQ_PERFORMANCE,
  COMPARE_FAQ_INTERIOR,
  COMPARE_FAQ_SAFETY,
  COMPARE_FAQ_HISTORY,
];
