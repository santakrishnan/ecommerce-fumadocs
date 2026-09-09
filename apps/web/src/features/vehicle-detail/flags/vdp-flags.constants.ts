/**
 * VDP flag cookie names and types.
 *
 * Side-effect-free module — safe to import from any page without
 * pulling in the Flags SDK or requiring FLAGS_SECRET.
 *
 * INTENTIONALLY EXEMPT from the `__Host-`/secure/httpOnly cookie convention.
 * These are dev-only test utilities set client-side via `document.cookie` from
 * a dev-only UI and read back by client JS, so they cannot be `httpOnly` and
 * do not carry the `__Host-` prefix.
 */

export type VdpCertificationTier = "gold" | "silver" | "false";
export type VdpFeatureCount = "none" | "1" | "2" | "3";

/** Cookie name used for certification overrides */
export const VDP_COOKIE_CERTIFICATION = "vercel-flag-override-vdp-certification";
/** Cookie name used for feature count overrides */
export const VDP_COOKIE_FEATURE_COUNT = "vercel-flag-override-vdp-feature-count";
/** Cookie name used to simulate no-photos state */
export const VDP_COOKIE_NO_PHOTOS = "vercel-flag-override-vdp-no-photos";
/** Cookie name used to force sold state (no server restart needed) */
export const VDP_COOKIE_SOLD = "vercel-flag-override-vdp-sold";
