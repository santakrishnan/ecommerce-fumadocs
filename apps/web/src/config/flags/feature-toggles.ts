/**
 * Feature toggle keys.
 *
 * Each flag here is a boolean toggle that can be:
 * - resolved server-side via `flagsServer` (cookies, headers, env)
 * - resolved client-side via `flagsClient` (localStorage, query params)
 *
 * Keep this list small and intentional. Toggles for features that have
 * shipped should be deleted after the migration is complete.
 */
export const FEATURE_TOGGLES = {
  EXAMPLE: "example",
  VDP_CERTIFICATION: "vdp_certification",
} as const;

export type FeatureToggle = (typeof FEATURE_TOGGLES)[keyof typeof FEATURE_TOGGLES];
