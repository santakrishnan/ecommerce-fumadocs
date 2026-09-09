import "server-only";

import { env } from "@config/env";
import { IMAGE_BASE_URL } from "@config/images";
import {
  VDP_FAQ_ANSWER_3RD_ROW,
  VDP_FAQ_ANSWER_BETTER_THAN,
  VDP_FAQ_ANSWER_TOWING,
  VDP_FAQ_ANSWER_TRIM_COMPARE,
} from "@features/vehicle-detail/bff/__fixtures__/vdp-search-faq.fixture";
import {
  AGENT_BEATS_DEMO_STREAM_FIXTURE,
  AGENT_BEATS_ERROR_STREAM_FIXTURE,
  AGENT_COMPARISON_LONG_TRIP_STREAM_FIXTURE,
  AGENT_COMPARISON_STREAM_FIXTURE,
  AGENT_ERROR_STREAM_FIXTURE,
  AGENT_INVENTORY_6_STREAM_FIXTURE,
  AGENT_INVENTORY_8_STREAM_FIXTURE,
  AGENT_INVENTORY_14_STREAM_FIXTURE,
  AGENT_INVENTORY_BUDGET_STREAM_FIXTURE,
  AGENT_INVENTORY_CITY_STREAM_FIXTURE,
  AGENT_INVENTORY_DALLAS_STREAM_FIXTURE,
  AGENT_INVENTORY_ELECTRIC_STREAM_FIXTURE,
  AGENT_INVENTORY_LONG_TEXT_STREAM_FIXTURE,
  AGENT_INVENTORY_LOW_MILEAGE_STREAM_FIXTURE,
  AGENT_INVENTORY_STREAM_FIXTURE,
  AGENT_INVENTORY_TRUCK_STREAM_FIXTURE,
  AGENT_OPTION_CATEGORY_STREAM_FIXTURE,
  AGENT_OPTION_FALLBACK_STREAM_FIXTURE,
  AGENT_OPTION_HYBRID_STREAM_FIXTURE,
  AGENT_OPTION_MODEL_STREAM_FIXTURE,
  AGENT_OPTION_NO_MATCHING_STREAM_FIXTURE,
  AGENT_OPTION_PACKAGE_STREAM_FIXTURE,
  AGENT_OPTION_SEGMENT_STREAM_FIXTURE,
  AGENT_OPTION_TRIM_STREAM_FIXTURE,
  AGENT_SPEC_1_STREAM_FIXTURE,
  AGENT_SPEC_2_STREAM_FIXTURE,
  AGENT_SPEC_3_STREAM_FIXTURE,
  AGENT_SPEC_4_STREAM_FIXTURE,
  AGENT_TEXT_ONLY_COMPETITOR_STREAM_FIXTURE,
  AGENT_TEXT_ONLY_NEGATIVE_STREAM_FIXTURE,
  AGENT_TEXT_ONLY_NO_MATCH_STREAM_FIXTURE,
  AGENT_TEXT_ONLY_OFF_TOPIC_STREAM_FIXTURE,
} from "../__fixtures__/agent.fixture";
import type { AgentSearchRequest } from "../contracts/agent-request.schema";

const INVENTORY_14_QUERY_REGEX = /\b14\s+inventory\b/;
const INVENTORY_8_QUERY_REGEX = /\b8\s+inventory\b/;
const INVENTORY_6_QUERY_REGEX = /\b6\s+inventory\b/;
const EV_WORD_BOUNDARY_REGEX = /\bev\b/;

/** Simulated delay between SSE frames. Override with SEARCH_AGENT_MOCK_DELAY_MS env var to slow
 * down stage transitions and observe the full loading animation (e.g. 2000 for 2s per stage). */
const MOCK_FRAME_DELAY_MS = env.SEARCH_AGENT_MOCK_DELAY_MS ?? 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rewriteSearchId(value: unknown, searchId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => rewriteSearchId(entry, searchId));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const rewritten: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(source)) {
    rewritten[key] = key === "searchId" ? searchId : rewriteSearchId(entryValue, searchId);
  }

  return rewritten;
}

// ─── Keyword → fixture mapping ───────────────────────────────────────────────
// Ordered array of [test, fixture] pairs. First match wins.

type FixtureMatcher = [test: (q: string) => boolean, fixture: unknown[]];

// ─── VDP FAQ SSE stream builders ─────────────────────────────────────────────
// Built from the shared answer constants in vdp-search-faq.fixture so there's
// a single source of truth for FAQ content across both BFF and SSE paths.

const VDP_SEARCH_ID = "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f";

function buildVdpFaqStream(
  summary: string,
  opts?: {
    results?: unknown[];
    totalCount?: number;
    optionLevel?: string;
    actions?: Array<{ label: string; href: string }>;
  }
): unknown[] {
  return [
    { type: "Status", searchId: VDP_SEARCH_ID, stage: "Planning" },
    { type: "Status", searchId: VDP_SEARCH_ID, stage: "Summarizing" },
    { type: "Delta", text: summary },
    {
      type: "Complete",
      payload: {
        searchId: VDP_SEARCH_ID,
        searchMode: "Exploration",
        filters: [],
        smartFilters: [],
        response: {
          responseMode: "OptionCards",
          summary,
          totalCount: opts?.totalCount ?? 0,
          optionLevel: opts?.optionLevel ?? "Fallback",
          results: opts?.results ?? [],
          ...(opts?.actions && { actions: opts.actions }),
        },
      },
    },
  ];
}

const AGENT_VDP_3RD_ROW_STREAM = buildVdpFaqStream(VDP_FAQ_ANSWER_3RD_ROW, {
  actions: [{ label: "What is the cargo space like?", href: "/search" }],
});

const AGENT_VDP_TOWING_STREAM = buildVdpFaqStream(VDP_FAQ_ANSWER_TOWING);

const AGENT_VDP_TRIM_COMPARISON_STREAM = buildVdpFaqStream(VDP_FAQ_ANSWER_TRIM_COMPARE, {
  totalCount: 3,
  optionLevel: "Trim",
  results: [
    {
      id: "opt-xle",
      title: "XLE",
      subtitle:
        "Heated seats, wireless charging, and a moonroof — everything you need at the best entry price.",
      image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
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
        searchId: VDP_SEARCH_ID,
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Highlander Hybrid"] },
          { key: "trim", values: ["XLE"] },
        ],
      },
    },
    {
      id: "opt-limited",
      title: "Limited",
      subtitle:
        "A genuine step up — real leather, bigger screens, and premium sound for a more refined ride.",
      image: `${IMAGE_BASE_URL}/images/model/highlander_hybrid_limited.png`,
      availableCount: 42,
      attributes: [
        { key: "wheels", label: "Wheels", value: '20"' },
        { key: "display", label: "Display", value: '12.3"' },
        { key: "interior", label: "Interior", value: "Leather, heated & ventilated front seats" },
        { key: "audio", label: "Audio", value: "11-speaker JBL" },
      ],
      nextSearchPlan: {
        searchId: VDP_SEARCH_ID,
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Highlander Hybrid"] },
          { key: "trim", values: ["Limited"] },
        ],
      },
    },
    {
      id: "opt-platinum",
      title: "Platinum",
      subtitle:
        "The flagship — everything in Limited plus a panoramic moonroof, head-up display, and hands-free power liftgate.",
      image: `${IMAGE_BASE_URL}/images/search/highlander-hybrid-2024.png`,
      availableCount: 23,
      attributes: [
        { key: "wheels", label: "Wheels", value: '20" chrome' },
        { key: "display", label: "Display", value: '12.3" + HUD' },
        { key: "interior", label: "Interior", value: "Semi-aniline leather, heated & ventilated" },
        { key: "audio", label: "Audio", value: "11-speaker JBL" },
      ],
      nextSearchPlan: {
        searchId: VDP_SEARCH_ID,
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Highlander Hybrid"] },
          { key: "trim", values: ["Platinum"] },
        ],
      },
    },
  ],
  actions: [{ label: "What makes this one better than the others I'm seeing?", href: "/search" }],
});

const AGENT_VDP_BETTER_THAN_STREAM = buildVdpFaqStream(VDP_FAQ_ANSWER_BETTER_THAN);

const FIXTURE_MATCHERS: FixtureMatcher[] = [
  // ─── VDP FAQ pill responses (exact match only — no overlap with general search) ───
  [(q) => q === "how comfortable is the 3rd row seating?", AGENT_VDP_3RD_ROW_STREAM],
  [(q) => q === "what is the towing capacity?", AGENT_VDP_TOWING_STREAM],
  [
    (q) => q === "what makes this one better than the others i'm seeing?",
    AGENT_VDP_BETTER_THAN_STREAM,
  ],
  [(q) => q === "how does limited compare to xle?", AGENT_VDP_TRIM_COMPARISON_STREAM],

  // Numeric inventory count variants (regex)
  [(q) => INVENTORY_14_QUERY_REGEX.test(q), AGENT_INVENTORY_14_STREAM_FIXTURE],
  [(q) => INVENTORY_8_QUERY_REGEX.test(q), AGENT_INVENTORY_8_STREAM_FIXTURE],
  [(q) => INVENTORY_6_QUERY_REGEX.test(q), AGENT_INVENTORY_6_STREAM_FIXTURE],
  // Beats checklist demo (PEDX01-2831) — checked before the generic "error"
  // match below, since "beats error" contains "error" as a substring.
  [(q) => q.includes("beats error"), AGENT_BEATS_ERROR_STREAM_FIXTURE],
  [(q) => q.includes("beats"), AGENT_BEATS_DEMO_STREAM_FIXTURE],
  // Error
  [(q) => q.includes("error"), AGENT_ERROR_STREAM_FIXTURE],
  // Spec card demos (1–4 attributes)
  [(q) => q.includes("4 spec"), AGENT_SPEC_4_STREAM_FIXTURE],
  [(q) => q.includes("3 spec"), AGENT_SPEC_3_STREAM_FIXTURE],
  [(q) => q.includes("2 spec"), AGENT_SPEC_2_STREAM_FIXTURE],
  [(q) => q.includes("1 spec"), AGENT_SPEC_1_STREAM_FIXTURE],
  // Option card scenarios (exploration)
  [(q) => q.includes("trim"), AGENT_OPTION_TRIM_STREAM_FIXTURE],
  [(q) => q.includes("package"), AGENT_OPTION_PACKAGE_STREAM_FIXTURE],
  [(q) => q.includes("category"), AGENT_OPTION_CATEGORY_STREAM_FIXTURE],
  [(q) => q.includes("segment"), AGENT_OPTION_SEGMENT_STREAM_FIXTURE],
  [(q) => q.includes("suv"), AGENT_OPTION_MODEL_STREAM_FIXTURE],
  [(q) => q.includes("hybrid"), AGENT_OPTION_HYBRID_STREAM_FIXTURE],
  [(q) => q.includes("family"), AGENT_OPTION_MODEL_STREAM_FIXTURE],
  // Comparison scenarios
  [
    (q) => q.includes("long trip") || q.includes("road trip"),
    AGENT_COMPARISON_LONG_TRIP_STREAM_FIXTURE,
  ],
  [
    (q) => q.includes("compare") || q.includes("comparison") || q.includes("cargo"),
    AGENT_COMPARISON_STREAM_FIXTURE,
  ],
  // Inventory scenarios (specific)
  [
    (q) => q.includes("long text") || q.includes("third row") || q.includes("scrolling"),
    AGENT_INVENTORY_LONG_TEXT_STREAM_FIXTURE,
  ],
  [(q) => q.includes("truck") && q.includes("dallas"), AGENT_INVENTORY_DALLAS_STREAM_FIXTURE],
  [(q) => q.includes("truck"), AGENT_INVENTORY_TRUCK_STREAM_FIXTURE],
  [
    (q) => q.includes("electric") || EV_WORD_BOUNDARY_REGEX.test(q) || q.includes("bz"),
    AGENT_INVENTORY_ELECTRIC_STREAM_FIXTURE,
  ],
  [
    (q) => q.includes("budget") || q.includes("under $") || q.includes("cheap"),
    AGENT_INVENTORY_BUDGET_STREAM_FIXTURE,
  ],
  [(q) => q.includes("city") || q.includes("commut"), AGENT_INVENTORY_CITY_STREAM_FIXTURE],
  [
    (q) => q.includes("low mileage") || q.includes("barely driven"),
    AGENT_INVENTORY_LOW_MILEAGE_STREAM_FIXTURE,
  ],
  [(q) => q.includes("inventory"), AGENT_INVENTORY_STREAM_FIXTURE],
  // Text-only / off-topic — each keyword has its own response
  [
    (q) => q.includes("off-topic") || q.includes("off topic") || q.includes("turtle"),
    AGENT_TEXT_ONLY_OFF_TOPIC_STREAM_FIXTURE,
  ],
  [(q) => q.includes("negative") || q.includes("sucks"), AGENT_TEXT_ONLY_NEGATIVE_STREAM_FIXTURE],
  [
    (q) => q.includes("competitor") || q.includes("ford"),
    AGENT_TEXT_ONLY_COMPETITOR_STREAM_FIXTURE,
  ],
  [(q) => q.includes("purple"), AGENT_TEXT_ONLY_NO_MATCH_STREAM_FIXTURE],
  // No-matching / editorial fallback
  [
    (q) => q.includes("no-matching") || q.includes("no matching"),
    AGENT_OPTION_NO_MATCHING_STREAM_FIXTURE,
  ],
  [(q) => q.includes("fallback"), AGENT_OPTION_FALLBACK_STREAM_FIXTURE],
];

function selectFixtureEvents(query: string): unknown[] {
  const normalized = query.toLowerCase();

  for (const [test, fixture] of FIXTURE_MATCHERS) {
    if (test(normalized)) {
      return fixture;
    }
  }

  return AGENT_OPTION_MODEL_STREAM_FIXTURE;
}

/**
 * Returns a mock SSE stream for the search agent backed by BFF fixtures.
 *
 * IMPORTANT: this keeps frontend data flow realistic. The browser calls
 * `/api/v1/search/agent`, the BFF chooses a fixture event stream, and emits
 * SSE frames. The frontend never imports fixtures directly.
 */
export function mockSearchAgentStream(
  request: AgentSearchRequest,
  _signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const searchId = request.searchId ?? crypto.randomUUID();
  const query = request.query ?? "";
  const events = selectFixtureEvents(query).map((event) => rewriteSearchId(event, searchId));

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        const eventType =
          typeof event === "object" && event !== null
            ? (event as Record<string, unknown>).type
            : undefined;
        if (eventType !== "Complete" && eventType !== "Error") {
          await delay(MOCK_FRAME_DELAY_MS);
        }
      }
      controller.close();
    },
  });
}
