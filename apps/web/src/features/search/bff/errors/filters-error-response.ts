import { NextResponse } from "next/server";
import type { FiltersError, FiltersErrorCode } from "./filters.errors";

export interface FiltersErrorBody {
  error: { code: FiltersErrorCode; message: string };
  meta: { traceId: string; timestamp: string };
}

/**
 * Convert a FiltersError into a typed NextResponse.
 * Use in route handlers to avoid repeating error serialization logic.
 */
export function filtersErrorResponse(error: FiltersError): NextResponse<FiltersErrorBody> {
  return NextResponse.json<FiltersErrorBody>(
    {
      error: { code: error.code, message: error.message },
      meta: { traceId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    },
    { status: error.status }
  );
}
