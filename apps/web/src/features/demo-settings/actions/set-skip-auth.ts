"use server";

import { SKIP_AUTH_COOKIE, skipAuthCookie, skipAuthSchema } from "@config/skip-auth";
import { cookies } from "next/headers";

export interface SetSkipAuthResult {
  success: boolean;
}

/**
 * Persist the skip-auth toggle in the `demo-skip-auth` cookie.
 * Non-httpOnly so GuardedLink can read it client-side.
 */
export async function setSkipAuth(value: string): Promise<SetSkipAuthResult> {
  const parsed = skipAuthSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(SKIP_AUTH_COOKIE, parsed.data, {
    httpOnly: skipAuthCookie.httpOnly,
    secure: skipAuthCookie.secure,
    sameSite: skipAuthCookie.sameSite,
    path: skipAuthCookie.path,
    maxAge: skipAuthCookie.maxAge,
  });

  return { success: true };
}

export async function resetSkipAuth(): Promise<SetSkipAuthResult> {
  const cookieStore = await cookies();
  cookieStore.delete(SKIP_AUTH_COOKIE);
  return { success: true };
}
