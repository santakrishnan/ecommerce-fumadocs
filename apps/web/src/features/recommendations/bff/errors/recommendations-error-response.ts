import { NextResponse } from "next/server";
import type { RecommendationsError, RecommendationsErrorCode } from "./recommendations.errors";

export interface RecommendationsErrorBody {
  error: { code: RecommendationsErrorCode; message: string };
}

export function recommendationsErrorResponse(
  error: RecommendationsError
): NextResponse<RecommendationsErrorBody> {
  return NextResponse.json<RecommendationsErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
