"use server";

import { PROFILE_TIER_COOKIE, profileTierCookie, profileTierSchema } from "@config/profile-tier";
import { cookies } from "next/headers";

export interface SetProfileTierResult {
  success: boolean;
}

/**
 * Persist the selected profile tier in the `demo-profile-tier` cookie.
 *
 * The value is validated against the closed tier enum before it is written — an
 * invalid value is a no-op returning `{ success: false }`.
 *
 * Server Actions are publicly-callable endpoints and TypeScript types are
 * erased at runtime, so the payload is validated here regardless of the caller.
 */
export async function setProfileTier(value: string): Promise<SetProfileTierResult> {
  const parsed = profileTierSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(PROFILE_TIER_COOKIE, parsed.data, {
    httpOnly: profileTierCookie.httpOnly,
    secure: profileTierCookie.secure,
    sameSite: profileTierCookie.sameSite,
    path: profileTierCookie.path,
    maxAge: profileTierCookie.maxAge,
  });

  return { success: true };
}

/**
 * Clear the `demo-profile-tier` cookie so tier resolution falls back to the
 * default (`t0`).
 */
export async function resetProfileTier(): Promise<SetProfileTierResult> {
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_TIER_COOKIE);
  return { success: true };
}
