import { NextResponse } from "next/server";
import type { ProfileError, ProfileErrorCode } from "./profile.errors";

export interface ProfileErrorBody {
  error: { code: ProfileErrorCode; message: string };
}

export function profileErrorResponse(error: ProfileError): NextResponse<ProfileErrorBody> {
  return NextResponse.json<ProfileErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
