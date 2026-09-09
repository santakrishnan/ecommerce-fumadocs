import { RARE_FINDS_COPY } from "@features/landing/data/rare-finds-copy";
import type { Surface } from "@shared/components/card";
import { InventoryCardCarousel, type Vehicle } from "@shared/components/inventory-card";
import { SectionHeader } from "@shared/components/section-header";
import { IconBinocular } from "@ucmp/ui/icons";

interface RareFindsSectionProps {
  className?: string;
  rareFindsPromise: Promise<Vehicle[]>;
  showSaveIcon?: boolean;
  /** Surface context for card text color. @default "light" */
  surface?: Surface;
}

/**
 * Rare Finds section — async Server Component.
 *
 * Returns `null` when no vehicles are found — the section is completely
 * hidden from the DOM. No empty-state text is shown.
 */
export async function RareFindsSection({
  className,
  rareFindsPromise,
  showSaveIcon = false,
  surface = "light",
}: RareFindsSectionProps) {
  const rareFinds = await rareFindsPromise;
  const headingId = "rare-finds-heading";

  if (rareFinds.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className={className}>
      <SectionHeader
        icon={<IconBinocular className="size-4" />}
        id={headingId}
        subtitle={RARE_FINDS_COPY.subtitle}
        title={RARE_FINDS_COPY.title}
      />
      <div className="mt-4">
        <InventoryCardCarousel
          activitySource="LandingPage"
          colSpan={{ sm: 4, md: 4, lg: 4 }}
          descriptionReveal="hover"
          showSaveIcon={showSaveIcon}
          size="large"
          surface={surface}
          variant="gradient"
          vehicles={rareFinds}
        />
      </div>
    </section>
  );
}
