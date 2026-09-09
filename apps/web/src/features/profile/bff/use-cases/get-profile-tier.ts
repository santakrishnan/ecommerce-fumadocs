import "server-only";

import {
  DEFAULT_PROFILE_TIER,
  PROFILE_TIER_COOKIE,
  type ProfileTier,
  profileTierSchema,
} from "@config/profile-tier";
import { cookies } from "next/headers";

/**
 * Resolve the active profile tier for the current request.
 *
 * Reads the `demo-profile-tier` cookie, validates the value against the closed
 * tier enum, and returns the default (`t0`) when the cookie is absent or
 * contains an unrecognised value. Never throws — invalid values fail quietly to
 * the default so the profile page always has a well-typed tier.
 */
export async function getProfileTier(): Promise<ProfileTier> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PROFILE_TIER_COOKIE)?.value;
  const parsed = profileTierSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_PROFILE_TIER;
}
