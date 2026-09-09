import "server-only";

import {
  VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE,
  VDP_SEARCH_FAQ_BETTER_THAN_FIXTURE,
  VDP_SEARCH_FAQ_CARGO_SPACE_FIXTURE,
  VDP_SEARCH_FAQ_TOWING_FIXTURE,
  VDP_SEARCH_FAQ_TRIM_COMPARISON_FIXTURE,
} from "../__fixtures__/vdp-search-faq.fixture";
import type { VdpSearchFaqApiResponse } from "../contracts/vdp-search-faq.schema";

const MOCK_DELAY_MS = 50;

/** Lowercase keyword → fixture mapping for question routing. */
const QUESTION_FIXTURES: Array<{
  keywords: string[];
  fixture: VdpSearchFaqApiResponse;
}> = [
  {
    keywords: ["towing", "tow"],
    fixture: VDP_SEARCH_FAQ_TOWING_FIXTURE,
  },
  {
    keywords: ["cargo", "trunk", "storage"],
    fixture: VDP_SEARCH_FAQ_CARGO_SPACE_FIXTURE,
  },
  {
    keywords: ["better than", "makes this one"],
    fixture: VDP_SEARCH_FAQ_BETTER_THAN_FIXTURE,
  },
  {
    keywords: ["limited", "xle", "platinum"],
    fixture: VDP_SEARCH_FAQ_TRIM_COMPARISON_FIXTURE,
  },
];

function resolveFixture(question: string): VdpSearchFaqApiResponse {
  const lower = question.toLowerCase();
  for (const { keywords, fixture } of QUESTION_FIXTURES) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return fixture;
    }
  }
  return VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE;
}

export async function mockVdpSearchFaq(
  vin: string,
  question: string,
  traceId: string
): Promise<VdpSearchFaqApiResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const base = resolveFixture(question);

  const assistantMsg = base.data.messages[1];

  return {
    ...base,
    data: {
      ...base.data,
      vin: vin.toUpperCase(),
      query: question,
      messages: [
        { id: "msg-1", role: "user" as const, content: question },
        {
          id: assistantMsg?.id ?? "msg-2",
          role: assistantMsg?.role ?? ("assistant" as const),
          content: assistantMsg?.content ?? "",
        },
      ],
    },
    meta: {
      ...base.meta,
      traceId,
    },
  };
}
