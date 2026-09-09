// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getBadges, resolveCardBadge, type V360VehicleData } from "../vehicle-badges";

/** keyFeatures exactly as returned for the 2026 Tacoma TRD Sport (ticket payload). */
const TACOMA_KEY_FEATURES = [
  {
    key: "comfort.heated_steering_wheel",
    label: "Heated steering wheel",
    category: "Comfort",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "convenience.smart_key",
    label: "Smart Key",
    category: "Convenience",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "convenience.remote_start",
    label: "Remote start",
    category: "Convenience",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "exterior.alloy_wheels",
    label: "Alloy wheels",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "technology.smartphone_integration",
    label: "CarPlay & Android Auto",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "safety.blind_spot_monitor",
    label: "Blind Spot Monitor",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "safety.adaptive_cruise_control",
    label: "Dynamic Radar Cruise Control",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "safety.toyota_safety_sense",
    label: "Toyota Safety Sense",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "comfort.heated_seats.front",
    label: "Heated front seats",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "technology.premium_audio",
    label: "JBL Premium Audio",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "safety.lane_departure_alert",
    label: "Lane Departure Alert",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "safety.pre_collision_system",
    label: "Pre-Collision System",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "comfort.moonroof",
    label: "Power Tilt/Slide Moonroof",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "towing.tow_package",
    label: "Trailer hitch",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
  {
    key: "technology.wifi_hotspot",
    label: "Wi-Fi Connect",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
];

describe("getBadges", () => {
  it("returns the top 2 feature badges from the real Tacoma keyFeatures", () => {
    const data: V360VehicleData = {
      computed: { comparisonAxes: { keyFeatures: TACOMA_KEY_FEATURES } },
    };

    // Candidates: Sunroof (30), Adaptive Cruise (41), Heated Seats (50) → top 2.
    expect(getBadges(data).badges).toEqual([
      { label: "Sunroof", category: "comfort", source: "comfort.moonroof" },
      { label: "Adaptive Cruise", category: "safety", source: "safety.adaptive_cruise_control" },
    ]);
  });

  it("leads with a positive deal rating over features", () => {
    const data: V360VehicleData = {
      computed: {
        dealRating: "Great Deal",
        comparisonAxes: {
          keyFeatures: [
            {
              key: "comfort.moonroof",
              label: "Moonroof",
              category: "General",
              isStandard: true,
              msrp: 0,
            },
          ],
        },
      },
    };

    expect(getBadges(data).badges).toEqual([
      { label: "Great Deal", category: "deal", source: "computed.dealRating" },
      { label: "Sunroof", category: "comfort", source: "comfort.moonroof" },
    ]);
  });

  it("ignores non-positive deal ratings", () => {
    const data: V360VehicleData = { computed: { dealRating: "Overpriced", comparisonAxes: {} } };
    expect(getBadges(data).badges).toEqual([]);
  });

  it("places Certified last", () => {
    const data: V360VehicleData = {
      status: { isCertified: true },
      computed: {
        comparisonAxes: {
          keyFeatures: [
            {
              key: "comfort.heated_seats.front",
              label: "Heated",
              category: "General",
              isStandard: true,
              msrp: 0,
            },
          ],
        },
      },
    };

    expect(getBadges(data).badges).toEqual([
      { label: "Heated Seats", category: "comfort", source: "comfort.heated_seats.front" },
      { label: "Certified", category: "certification", source: "status.isCertified" },
    ]);
  });

  it("derives Certified from comparisonAxes even when status.isCertified is false", () => {
    // Regression: `status.isCertified ?? axes.isCertified` used to short-circuit
    // on an explicit `false`, suppressing a genuinely certified vehicle.
    const data: V360VehicleData = {
      status: { isCertified: false },
      computed: { comparisonAxes: { isCertified: true } },
    };

    expect(getBadges(data).badges).toEqual([
      { label: "Certified", category: "certification", source: "status.isCertified" },
    ]);
  });

  it("derives Certified from computed top-level isCertified", () => {
    const data: V360VehicleData = { computed: { isCertified: true } };

    expect(getBadges(data).badges).toEqual([
      { label: "Certified", category: "certification", source: "status.isCertified" },
    ]);
  });

  it("falls back to features.items with confidence filtering when keyFeatures is absent", () => {
    const data: V360VehicleData = {
      features: {
        items: [
          { canonicalId: "seating.third_row", name: "Third row seat", matchConfidence: 0.9 },
          // Low-confidence fuzzy match — excluded by the confidence guard.
          { canonicalId: "comfort.heated_seats.front", name: "Cloth seats", matchConfidence: 0.5 },
          // Synth match always passes regardless of confidence.
          {
            canonicalId: "comfort.moonroof",
            name: "Moonroof",
            matchMethod: "synth",
            matchConfidence: 0,
          },
        ],
      },
    };

    // 3rd Row (20) and Sunroof (30) qualify; heated seats excluded (low confidence).
    expect(getBadges(data).badges).toEqual([
      { label: "3rd Row", category: "seating", source: "seating.third_row" },
      { label: "Sunroof", category: "comfort", source: "comfort.moonroof" },
    ]);
  });

  it("returns no badges when nothing qualifies", () => {
    expect(getBadges({}).badges).toEqual([]);
    expect(getBadges({ computed: { comparisonAxes: { keyFeatures: [] } } }).badges).toEqual([]);
  });
});

describe("resolveCardBadge", () => {
  it("adapts the top badge to the card pill with a per-status icon", () => {
    const data: V360VehicleData = {
      computed: { comparisonAxes: { keyFeatures: TACOMA_KEY_FEATURES } },
    };

    expect(resolveCardBadge(data)).toEqual({ iconName: "toyota-x", label: "Sunroof" });
  });

  it("uses the price-tag icon for a deal badge", () => {
    const data: V360VehicleData = { computed: { dealRating: "Great Deal", comparisonAxes: {} } };
    expect(resolveCardBadge(data)).toEqual({ iconName: "price-tag-filled", label: "Great Deal" });
  });

  it("returns undefined when no badge qualifies", () => {
    expect(resolveCardBadge({})).toBeUndefined();
  });
});
