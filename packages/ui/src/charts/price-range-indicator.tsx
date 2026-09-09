import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import * as React from "react";
import { cn } from "@/lib/utils";

/** A single gradient stop on the price track (0 = left/min, 1 = right/max). */
export interface PriceRangeColorStop {
  offset: number;
  color: string;
}

export interface PriceRangeIndicatorProps
  extends Omit<React.ComponentProps<"svg">, "color"> {
  /** Low end of the market range. */
  min: number;
  /** High end of the market range. */
  max: number;
  /** The price being highlighted ("This car"). */
  value: number;
  /** Optional market-average tick. */
  average?: number;
  /** Caption above the value marker. */
  valueLabel?: string;
  /** Caption under the average tick. */
  averageLabel?: string;
  /** Formats every currency value shown. */
  formatValue?: (value: number) => string;
  /** Left→right gradient stops; defaults to green → amber → red. */
  colors?: PriceRangeColorStop[];
  /** Accessible description; a sensible sentence is generated when omitted. */
  ariaLabel?: string;
}

const DEFAULT_COLORS: PriceRangeColorStop[] = [
  {offset: 0, color: "var(--color-chart-price-low)"},
  {offset: 0.5, color: "var(--color-chart-price-mid)"},
  {offset: 1, color: "var(--color-chart-price-high)"},
];

const defaultFormat = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Price-position indicator chart built on visx primitives (`scaleLinear` + SVG
 * shapes). Renders a horizontal gradient track with a "This car" marker dot and
 * an optional market-average tick.
 *
 * The SVG is `viewBox`-based and scales to fill its container via CSS (`w-full`),
 * so no client-side measurement is needed — it renders identically on the server
 * and the client. Colour text/strokes come from semantic tokens (`text-text-*`),
 * which adapt to an ancestor `data-surface`.
 *
 * @example
 * ```tsx
 * <PriceRangeIndicator min={26000} max={42000} value={30775} average={34000} />
 * ```
 */
export function PriceRangeIndicator({
  min,
  max,
  value,
  average,
  valueLabel = "This car",
  averageLabel = "Avg",
  formatValue = defaultFormat,
  colors = DEFAULT_COLORS,
  ariaLabel,
  className,
  ...props
}: PriceRangeIndicatorProps) {
  const gradientId = React.useId();

  // Degenerate range — nothing meaningful to draw.
  if (max <= min) {
    return null;
  }

  const COORDINATE_SPACE_WIDTH = 840;
  const topGroupHeight = 36;
  const mainGroupHeight = 44;
  const bottomGroupGap = 8;
  const bottomGroupHeight = 18;
  const trackHeight = 8;
  const trackRadius = trackHeight / 2;
  const dotRadius = 13;
  const x0 = 0;
  const x1 = COORDINATE_SPACE_WIDTH;
  const centerY = mainGroupHeight / 2;
  const trackY = centerY - trackHeight / 2;

  const xScale = scaleLinear<number>({domain: [min, max], range: [x0, x1], clamp: true});
  const trackLeft = `${(x0 / COORDINATE_SPACE_WIDTH) * 100}%`;
  const trackWidth = `${((x1 - x0) / COORDINATE_SPACE_WIDTH) * 100}%`;

  const clampedValue = clamp(value, min, max);
  const isAtOrBelowMin = value <= min;
  const isAtOrAboveMax = value >= max;
  const rawValueX = xScale(clampedValue);
  const valueX = clamp(rawValueX, x0 + dotRadius, x1 - dotRadius);
  // Keep the floating value caption from overflowing either edge.
  const labelX = clamp(valueX, x0 + 36, x1 - 36);
  const labelLeft = isAtOrBelowMin
    ? "0%"
    : isAtOrAboveMax
      ? "100%"
      : `${(labelX / COORDINATE_SPACE_WIDTH) * 100}%`;
  const labelAlignmentClass = isAtOrBelowMin
    ? "translate-x-0 text-left"
    : isAtOrAboveMax
      ? "-translate-x-full text-right"
      : "-translate-x-1/2 text-center";
  const valueLeft = `${(valueX / COORDINATE_SPACE_WIDTH) * 100}%`;

  const hasAverage = typeof average === "number";
  const averageX = hasAverage ? xScale(clamp(average, min, max)) : 0;
  const averageLeft = `${(averageX / COORDINATE_SPACE_WIDTH) * 100}%`;

  const description =
    ariaLabel ??
    `${valueLabel} ${formatValue(value)}, within a market range of ${formatValue(
      min
    )} to ${formatValue(max)}${hasAverage ? `, ${averageLabel} ${formatValue(average)}` : ""}.`;

  return (
    <div className={cn("w-full", className)} data-slot="price-range-indicator">
      <div className="relative" style={{height: topGroupHeight}}>
        <div
          className={cn("absolute top-0 body-md text-text-primary", labelAlignmentClass)}
          style={{left: labelLeft}}
        >
          <div>{valueLabel}</div>
          <div>{formatValue(value)}</div>
        </div>
      </div>

      <svg
        aria-label={description}
        className="block h-auto w-full"
        height={mainGroupHeight}
        role="img"
        {...props}
      >
        <title>{description}</title>

        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            {colors.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color}/>
            ))}
          </linearGradient>
          <filter height="300%" id={`${gradientId}-shadow`} width="300%" x="-100%" y="-100%">
            <feDropShadow dx="0" dy="2" floodColor="rgb(0 0 0 / 0.25)" stdDeviation="3"/>
          </filter>
        </defs>

        <Group>
          <Bar
            fill={`url(#${gradientId})`}
            height={trackHeight}
            rx={trackRadius}
            width={trackWidth}
            x={trackLeft}
            y={trackY}
          />

          {hasAverage && (
            <line
              className="stroke-current text-text-secondary"
              x1={averageLeft}
              x2={averageLeft}
              y1={trackY - 7}
              y2={trackY + trackHeight + 7}
              strokeLinecap="round"
              strokeWidth={1.5}
            />
          )}

          <circle
            cx={valueLeft}
            cy={centerY}
            fill="white"
            filter={`url(#${gradientId}-shadow)`}
            r={dotRadius}
          />
        </Group>
      </svg>

      <div className="relative" style={{height: bottomGroupHeight, marginTop: bottomGroupGap}}>
        <div className="body-md flex items-start justify-between text-text-secondary">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
        {hasAverage && (
          <div
            className="body-md absolute top-0 -translate-x-1/2 text-text-primary"
            style={{left: averageLeft}}
          >
            {averageLabel}
          </div>
        )}
      </div>
    </div>
  );
}
