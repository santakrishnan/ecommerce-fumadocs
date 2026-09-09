import "server-only";

import {
  BROWSE_BY_STYLE_EMPTY_RESPONSE,
  BROWSE_BY_STYLE_SUCCESS_RESPONSE,
  BROWSE_BY_STYLE_VALIDATION_ERROR_RESPONSE,
} from "@features/landing/__fixtures__/browse-by-style.fixtures";
import {
  type BrowseByStyleRouteResponse,
  browseByStyleRouteResponseSchema,
} from "../../contracts/browse-by-style.schema";

type BrowseByStyleFixture = "empty" | "success";

const VALID_FIXTURES = new Set<string>(["empty", "success"]);

function toFixture(value: string | null | undefined): BrowseByStyleFixture {
  if (value == null) {
    return "success";
  }

  if (VALID_FIXTURES.has(value)) {
    return value as BrowseByStyleFixture;
  }

  console.warn(
    `[getBrowseByStyleResponse] Unknown fixture value "${value}", defaulting to "success"`
  );
  return "success";
}

/**
 * Feature-scoped Browse By Style resolver.
 *
 * Returns static/mock-backed Browse By Style card row data,
 * validated at the boundary per ADR-7. The fixture parameter allows
 * integration/demo flows to toggle between success and empty states.
 *
 * When real backend integration exists, this function will delegate
 * to an upstream adapter while preserving the same return type.
 */
export function getBrowseByStyleResponse(fixture?: string | null): BrowseByStyleRouteResponse {
  const resolvedFixture = toFixture(fixture);
  const payload =
    resolvedFixture === "empty" ? BROWSE_BY_STYLE_EMPTY_RESPONSE : BROWSE_BY_STYLE_SUCCESS_RESPONSE;

  const parsed = browseByStyleRouteResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(
      "[getBrowseByStyleResponse] Invalid Browse By Style payload",
      parsed.error.issues
    );
    return BROWSE_BY_STYLE_VALIDATION_ERROR_RESPONSE;
  }

  return parsed.data;
}
