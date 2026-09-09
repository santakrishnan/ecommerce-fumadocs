import type { WatchlistCardProps } from "../watchlist-card-types";

/**
 * Fixture data for WatchlistCard visual smoke tests.
 *
 * Badge `startIcon` is omitted here since it's a ReactNode —
 * consumers pass it at render time (e.g. <IconPriceTagFilled />).
 */

// ─── Default (available vehicle — estimate payment) ─────────────────────────

export const watchlistCardFixtureRav4: Omit<WatchlistCardProps, "badge"> & {
  badge: { label: string; variant: "inverse" };
} = {
  badge: { label: "$1000 price drop", variant: "inverse" },
  featureTag: "Adaptive cruise control",
  imageAlt: "2023 Toyota RAV4 XSE in white driving on a suburban street",
  imageSrc: "/images/watchlist/rav4-xse.png",
  make: "Toyota",
  mileage: 36_435,
  model: "RAV4",
  originalPrice: 30_246,
  overflowItems: [
    { key: "remove", label: "Remove from watchlist" },
    { key: "share", label: "Share" },
    { key: "compare", label: "Compare" },
  ],
  payment: { type: "estimate", monthly: 456.97, down: 3500 },
  price: 29_245,
  trim: "XSE",
  watchingCount: 23,
  year: 2023,
};

// ─── Sold (vehicle no longer available) ─────────────────────────────────────

export const watchlistCardFixtureSold: Omit<WatchlistCardProps, "badge"> & {
  badge: { label: string; variant: "inverse" };
} = {
  badge: { label: "Vehicle sold", variant: "inverse" },
  imageAlt: "2023 Toyota Highlander Hybrid LXE",
  imageSrc: "/images/watchlist/highlander-xse.png",
  make: "Toyota",
  mileage: 16_435,
  model: "Highlander Hybrid",
  overflowItems: [{ key: "remove", label: "Remove from watchlist" }],
  price: 29_245,
  sold: { date: "March 24, 2026", dealer: "Toyota of Bay Ridge" },
  trim: "LXE",
  year: 2023,
};

// ─── Active Offer (personalized finance offer) ──────────────────────────────

export const watchlistCardFixtureOffer: Omit<WatchlistCardProps, "badge"> & {
  badge: { label: string; variant: "inverse" };
} = {
  badge: { label: "$1000 price drop", variant: "inverse" },
  featureTag: "Most compact and easiest to park",
  imageAlt: "2023 Toyota Highlander Hybrid LXE",
  imageSrc: "/images/watchlist/highlander-xse.png",
  make: "Toyota",
  mileage: 36_435,
  model: "Highlander Hybrid",
  overflowItems: [
    { key: "remove", label: "Remove from watchlist" },
    { key: "share", label: "Share" },
  ],
  payment: { type: "offer", monthly: 297, apr: 5.99, termMonths: 60, expiry: "Expires in 5d, 18h" },
  price: 29_245,
  trim: "LXE",
  watchingCount: 23,
  year: 2023,
};

// ─── Legacy alias (backward compat for existing tests) ──────────────────────

export const watchlistCardFixtureHighlander = watchlistCardFixtureOffer;
