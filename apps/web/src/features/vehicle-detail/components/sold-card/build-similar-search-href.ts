import { ROUTES } from "@config/routes/constants";

import type { StatusCardVehicle } from "./status-card.types";

/**
 * Build a search URL seeded with the sold vehicle's attributes.
 *
 * Centralised here (AC2) — one swappable place for the CTA href.
 * Query params align with the search experience's expected filters.
 */
export function buildSimilarSearchHref(vehicle: StatusCardVehicle): string {
  const params = new URLSearchParams();

  params.set("make", vehicle.make);
  params.set("model", vehicle.model);

  if (vehicle.trim) {
    params.set("trim", vehicle.trim);
  }
  if (vehicle.bodyStyle) {
    params.set("bodyStyle", vehicle.bodyStyle);
  }

  // Year range: ±2 years from the sold vehicle (range format the search logic parses)
  const yearMin = vehicle.year - 2;
  const yearMax = vehicle.year + 2;
  params.set("yearMin", String(yearMin));
  params.set("yearMax", String(yearMax));
  params.set("year", `${yearMin}-${yearMax}`);

  return `${ROUTES.SEARCH}?${params.toString()}`;
}
