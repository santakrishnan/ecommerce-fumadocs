import { NextResponse } from "next/server";
import type { AutocompleteError, AutocompleteErrorCode } from "./autocomplete.errors";

export interface AutocompleteErrorBody {
  error: { code: AutocompleteErrorCode; message: string };
  meta: { traceId: string; timestamp: string };
}

/**
 * Convert an AutocompleteError into a typed NextResponse.
 * Use in route handlers to avoid repeating error serialization logic.
 */
export function autocompleteErrorResponse(
  error: AutocompleteError
): NextResponse<AutocompleteErrorBody> {
  return NextResponse.json<AutocompleteErrorBody>(
    {
      error: { code: error.code, message: error.message },
      meta: { traceId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    },
    { status: error.status }
  );
}
