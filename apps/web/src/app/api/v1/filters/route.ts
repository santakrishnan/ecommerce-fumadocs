import {
  type FiltersErrorBody,
  FiltersRequestSchema,
  type FiltersResponse,
  filtersErrorResponse,
  getFilters,
} from "@features/search/bff";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_BAD_REQUEST } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/filters
 *
 * Returns available search filter dimensions scoped to the visitor's location.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<FiltersResponse | FiltersErrorBody>> {
  const identity = await readVisitorIdentity();
  const traceId = request.headers.get("X-Trace-Id") ?? crypto.randomUUID();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return filtersErrorResponse({
      code: "FILTERS_VALIDATION_FAILED",
      message: "Failed to parse request body",
      status: HTTP_STATUS_BAD_REQUEST,
    });
  }

  const parsed = FiltersRequestSchema.safeParse(body);
  if (!parsed.success) {
    return filtersErrorResponse({
      code: "FILTERS_VALIDATION_FAILED",
      message: parsed.error.issues[0]?.message ?? "Request validation failed",
      status: HTTP_STATUS_BAD_REQUEST,
    });
  }

  const result = await getFilters(parsed.data, traceId, identity);

  if (!result.success) {
    return filtersErrorResponse(result.error);
  }

  return NextResponse.json<FiltersResponse>(result.data);
}
