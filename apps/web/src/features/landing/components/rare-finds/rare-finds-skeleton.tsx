import { CardCarouselSkeleton } from "@shared/components/card";
import { SectionHeader } from "@shared/components/section-header";
import type { ReactNode } from "react";

interface RareFindsSkeletonProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
  icon?: ReactNode;
  sectionLabel: string;
  subtitle: string;
  title: string;
}

/**
 * Loading state for the Rare Finds section — header + three large card
 * placeholders from the shared `CARD_SIZE.lg` token (matches
 * `InventoryCard size="large"`), so there's no layout shift on load.
 */
export function RareFindsSkeleton({
  className,
  sectionLabel,
  title,
  subtitle,
  icon,
}: RareFindsSkeletonProps) {
  return (
    <section aria-busy="true" aria-label={sectionLabel} className={className} role="status">
      <SectionHeader icon={icon} subtitle={subtitle} title={title} />
      <CardCarouselSkeleton
        cardClassName="bg-surface-primary"
        className="mt-4"
        count={3}
        size="lg"
      />
    </section>
  );
}
