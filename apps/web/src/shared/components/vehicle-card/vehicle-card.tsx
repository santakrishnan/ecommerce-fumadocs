import Image from "next/image";
import { cn, formatMileage } from "utils";
import { SelectedOverlay } from "./selected-overlay";
import type { VehicleCardProps } from "./vehicle-card-types";

// ─── Full variant ─────────────────────────────────────────────────────────────

function VehicleCardFull({
  className,
  imageAlt,
  imageSrc,
  isSelected,
  mileage,
  priority,
  title,
  trailing,
  year,
}: VehicleCardProps) {
  return (
    <article
      className={cn(
        "flex w-full shrink-0 flex-col items-start overflow-hidden rounded-xl bg-surface-primary",
        className
      )}
      data-selected={isSelected || undefined}
      data-slot="vehicle-card"
    >
      <div className="relative aspect-[177/140] w-full overflow-hidden rounded-t-xl md:aspect-[334/206]">
        <Image
          alt={imageAlt}
          className="object-cover object-top"
          fill
          priority={priority}
          sizes="(min-width: 1024px) 334px, (min-width: 768px) 50vw, 50vw"
          src={imageSrc}
        />
        {isSelected && <SelectedOverlay variant="full" />}
      </div>
      <div className="flex h-18 items-center gap-1 self-stretch bg-surface-primary px-4 pt-3 pb-4 md:px-5 md:py-4 lg:h-23">
        <div className="flex min-w-0 shrink-0 grow basis-0 flex-col items-start gap-0.5 md:gap-px lg:gap-1">
          <h3 className="vehicle-title-sm lg:vehicle-title-md text-text-primary uppercase lg:text-base!">
            {title}
          </h3>
          <p className="body-md text-text-secondary">
            {year} • {formatMileage(mileage)}
          </p>
        </div>
        {trailing}
      </div>
    </article>
  );
}

// ─── Compact variant (original) ──────────────────────────────────────────────

function VehicleCardCompact({
  className,
  imageAlt,
  imageSrc,
  isSelected,
  mileage,
  title,
  trailing,
  year,
}: VehicleCardProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-4 rounded-xl p-4 pr-5 text-left text-text-primary",
        className
      )}
      data-selected={isSelected || undefined}
      data-slot="vehicle-card"
    >
      <div
        className="relative size-19 shrink-0 overflow-hidden rounded-md bg-surface-primary"
        data-slot="vehicle-card-image"
      >
        <Image
          alt={imageAlt}
          className="size-full object-cover"
          height={75}
          src={imageSrc}
          width={75}
        />
        {isSelected && <SelectedOverlay variant="compact" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2" data-slot="vehicle-card-body">
        <h3 className="vehicle-title-sm line-clamp-2 max-h-[2lh]" data-slot="vehicle-card-title">
          {title}
        </h3>
        <p className="body-md flex items-center gap-1" data-slot="vehicle-card-detail">
          <span>{year}</span>
          <span aria-hidden="true">•</span>
          <span>{formatMileage(mileage)}</span>
        </p>
      </div>
      {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

/** Presentational vehicle summary card with compact and full layout variants. */
export function VehicleCard(props: VehicleCardProps) {
  const { variant = "compact" } = props;

  if (variant === "full") {
    return <VehicleCardFull {...props} />;
  }

  return <VehicleCardCompact {...props} />;
}
