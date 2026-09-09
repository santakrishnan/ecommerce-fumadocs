import { NextResponse } from "next/server";
import type { SearchRecentError, SearchRecentErrorCode } from "./search-recent.errors";

export interface SearchRecentErrorBody {
  error: { code: SearchRecentErrorCode; message: string };
}

export function searchRecentErrorResponse(
  error: SearchRecentError
): NextResponse<SearchRecentErrorBody> {
  return NextResponse.json<SearchRecentErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
