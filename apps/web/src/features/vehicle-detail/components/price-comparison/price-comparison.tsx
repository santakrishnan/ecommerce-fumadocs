import { Card, CardContent } from "@ucmp/ui";
import { PriceRangeIndicator } from "@ucmp/ui/charts";
import { IconToyotaX } from "@ucmp/ui/icons";
import { cn } from "utils";

import type { PriceComparisonData } from "../../types";

export interface PriceComparisonProps {
  /** Additional CSS classes for the card root. */
  className?: string;
  /** Upstream pricing-card data that feeds the price indicator chart. */
  data: PriceComparisonData;
}

/**
 * PriceComparison — a dark-surface card showing where the vehicle's price
 * sits within the local market range for similar vehicles.
 *
 * Renders the Toyota brand mark, a headline summarising the pricing position,
 * a comparison description, and the `PriceRangeIndicator` SVG chart from
 * `@ucmp/ui/charts`.
 *
 * Layout: spans 4 columns of the page grid on tablet and desktop.
 * Full-width (4 of 4 columns) on mobile.
 *
 * @see https://www.figma.com/design/7jjFjOTZe0jmljcXpQXF0A/Toyota-Design-Library?node-id=6536-8048
 */
export function PriceComparison({ className, data }: PriceComparisonProps) {
  if (!data) {
    return null;
  }

  const {
    amountBelowMarketValue,
    averagePrice,
    marketValuePercentage,
    nearbyComparedVehiclesCount,
    priceRangeEnd,
    priceRangeStart,
    thisCarPrice,
    valueDirection,
  } = data;

  const formattedDifference = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(amountBelowMarketValue));

  const headline = `It\u2019s priced ${formattedDifference} ${valueDirection} the market`;

  const formattedPercentage = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(marketValuePercentage));

  const description =
    valueDirection === "below"
      ? `${formattedPercentage}% cheaper than ${nearbyComparedVehiclesCount} similar vehicles nearby`
      : `${formattedPercentage}% more than ${nearbyComparedVehiclesCount} similar vehicles nearby`;

  return (
    <Card
      className={cn(
        "col-span-4 min-h-90.5 gap-0 rounded-2xl border-0 bg-opacity-black-20 p-0 text-text-primary shadow-none ring-0 lg:min-h-117.5",
        className
      )}
      data-slot="price-comparison"
      data-surface="dark"
    >
      <CardContent className="flex flex-1 flex-col justify-between p-6 pt-10 lg:p-8">
        {/* Header: brand mark + headline + description */}
        <div className="flex flex-col gap-4">
          <IconToyotaX aria-hidden className="size-3.5 text-text-primary" />

          <h3 className="h2 max-w-60 text-text-primary">{headline}</h3>

          <p className="body-md text-text-secondary">{description}</p>
        </div>

        {/* Price range indicator chart */}
        <div>
          <PriceRangeIndicator
            average={averagePrice}
            max={priceRangeEnd}
            min={priceRangeStart}
            value={thisCarPrice}
          />
        </div>
      </CardContent>
    </Card>
  );
}
