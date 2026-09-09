import type { Origination, OriginationKind } from "../types";

/**
 * Origination (payment / prequal) fixtures — the "payment" half of the Purchase
 * card. Keyed by `kind`; the demo registry / `?state=` override select one.
 *
 * Values mirror the design handoff: estimate $456.97/mo with $3,500 down; active
 * offer $297/mo at 3.29% APR for 60 months.
 */
export const ORIGINATION_FIXTURES: Record<OriginationKind, Origination> = {
  none: { kind: "none" },
  estimate: { kind: "estimate", estimatedMonthly: 456.97, downPayment: 3500 },
  offer: {
    kind: "offer",
    monthly: 297,
    apr: 3.29,
    termMonths: 60,
    // Fixed future timestamp; the card derives the "Expires in …" countdown.
    expiresAt: "2026-12-31T23:59:00.000Z",
  },
  expired: { kind: "expired" },
};
