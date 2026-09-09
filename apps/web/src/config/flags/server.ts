import "server-only";

import type { FeatureToggle } from "./feature-toggles";

/**
 * Server-side feature flag resolution.
 *
 * Replace with your real flag service (LaunchDarkly, GrowthBook, Flipt, etc.).
 * The stub below reads from FEATURE_FLAG_<name> env vars.
 */
export function isFeatureEnabledOnServer(flag: FeatureToggle): boolean {
  const envKey = `FEATURE_FLAG_${flag.toUpperCase()}`;
  return process.env[envKey] === "true";
}
