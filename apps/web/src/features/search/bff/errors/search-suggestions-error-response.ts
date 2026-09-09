import { NextResponse } from "next/server";
import type {
  SearchSuggestionsError,
  SearchSuggestionsErrorCode,
} from "./search-suggestions.errors";

export interface SearchSuggestionsErrorBody {
  error: { code: SearchSuggestionsErrorCode; message: string };
}

export function searchSuggestionsErrorResponse(
  error: SearchSuggestionsError
): NextResponse<SearchSuggestionsErrorBody> {
  return NextResponse.json<SearchSuggestionsErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
