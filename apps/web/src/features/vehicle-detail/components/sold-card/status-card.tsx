import { CardBadge, PanelCard } from "@shared/components/card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@ucmp/ui";
import { formatDate } from "utils";

import { StatusCardStickyCta } from "../status-card-sticky-cta";
import { buildSimilarSearchHref } from "./build-similar-search-href";
import type { StatusCardProps } from "./status-card.types";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeSoldDate(soldDate: Date | string) {
  return typeof soldDate === "string" && DATE_ONLY_RE.test(soldDate)
    ? new Date(`${soldDate}T00:00:00`)
    : soldDate;
}

/**
 * Status Card — shared unavailable-vehicle CTA card.
 *
 * Replaces PurchaseCard entirely (selection at the card-root level).
 * Renders:
 * - a sold or not-found badge
 * - unavailable-vehicle headline copy
 * - optional sold metadata: "Sold on {date} at {dealer}"
 * - CTA: "Search similar to this" (next/link to search experience)
 *
 * Uses PanelCard for glassmorphic shell (surface defaults to "dark" via PanelCard).
 */
export function StatusCard({ vehicle, dealer, soldDate, variant }: StatusCardProps) {
  const trim = vehicle.trim?.trim();
  const vehicleLabel = [vehicle.year, vehicle.model, trim].filter(Boolean).join(" ");
  const notFoundHeadline = vehicleLabel
    ? `This ${vehicleLabel} is not found.`
    : "This vehicle is not found.";

  const isNotFound = variant === "not-found";
  const badgeLabel = isNotFound ? "Vehicle not found" : "Vehicle sold";
  const headline = isNotFound ? notFoundHeadline : `This ${vehicleLabel} has sold.`;
  const soldLine =
    variant === "not-found"
      ? undefined
      : `Sold on ${formatDate(normalizeSoldDate(soldDate))} at ${dealer.name}`;
  const searchHref = buildSimilarSearchHref(vehicle);

  return (
    <PanelCard className="w-full rounded-xl px-6 py-8" data-testid="sold-card">
      <CardHeader className="mb-8 gap-0 px-0 lg:mb-10">
        <CardBadge variant="inverse">{badgeLabel}</CardBadge>

        <CardTitle className="mt-4">
          <h2 className="h3 text-text-primary">{headline}</h2>
        </CardTitle>

        {soldLine && (
          <CardDescription className="mt-6 max-w-[75%] lg:max-w-none">
            <p className="body-md text-text-primary">{soldLine}</p>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-0 py-0" data-testid="sold-cta-wrapper">
        <StatusCardStickyCta
          ariaLabel={`Search for vehicles similar to this ${vehicleLabel}`}
          label="Search similar to this"
          searchHref={searchHref}
        />
      </CardContent>
    </PanelCard>
  );
}
