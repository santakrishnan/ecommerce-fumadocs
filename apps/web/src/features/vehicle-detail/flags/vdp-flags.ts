import { flag } from "flags/next";
import type { VdpCertificationTier, VdpFeatureCount } from "./vdp-flags.constants";

// Re-export constants and types so existing imports still work
export type { VdpCertificationTier, VdpFeatureCount } from "./vdp-flags.constants";
export {
  VDP_COOKIE_CERTIFICATION,
  VDP_COOKIE_FEATURE_COUNT,
} from "./vdp-flags.constants";

/**
 * VDP Feature Flags
 *
 * Flag definitions for documentation, options metadata, and future provider wiring.
 * The VDP page reads overrides directly from cookies via the constants above.
 */

export const vdpCertification = flag<VdpCertificationTier>({
  key: "vdp-certification",
  defaultValue: "false",
  description: "Vehicle certification tier (gold, silver, or none)",
  options: [
    { value: "false", label: "None" },
    { value: "gold", label: "Gold Certified" },
    { value: "silver", label: "Silver Certified" },
  ],
  decide() {
    return this.defaultValue as VdpCertificationTier;
  },
});

export const vdpFeatureCount = flag<VdpFeatureCount>({
  key: "vdp-feature-count",
  defaultValue: "3",
  description: "Number of curated feature cards to display",
  options: [
    { value: "none", label: "None" },
    { value: "1", label: "1 card" },
    { value: "2", label: "2 cards" },
    { value: "3", label: "3 cards" },
  ],
  decide() {
    return this.defaultValue as VdpFeatureCount;
  },
});
