"use client";

import type { Vehicle } from "@shared/components/inventory-card";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "utils";

interface CompareCardMorphProps {
  className?: string;
  /** VDP URL — when provided the image becomes a navigable link. */
  href?: string | null;
  /** Whether to render in compact layout. Transitions smoothly via CSS. */
  isCompact: boolean;
  /** Called before navigating to VDP — allows parent to persist state. */
  onBeforeNavigate?: () => void;
  priority?: boolean;
  /** Toggle element (caret icon). */
  toggle?: ReactNode;
  vehicle: Vehicle;
}

/**
 * A single-DOM card that morphs between full (image on top, tall) and compact
 * (thumbnail left, text right, short) via CSS transitions. The same elements
 * animate to their new size/position — no remount, no layout shift.
 */
export function CompareCardMorph({
  className,
  href,
  isCompact,
  onBeforeNavigate,
  priority,
  toggle,
  vehicle,
}: CompareCardMorphProps) {
  const title = `${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""}`.trim().toUpperCase();
  const metadata = `${String(vehicle.year)}  •  ${vehicle.mileage.toLocaleString()} mi`;
  const imageAlt = `${String(vehicle.year)} ${vehicle.make} ${vehicle.model}`;

  const imageContainerClasses = cn(
    "relative shrink-0 overflow-hidden",
    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
    isCompact ? "hidden size-19 rounded-lg md:block" : "aspect-[334/206] w-full rounded-t-xl"
  );

  const image = (
    <Image
      alt={imageAlt}
      className="object-cover object-top"
      fill
      priority={priority}
      sizes={isCompact ? "4.75rem" : "(min-width: 1024px) 334px, 50vw"}
      src={vehicle.imageUrl}
    />
  );

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-xl bg-surface-primary",
        "transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        isCompact ? "h-24 flex-row items-center gap-3 py-3 pr-4 pl-3" : "flex-col",
        className
      )}
    >
      {/* Image — morphs between large banner and small thumbnail. Hidden on mobile when compact. */}
      {href ? (
        <Link
          aria-label={`View details for ${imageAlt}`}
          className={cn(
            imageContainerClasses,
            "cursor-pointer",
            "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          )}
          href={href}
          onClick={onBeforeNavigate}
        >
          {image}
        </Link>
      ) : (
        <div className={imageContainerClasses}>{image}</div>
      )}

      {/* Text + toggle — repositions from below image to beside thumbnail */}
      <div
        className={cn(
          "flex min-w-0 items-center gap-1",
          "transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isCompact ? "flex-1" : "self-stretch px-5 pb-5"
        )}
      >
        <div className="flex min-w-0 shrink-0 grow basis-0 flex-col gap-1">
          <h3 className="vehicle-title-sm lg:vehicle-title-md truncate text-text-primary uppercase lg:text-base!">
            {title}
          </h3>
          <p className="body-md truncate text-text-secondary">{metadata}</p>
        </div>
        {toggle}
      </div>
    </div>
  );
}
