"use client";

import Image from "next/image";
import { cn, formatMileage } from "utils";
import { SelectedOverlay } from "./selected-overlay";
import type { VehicleCardInteractiveProps } from "./vehicle-card-types";

// ─── Full variant (interactive) ───────────────────────────────────────────────

function VehicleCardInteractiveFull({
  ariaLabel,
  className,
  imageAlt,
  imageSrc,
  isSelected = false,
  mileage,
  onSelectToggle,
  priority,
  title,
  trailing,
  year,
}: VehicleCardInteractiveProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full shrink-0 cursor-pointer flex-col items-start overflow-hidden rounded-xl bg-surface-primary",
        className
      )}
      data-slot="vehicle-card"
      onClick={onSelectToggle}
      type="button"
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
    </button>
  );
}

// ─── Compact variant (interactive) ───────────────────────────────────────────

function VehicleCardInteractiveCompact({
  ariaLabel,
  className,
  imageAlt,
  imageSrc,
  isSelected = false,
  mileage,
  onSelectToggle,
  title,
  trailing,
  year,
}: VehicleCardInteractiveProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "flex w-75.5 cursor-pointer items-center gap-4 rounded-xl p-4 pr-5 text-text-primary",
        className
      )}
      data-slot="vehicle-card"
      onClick={onSelectToggle}
      type="button"
    >
      <div className="relative size-19 shrink-0 overflow-hidden rounded-md bg-surface-primary">
        <Image
          alt={imageAlt}
          className="size-full object-cover"
          height={75}
          src={imageSrc}
          width={75}
        />
        {isSelected && <SelectedOverlay variant="compact" />}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="vehicle-title-sm line-clamp-2 max-h-[2lh]">{title}</h3>
        <p className="body-md flex items-center gap-1">
          <span>{year}</span>
          <span aria-hidden="true">•</span>
          <span>{formatMileage(mileage)}</span>
        </p>
      </div>
      {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
    </button>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

/** Interactive vehicle card with toggle behavior. */
export function VehicleCardInteractive(props: VehicleCardInteractiveProps) {
  const { variant = "compact" } = props;

  if (variant === "full") {
    return <VehicleCardInteractiveFull {...props} />;
  }

  return <VehicleCardInteractiveCompact {...props} />;
}
