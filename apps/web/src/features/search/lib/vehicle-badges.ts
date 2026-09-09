/**
 * vehicle-badges.ts — derives up to 2 UX badges for a vehicle card from a
 * v360 v3 payload.
 *
 * All badge candidates are ranked by customer value in a single flat priority
 * list. The top 2 are returned. Only 6 badge types qualify — chosen because each
 * either directly drives purchase decisions or creates strong emotional pull at
 * a glance.
 *
 * Priority order (highest value first):
 *   1. Great Deal / Good Deal        — directly answers "should I buy this?"
 *   2. 3rd Row                       — hard seating filter for families
 *   3. Sunroof / Ventilated Seats    — high emotional appeal, lifestyle signal
 *   4. 360° Camera / Adaptive Cruise — premium safety differentiators
 *   5. Heated Seats / Leather        — popular comfort upgrades
 *   6. Certified                     — trust signal for used vehicles
 *
 * Confidence guard: canonical features below MIN_MATCH_CONFIDENCE are excluded
 * to avoid mis-matches (e.g. "Cloth upholstery" fuzzy-matched → "Heated Seats").
 *
 * Usage:
 *   import { getBadges } from "./vehicle-badges";
 *   const { badges } = getBadges(vehicleData); // badges.length <= 2
 */

import type { InventoryBadgeData } from "@shared/components/inventory-card";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/** Hard cap on badges returned per vehicle. */
const MAX_BADGES = 2;

/**
 * Minimum match confidence for canonical feature resolution.
 * Synth matches (0.95) always pass. Fuzzy matches below this threshold are excluded.
 */
const MIN_MATCH_CONFIDENCE = 0.7;

// ─────────────────────────────────────────────────────────────────────────────
// Badge types
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeCategory = "deal" | "seating" | "comfort" | "safety" | "certification";

export interface VehicleBadge {
  /** Category used for icon selection and colour theming. */
  category: BadgeCategory;
  /** Short display label shown on the card. */
  label: string;
  /**
   * The field or canonical key that triggered this badge.
   * Useful for analytics and test assertions.
   */
  source: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload types (minimal subset of v360 v3 `data` consumed here)
// ─────────────────────────────────────────────────────────────────────────────

interface KeyFeatureEntry {
  category: string;
  isStandard: boolean;
  key: string;
  label: string;
  msrp: number | null;
  via?: string;
}

interface ComparisonAxes {
  dealRating?: string | null;
  isCertified?: boolean;
  keyFeatures?: KeyFeatureEntry[];
}

interface ComputedBlock {
  comparisonAxes?: ComparisonAxes;
  dealRating?: string | null;
  isCertified?: boolean;
}

interface FeatureItem {
  canonicalId?: string | null;
  matchConfidence?: number;
  matchMethod?: string;
  name: string;
}

interface FeatureCategoryGroup {
  category: string;
  items: FeatureItem[];
}

interface FeaturesBlock {
  byCategory?: FeatureCategoryGroup[];
  items?: FeatureItem[];
}

interface StatusBlock {
  isCertified?: boolean;
}

/** Minimal slice of the v360 v3 `data` payload consumed by this module. */
export interface V360VehicleData {
  computed?: ComputedBlock;
  features?: FeaturesBlock;
  status?: StatusBlock;
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate registry
// ─────────────────────────────────────────────────────────────────────────────

/** Internal representation before final selection. Lower priority number = higher value. */
interface BadgeCandidate extends VehicleBadge {
  priority: number;
}

/** Positive deal ratings that merit a badge. Negative/neutral signals are excluded. */
const POSITIVE_DEAL_RATINGS: ReadonlySet<string> = new Set(["Great Deal", "Good Deal"]);

interface FeatureBadgeDef {
  canonicalKey: string;
  category: BadgeCategory;
  label: string;
  /** Lower = higher customer value. */
  priority: number;
}

/**
 * The complete set of feature-keyed badge candidates.
 * If a vehicle has a feature whose canonicalKey appears here AND it passes the
 * confidence threshold, it becomes a candidate at the listed priority.
 */
const FEATURE_BADGE_DEFS: readonly FeatureBadgeDef[] = [
  // Priority 20 — 3rd Row: hard seating filter
  { canonicalKey: "seating.third_row", label: "3rd Row", category: "seating", priority: 20 },
  // Priority 30 — Sunroof / Ventilated Seats: high emotional appeal
  { canonicalKey: "comfort.moonroof", label: "Sunroof", category: "comfort", priority: 30 },
  {
    canonicalKey: "seat.ventilated.front",
    label: "Ventilated Seats",
    category: "comfort",
    priority: 31,
  },
  // Priority 40 — Premium safety differentiators
  {
    canonicalKey: "safety.surround_view_camera",
    label: "360° Camera",
    category: "safety",
    priority: 40,
  },
  {
    canonicalKey: "safety.adaptive_cruise_control",
    label: "Adaptive Cruise",
    category: "safety",
    priority: 41,
  },
  // Priority 50 — Popular comfort upgrades
  {
    canonicalKey: "comfort.heated_seats.front",
    label: "Heated Seats",
    category: "comfort",
    priority: 50,
  },
  { canonicalKey: "seat.leather", label: "Leather Seats", category: "comfort", priority: 51 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature key resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the set of confirmed canonical feature keys from the payload.
 * Prefers `computed.comparisonAxes.keyFeatures` (already curated by the enrichment
 * pipeline); falls back to `features.items` / `features.byCategory` with confidence
 * filtering to guard against low-quality fuzzy matches.
 */
function resolvedFeatureKeys(data: V360VehicleData): ReadonlySet<string> {
  const keyFeatures = data.computed?.comparisonAxes?.keyFeatures;
  if (keyFeatures?.length) {
    return new Set(keyFeatures.map((kf) => kf.key));
  }

  const featureBlock = data.features ?? {};
  const items: FeatureItem[] =
    featureBlock.items ?? featureBlock.byCategory?.flatMap((g) => g.items) ?? [];

  const keys = new Set<string>();
  for (const item of items) {
    const cid = item.canonicalId;
    if (!cid) {
      continue;
    }

    const isSynth = item.matchMethod === "synth";
    const confidence = item.matchConfidence ?? 0;
    if (isSynth || confidence >= MIN_MATCH_CONFIDENCE) {
      keys.add(cid);
    }
  }
  return keys;
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate builder
// ─────────────────────────────────────────────────────────────────────────────

function buildCandidates(data: V360VehicleData): BadgeCandidate[] {
  const candidates: BadgeCandidate[] = [];
  const computed = data.computed ?? {};
  const axes = computed.comparisonAxes ?? {};
  const status = data.status ?? {};

  const push = (c: BadgeCandidate) => candidates.push(c);

  // ── Priority 10: Deal rating ──────────────────────────────────────────────
  const dealRating = computed.dealRating ?? axes.dealRating;
  if (dealRating && POSITIVE_DEAL_RATINGS.has(dealRating)) {
    push({ label: dealRating, category: "deal", source: "computed.dealRating", priority: 10 });
  }

  // ── Priorities 20–51: Feature-keyed candidates ───────────────────────────
  const featureKeys = resolvedFeatureKeys(data);
  for (const def of FEATURE_BADGE_DEFS) {
    if (featureKeys.has(def.canonicalKey)) {
      push({
        label: def.label,
        category: def.category,
        source: def.canonicalKey,
        priority: def.priority,
      });
    }
  }

  // ── Priority 60: Certified ────────────────────────────────────────────────
  // Listed last — valuable for used vehicles but too common to lead the card.
  // The certified signal can appear in any of `computed`, `status`, or
  // `comparisonAxes`, and is populated inconsistently across feeds. Use OR
  // (not `??`) so a `true` in any source wins — an explicit `false` in an
  // earlier source must not suppress a `true` in a later one.
  if (computed.isCertified || status.isCertified || axes.isCertified) {
    push({
      label: "Certified",
      category: "certification",
      source: "status.isCertified",
      priority: 60,
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface BadgeResult {
  /** Up to 2 badges, ranked by customer value (highest first). */
  badges: VehicleBadge[];
}

/**
 * Returns up to 2 badges for a vehicle card, ranked by customer value.
 *
 * @param data  The `data` object from a `v360.vehicle.changed` CloudEvent (v3).
 */
export function getBadges(data: V360VehicleData): BadgeResult {
  const badges: VehicleBadge[] = buildCandidates(data)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_BADGES)
    .map(({ label, category, source }) => ({ label, category, source }));

  return { badges };
}

// ─────────────────────────────────────────────────────────────────────────────
// Card adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adapts the highest-ranked badge to the inventory card's single-pill shape.
 *
 * The card surface shows one badge, so we surface the top-priority result from
 * {@link getBadges}. Deal badges use the price-tag icon; all others use the
 * four-pointed star (`toyota-x`). Both render red via `text-brand`. Returns
 * `undefined` when no badge qualifies.
 */
export function resolveCardBadge(data: V360VehicleData): InventoryBadgeData | undefined {
  const [top] = getBadges(data).badges;
  if (!top) {
    return;
  }

  const iconName = top.category === "deal" ? "price-tag-filled" : "toyota-x";
  return { iconName, label: top.label };
}
