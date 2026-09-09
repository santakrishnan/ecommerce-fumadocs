import { VDP_VINS } from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import type { VdpSearchFaqApiResponse } from "../contracts/vdp-search-faq.schema";

const DEFAULT_VIN = VDP_VINS.highlanderDefault;
const DEFAULT_TIMESTAMP = "2026-07-08T18:00:00.000Z";

// ─── Question Constants ─────────────────────────────────────────────────────
// Single source of truth for FAQ question labels.
export const VDP_FAQ_QUESTION_3RD_ROW = "How comfortable is the 3rd row seating?";
export const VDP_FAQ_QUESTION_CARGO_SPACE = "What is the cargo space like?";
export const VDP_FAQ_QUESTION_TOWING = "What is the towing capacity?";
export const VDP_FAQ_QUESTION_TRIM_COMPARE = "How does Limited compare to XLE?";
export const VDP_FAQ_QUESTION_BETTER_THAN =
  "What makes this one better than the others I'm seeing?";

// ─── Answer Constants ───────────────────────────────────────────────────────
// Single source of truth for FAQ answer text — used by both the BFF mock
// (`vdp-search-faq-mock.ts`) and the SSE agent mock (`agent-mock.ts`).
export const VDP_FAQ_ANSWER_3RD_ROW =
  "The 3rd row is best suited for kids or shorter adults. Reviewers note thin padding, a low seat cushion, and limited legroom — making it a tight fit for most adults on longer trips. It works great for occasional use, but if you regularly need 3rd row comfort for adults, it's worth keeping in mind.";
export const VDP_FAQ_ANSWER_TOWING =
  "The Highlander Hybrid tows up to 3,500 lbs — enough for a small boat, camper trailer, or a motorcycle hauler.";
export const VDP_FAQ_ANSWER_TRIM_COMPARE =
  "The Highlander Hybrid Limited you're looking at is a step up from the XLE — you're getting real leather upholstery, ventilated front seats, dual 12.3\" screens, and an 11-speaker JBL audio system, all on the same reliable hybrid powertrain and Toyota Safety Sense suite.";
export const VDP_FAQ_ANSWER_BETTER_THAN =
  "Compared to similar listings nearby, this one has lower mileage, a single-owner history, and includes the premium package with upgraded audio and larger displays. Most alternatives at this price point are either higher mileage or lack those factory-installed extras.";

/**
 * Default FAQ fixture — matches the story example for "How comfortable is the
 * 3rd row seating?". Text-only answer with a single suggested follow-up, no cards.
 */
const answerOnlyFixture = {
  data: {
    vin: DEFAULT_VIN,
    query: VDP_FAQ_QUESTION_3RD_ROW,
    searchContext: {
      scope: "vdp",
      searchId: null,
      isPersistent: false,
      source: "vdp-faq-pill",
    },
    answer: {
      summary: VDP_FAQ_ANSWER_3RD_ROW,
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: VDP_FAQ_QUESTION_3RD_ROW,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: VDP_FAQ_ANSWER_3RD_ROW,
      },
    ],
    suggestedFollowUps: ["What is the cargo space like?"],
  },
  meta: {
    traceId: "faq-fixture-trace",
    timestamp: DEFAULT_TIMESTAMP,
  },
} as const satisfies VdpSearchFaqApiResponse;

/**
 * Cargo-space FAQ fixture — triggered by "What is the cargo space like?"
 * Returns a text answer comparing cargo across models, plus comparison cards.
 */
const cargoSpaceFixture = {
  data: {
    vin: DEFAULT_VIN,
    query: VDP_FAQ_QUESTION_CARGO_SPACE,
    searchContext: {
      scope: "vdp",
      searchId: null,
      isPersistent: false,
      source: "vdp-faq-pill",
    },
    answer: {
      summary:
        "The Highlander Hybrid takes it — that 3rd row folds flat into a much bigger trunk. The RAV4 Hybrid still beats the bZ for everyday hauls; the bZ's battery pack eats into trunk depth.",
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: VDP_FAQ_QUESTION_CARGO_SPACE,
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "The Highlander Hybrid takes it — that 3rd row folds flat into a much bigger trunk. The RAV4 Hybrid still beats the bZ for everyday hauls; the bZ's battery pack eats into trunk depth.",
      },
    ],
    results: {
      responseMode: "ComparisonCards",
      cards: [
        {
          id: "cargo-highlander",
          title: "Highlander Hybrid",
          image: "/images/search/highlander-hybrid-2024.png",
          subtitle:
            "A 3rd row that folds flat means a much bigger trunk when you don't need the seats.",
          highlights: ["Most space"],
          attributes: [
            { key: "year", label: "Year", value: "2024" },
            { key: "maxCargo", label: "Max cargo", value: "84.3 cu. ft." },
          ],
          availableCount: 0,
          nextSearchPlan: { searchId: "faq-fixture-trace-cargo", filters: [] },
          isReadOnly: true,
        },
        {
          id: "cargo-rav4",
          title: "RAV4 Hybrid",
          image: "/images/search/rav4-hybrid-2024.png",
          subtitle: "Plenty for groceries, strollers, and weekend trips.",
          attributes: [
            { key: "year", label: "Year", value: "2024" },
            { key: "maxCargo", label: "Max cargo", value: "69.8 cu. ft." },
          ],
          availableCount: 0,
          nextSearchPlan: { searchId: "faq-fixture-trace-cargo", filters: [] },
          isReadOnly: true,
        },
        {
          id: "cargo-bz4x",
          title: "bZ4X",
          image: "/images/search/bz-2024.png",
          subtitle: "The battery pack takes up most of the trunk depth.",
          attributes: [
            { key: "year", label: "Year", value: "2024" },
            { key: "maxCargo", label: "Max cargo", value: "27.7 cu. ft." },
          ],
          availableCount: 0,
          nextSearchPlan: { searchId: "faq-fixture-trace-cargo", filters: [] },
          isReadOnly: true,
        },
      ],
    },
    suggestedFollowUps: [
      "Can the Highlander fit a stroller and luggage?",
      "How does the Highlander Limited compare to XLE?",
    ],
  },
  meta: {
    traceId: "faq-fixture-trace-cargo",
    timestamp: DEFAULT_TIMESTAMP,
  },
} as const satisfies VdpSearchFaqApiResponse;

export const VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE = answerOnlyFixture;
export const VDP_SEARCH_FAQ_CARGO_SPACE_FIXTURE = cargoSpaceFixture;

/**
 * Towing fixture — triggered by "towing" / "tow" keywords.
 * Text-only answer with follow-ups that chain into the 3rd-row and trim scenarios.
 */
const towingFixture = {
  data: {
    vin: DEFAULT_VIN,
    query: VDP_FAQ_QUESTION_TOWING,
    searchContext: {
      scope: "vdp",
      searchId: null,
      isPersistent: false,
      source: "vdp-faq-pill",
    },
    answer: {
      summary: VDP_FAQ_ANSWER_TOWING,
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: VDP_FAQ_QUESTION_TOWING,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: VDP_FAQ_ANSWER_TOWING,
      },
    ],
    suggestedFollowUps: [
      "How comfortable is the 3rd row seating?",
      "How does the Highlander Limited compare to XLE?",
    ],
  },
  meta: {
    traceId: "faq-fixture-trace-towing",
    timestamp: DEFAULT_TIMESTAMP,
  },
} as const satisfies VdpSearchFaqApiResponse;

export const VDP_SEARCH_FAQ_TOWING_FIXTURE = towingFixture;

/**
 * Trim comparison fixture — triggered by "limited" / "xle" / "platinum" keywords.
 * Returns 3 OptionCards (Trim level) with a follow-up that chains to the
 * "better than" scenario.
 */
const trimComparisonFixture = {
  data: {
    vin: DEFAULT_VIN,
    query: VDP_FAQ_QUESTION_TRIM_COMPARE,
    searchContext: {
      scope: "vdp",
      searchId: null,
      isPersistent: false,
      source: "vdp-faq-pill",
    },
    answer: {
      summary: VDP_FAQ_ANSWER_TRIM_COMPARE,
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: VDP_FAQ_QUESTION_TRIM_COMPARE,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: VDP_FAQ_ANSWER_TRIM_COMPARE,
      },
    ],
    results: {
      responseMode: "OptionCards",
      optionLevel: "Trim",
      cards: [
        {
          id: "opt-xle",
          title: "XLE",
          subtitle:
            "Heated seats, wireless charging, and a moonroof — everything you need at the best entry price.",
          image: "/images/search/highlander-hybrid-2024.png",
          availableCount: 67,
          attributes: [
            { key: "wheels", label: "Wheels", value: '18"' },
            { key: "display", label: "Display", value: '8"' },
            {
              key: "interior",
              label: "Interior",
              value: "SofTex (synthetic leather) & heated front seats",
            },
            { key: "audio", label: "Audio", value: "6-speaker" },
          ],
          nextSearchPlan: {
            searchId: "faq-fixture-trace-trim",
            filters: [
              { key: "make", values: ["Toyota"] },
              { key: "model", values: ["Highlander Hybrid"] },
              { key: "trim", values: ["XLE"] },
            ],
          },
          isReadOnly: true,
        },
        {
          id: "opt-limited",
          title: "Limited",
          subtitle:
            "A genuine step up — real leather, bigger screens, and premium sound for a more refined ride.",
          image: "/images/model/highlander_hybrid_limited.png",
          availableCount: 42,
          attributes: [
            { key: "wheels", label: "Wheels", value: '20"' },
            { key: "display", label: "Display", value: '12.3"' },
            {
              key: "interior",
              label: "Interior",
              value: "Leather, heated & ventilated front seats",
            },
            { key: "audio", label: "Audio", value: "11-speaker JBL" },
          ],
          nextSearchPlan: {
            searchId: "faq-fixture-trace-trim",
            filters: [
              { key: "make", values: ["Toyota"] },
              { key: "model", values: ["Highlander Hybrid"] },
              { key: "trim", values: ["Limited"] },
            ],
          },
          isReadOnly: true,
        },
        {
          id: "opt-platinum",
          title: "Platinum",
          subtitle:
            "The flagship — everything in Limited plus a panoramic moonroof, head-up display, and hands-free power liftgate.",
          image: "/images/search/highlander-hybrid-2024.png",
          availableCount: 23,
          attributes: [
            { key: "wheels", label: "Wheels", value: '20" chrome' },
            { key: "display", label: "Display", value: '12.3" + HUD' },
            {
              key: "interior",
              label: "Interior",
              value: "Semi-aniline leather, heated & ventilated",
            },
            { key: "audio", label: "Audio", value: "11-speaker JBL" },
          ],
          nextSearchPlan: {
            searchId: "faq-fixture-trace-trim",
            filters: [
              { key: "make", values: ["Toyota"] },
              { key: "model", values: ["Highlander Hybrid"] },
              { key: "trim", values: ["Platinum"] },
            ],
          },
          isReadOnly: true,
        },
      ],
    },
    suggestedFollowUps: ["What makes this one better than the others I'm seeing?"],
  },
  meta: {
    traceId: "faq-fixture-trace-trim",
    timestamp: DEFAULT_TIMESTAMP,
  },
} as const satisfies VdpSearchFaqApiResponse;

export const VDP_SEARCH_FAQ_TRIM_COMPARISON_FIXTURE = trimComparisonFixture;

/**
 * "Better than others" fixture — triggered by "better than" / "makes this one" keywords.
 * Text-only answer with follow-ups that chain back to trim and cargo.
 */
const betterThanOthersFixture = {
  data: {
    vin: DEFAULT_VIN,
    query: VDP_FAQ_QUESTION_BETTER_THAN,
    searchContext: {
      scope: "vdp",
      searchId: null,
      isPersistent: false,
      source: "vdp-faq-pill",
    },
    answer: {
      summary: VDP_FAQ_ANSWER_BETTER_THAN,
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: VDP_FAQ_QUESTION_BETTER_THAN,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: VDP_FAQ_ANSWER_BETTER_THAN,
      },
    ],
    suggestedFollowUps: [
      "How does the Highlander Limited compare to XLE?",
      "What is the cargo space like?",
    ],
  },
  meta: {
    traceId: "faq-fixture-trace-better-than",
    timestamp: DEFAULT_TIMESTAMP,
  },
} as const satisfies VdpSearchFaqApiResponse;

export const VDP_SEARCH_FAQ_BETTER_THAN_FIXTURE = betterThanOthersFixture;
