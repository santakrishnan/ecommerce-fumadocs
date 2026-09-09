import {
  VDP_FAQ_QUESTION_3RD_ROW,
  VDP_FAQ_QUESTION_BETTER_THAN,
  VDP_FAQ_QUESTION_CARGO_SPACE,
  VDP_FAQ_QUESTION_TOWING,
  VDP_FAQ_QUESTION_TRIM_COMPARE,
} from "../bff/__fixtures__/vdp-search-faq.fixture";

/**
 * Ask Question card — pill suggestion arrays by vehicle type.
 *
 * These define which questions appear as clickable pills on the VDP
 * AskQuestionCard. The actual answer content lives in
 * `bff/__fixtures__/vdp-search-faq.fixture.ts`.
 *
 * Future: these will be AI-generated based on vehicle attributes.
 */

/** Default suggestions for SUVs / crossovers with 3rd-row seating */
export const ASK_QUESTION_SUGGESTIONS_SUV = [
  VDP_FAQ_QUESTION_3RD_ROW,
  VDP_FAQ_QUESTION_CARGO_SPACE,
  VDP_FAQ_QUESTION_TRIM_COMPARE,
  VDP_FAQ_QUESTION_BETTER_THAN,
];

/** Default suggestions for sedans */
export const ASK_QUESTION_SUGGESTIONS_SEDAN = [
  "How does the fuel economy compare?",
  "What safety features are included?",
  "How roomy is the back seat?",
  VDP_FAQ_QUESTION_BETTER_THAN,
];

/** Default suggestions for trucks */
export const ASK_QUESTION_SUGGESTIONS_TRUCK = [
  VDP_FAQ_QUESTION_TOWING,
  "How does the bed size compare?",
  "What off-road features does it have?",
  VDP_FAQ_QUESTION_BETTER_THAN,
];

/** Default suggestions for electric vehicles */
export const ASK_QUESTION_SUGGESTIONS_EV = [
  "What is the real-world range?",
  "How long does it take to charge?",
  "What charging options are available?",
  VDP_FAQ_QUESTION_BETTER_THAN,
];
