"use client";

import type { FeatureToggle } from "./feature-toggles";

/**
 * Client-side feature flag resolution.
 *
 * Replace with your real flag client (LaunchDarkly, GrowthBook, etc.).
 * The stub below reads from the public NEXT_PUBLIC_FEATURE_FLAG_<name> env vars.
 */
export function isFeatureEnabled(flag: FeatureToggle): boolean {
  if (typeof process === "undefined") {
    return false;
  }
  const envKey = `NEXT_PUBLIC_FEATURE_FLAG_${flag.toUpperCase()}`;
  return process.env[envKey] === "true";
}
