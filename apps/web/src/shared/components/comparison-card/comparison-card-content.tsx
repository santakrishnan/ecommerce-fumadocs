import {
  AttributeStatList,
  CardBadge,
  type CardBadgeIconName,
  type SpecAttribute,
} from "@shared/components/card";
import { normalizeImageUrl } from "@shared/lib/media";
import { CardContent, CardHeader } from "@ucmp/ui";
import { IconToyotaX } from "@ucmp/ui/icons";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "utils";

interface ComparisonMetric {
  /** Metric label (e.g. "Max cargo", "Range", "Highway MPG"). */
  label: string;
  /** Unit suffix displayed beside the value (e.g. "CU. FT.", "MI", "MPG"). */
  unit?: string;
  /** Large numeric value (e.g. "84.3", "615", "35"). */
  value: string;
}

interface ComparisonCardContentProps {
  /**
   * How metric rows are laid out.
   * - `"grouped"` (default): count-based layout (1 or 2 large metrics).
   * - `"list"`: a single consistent stacked list regardless of count.
   * @default "grouped"
   */
  attributeLayout?: "grouped" | "list";
  /** Badge icon component passed directly (client-side override). */
  badgeIcon?: ReactNode;
  /** Serializable icon name from API — resolved via BADGE_ICON_MAP inside CardBadge. */
  badgeIconName?: CardBadgeIconName;
  /** AI badge label (e.g. "Most space", "Best for road trips"). */
  badgeLabel?: string;
  /** Short AI-generated description. */
  description?: string;
  /** Transparent vehicle render image. */
  image: { src: string; alt: string };
  /** Image render box classes. */
  imageClassName?: string;
  imageHeight?: number;
  imageSizes?: string;
  imageWidth?: number;
  /** Comparison metrics displayed below the description. */
  metrics: ComparisonMetric[];
  /** Show the card badge (top-left pill). @default true */
  showBadge?: boolean;
  /** Vehicle title (e.g. "HIGHLANDER HYBRID"). */
  title: string;
  /** Model year. */
  year?: string | number;
}

function ComparisonMetrics({ metrics }: { metrics: ComparisonMetric[] }) {
  const visibleMetrics = metrics.slice(0, 2);
  const isMulti = visibleMetrics.length > 1;

  return (
    <div className={cn("flex", isMulti && "flex-row gap-1")}>
      {visibleMetrics.map((metric, index) => (
        <div
          className={cn("flex flex-col gap-4 text-text-primary", isMulti && "basis-1/2")}
          key={`${metric.label}-${String(index)}`}
        >
          <span className="body-sm whitespace-nowrap">{metric.label}</span>
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="number-xl">{metric.value}</span>
            {metric.unit && <span className="vehicle-title-sm">{metric.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function toAttribute(metric: ComparisonMetric): SpecAttribute {
  return {
    label: metric.label,
    value: metric.unit ? `${metric.value} ${metric.unit}` : metric.value,
  };
}

function ComparisonCardContent({
  attributeLayout = "grouped",
  badgeIcon,
  badgeIconName,
  badgeLabel,
  description,
  image,
  imageClassName,
  imageHeight = 126,
  imageSizes,
  imageWidth = 308,
  metrics,
  showBadge = true,
  title,
  year,
}: ComparisonCardContentProps) {
  const imageSrc = normalizeImageUrl(image.src);

  return (
    <>
      {showBadge && badgeLabel && (
        <CardBadge
          className="absolute top-8 left-8 z-10"
          startIcon={
            badgeIcon ??
            (badgeIconName ? undefined : (
              <IconToyotaX className="text-brand" data-icon="inline-start" />
            ))
          }
          startIconName={badgeIconName}
          variant="default"
        >
          {badgeLabel}
        </CardBadge>
      )}

      <CardHeader className="flex h-[139px] w-full items-center justify-center p-0 xl:h-[205px]">
        <Image
          alt={image.alt}
          className={cn(
            "h-[97px] w-[238px] object-contain xl:h-[126px] xl:w-[308px]",
            imageClassName
          )}
          height={imageHeight}
          sizes={imageSizes ?? "(min-width: 1440px) 308px, 238px"}
          src={imageSrc}
          width={imageWidth}
        />
      </CardHeader>

      <CardContent
        className={cn("flex flex-col gap-6 p-0", attributeLayout === "list" && "flex-1")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {year != null && <span className="body-sm text-text-secondary">{year}</span>}

            <h3 className="carousel-headline text-text-primary">{title}</h3>
          </div>

          {description && (
            <p className="body-sm line-clamp-2 min-h-[2lh] text-text-primary">{description}</p>
          )}
        </div>

        {attributeLayout === "list" ? (
          <div className="mt-auto">
            <AttributeStatList attributes={metrics.map(toAttribute)} layout="list" />
          </div>
        ) : (
          metrics.length > 0 && <ComparisonMetrics metrics={metrics} />
        )}
      </CardContent>
    </>
  );
}

export { ComparisonCardContent, type ComparisonCardContentProps, type ComparisonMetric };
