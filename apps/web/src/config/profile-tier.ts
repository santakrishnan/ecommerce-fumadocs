import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import { z } from "zod";

/**
 * Profile tier demo override — cookie contract + option metadata.
 *
 * Side-effect-free module: no `server-only`, no `next/headers`. Safe to import
 * from both the server (resolver, Server Action) and the client (the
 * `/demo-settings` picker), so the cookie name, the allowed values, and the
 * option labels live in exactly one place.
 *
 * The server-only resolver that reads the cookie lives in
 * `@features/profile/bff` (`getProfileTier`).
 */

/** One year, in seconds. */
const PROFILE_TIER_COOKIE_TTL = 60 * 60 * 24 * 365;

/**
 * Overrides the active profile tier at runtime (set via `/demo-settings`, read by
 * `getProfileTier()` and `proxy.ts`). `buildCookieConfig` (client-safe) applies the
 * prod `__Host-` prefix.
 *
 * Non-httpOnly so client components (e.g. GuardedLink) can read it via
 * `document.cookie` without a server round-trip — same pattern as `skip-auth`.
 */
export const profileTierCookie = buildCookieConfig("demo-profile-tier", PROFILE_TIER_COOKIE_TTL, {
  httpOnly: false,
  sameSite: "lax",
});

export const PROFILE_TIER_COOKIE = profileTierCookie.name;

/** Profile tiers available to override via the demo settings picker. */
export const profileTierSchema = z.enum(["t0", "t1", "t2", "t3"]);

export type ProfileTier = z.infer<typeof profileTierSchema>;

/** Fallback tier when the cookie is absent or contains an invalid value. */
export const DEFAULT_PROFILE_TIER: ProfileTier = "t0";

/** Tiers that represent a linked (authenticated) visitor. */
export const LINKED_TIERS: ReadonlySet<ProfileTier> = new Set(["t2", "t3"]);

interface ProfileTierOption {
  description: string;
  title: string;
  value: ProfileTier;
}

/**
 * Ordered options for the `/demo-settings` picker. Single source of truth for
 * the labels shown next to each radio choice.
 */
export const PROFILE_TIER_OPTIONS: readonly ProfileTierOption[] = [
  {
    value: "t0",
    title: "T0 — Anonymous",
    description: "No identity signal. Visitor is unknown; no personalisation applied. Default.",
  },
  {
    value: "t1",
    title: "T1 — Reachable",
    description: "Fingerprint or email captured. Visitor can be re-contacted but is not logged in.",
  },
  {
    value: "t2",
    title: "T2 — Identified",
    description: "Authenticated session. Full profile data is available for personalisation.",
  },
  {
    value: "t3",
    title: "T3 — Qualified",
    description: "Authenticated and qualified lead. Highest-intent segment; full feature access.",
  },
] as const;
