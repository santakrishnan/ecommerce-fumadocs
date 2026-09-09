import {
  getProfileResolve,
  profileErrorResponse,
  setProfileResolveIdentityCookies,
} from "@features/profile/bff";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
} from "@shared/lib/http/status-codes";
import type { ResolveResponse } from "@ucmp/sdk-visitor-profile-api";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/profile/resolve
 *
 * Extends the VPS session for the current fingerprint and returns the
 * full resolved-identity envelope for downstream callers.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  const fingerprintId =
    request.cookies.get(TRACKING_COOKIE.FP_ID)?.value ??
    request.nextUrl.searchParams.get("fpHash")?.trim() ??
    "";

  if (!fingerprintId) {
    return new NextResponse(null, { status: HTTP_STATUS_NO_CONTENT });
  }

  try {
    const result = await getProfileResolve(fingerprintId);

    if (!result.success) {
      return profileErrorResponse(result.error);
    }

    const body: ResolveResponse = {
      data: result.data,
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
      },
    };

    const response = NextResponse.json<ResolveResponse>(body);
    setProfileResolveIdentityCookies(response, body.data);
    return response;
  } catch {
    return profileErrorResponse({
      code: "PROFILE_INTERNAL_ERROR",
      message: "Failed to resolve visitor profile",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
