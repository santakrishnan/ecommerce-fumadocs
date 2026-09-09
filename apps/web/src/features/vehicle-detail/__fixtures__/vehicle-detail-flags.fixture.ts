/**
 * Pre-composed VDP flag combinations for testing.
 *
 * Each set represents a complete state that can be applied at once.
 * Useful for iterating through all variants during QA without manual flag toggling.
 */

import type { VdpCertificationTier, VdpFeatureCount } from "../flags/vdp-flags";

export interface VdpFlagSet {
  certification: VdpCertificationTier;
  featureCount: VdpFeatureCount;
  /** Human-readable name for the scenario */
  label: string;
}

/** Silver certified, some features — mid-tier */
export const FLAGS_SILVER_SOME: VdpFlagSet = {
  certification: "silver",
  featureCount: "2",
  label: "Silver + Some Features",
};

/** Uncertified, no features — bare minimum VDP */
export const FLAGS_UNCERTIFIED_NONE: VdpFlagSet = {
  certification: "false",
  featureCount: "none",
  label: "Uncertified + No Features",
};

/** Gold certified but no curated features */
export const FLAGS_GOLD_MINIMAL: VdpFlagSet = {
  certification: "gold",
  featureCount: "none",
  label: "Gold + No Features",
};

/** All pre-composed flag sets for iteration */
export const ALL_VDP_FLAG_SETS: VdpFlagSet[] = [
  FLAGS_SILVER_SOME,
  FLAGS_UNCERTIFIED_NONE,
  FLAGS_GOLD_MINIMAL,
];
