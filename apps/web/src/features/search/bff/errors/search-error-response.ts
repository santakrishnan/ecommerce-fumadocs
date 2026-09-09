import { NextResponse } from "next/server";
import type { SearchError, SearchErrorCode } from "./search.errors";

export interface SearchErrorBody {
  error: { code: SearchErrorCode; message: string };
  meta: { traceId: string; timestamp: number };
}

export function searchErrorResponse(
  error: SearchError,
  traceId: string
): NextResponse<SearchErrorBody> {
  return NextResponse.json<SearchErrorBody>(
    {
      error: { code: error.code, message: error.message },
      meta: { traceId, timestamp: Date.now() },
    },
    { status: error.status }
  );
}
