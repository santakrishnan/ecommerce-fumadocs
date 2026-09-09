import { getDealerDeal } from "@features/landing/bff/use-cases/get-dealer-deal";
import { SectionHeader } from "@shared/components/section-header";
import { DealerDealCard } from "./dealer-deal-card";

/**
 * Default VIN used when no personalisation data is available.
 * Resolves in both the vehicle detail and deal fixture services.
 */
const DEFAULT_FEATURED_VIN = "JTERU5JR7N6123456";

interface DealerDealWrapperProps {
  /** Outer wrapper class (e.g. col-span-full). Applied only when data exists. */
  className?: string;
  /**
   * VIN to display in the dealer deal section.
   *
   * In production this will come from a personalisation service or the
   * visitor's recent activity (e.g. last viewed vehicle from profile).
   * Defaults to a known fixture VIN for dev/demo flows.
   */
  vin?: string;
}

/**
 * Server wrapper that composes the DealerDealCard with its section layout
 * and data. Delegates fetching and mapping to the `getDealerDeal` use-case.
 *
 * Wrapped in `<Suspense fallback={<DealerDealSkeleton />}>` at the page level
 * to stream once data resolves.
 */
export async function DealerDealWrapper({
  className,
  vin = DEFAULT_FEATURED_VIN,
}: DealerDealWrapperProps = {}) {
  const result = await getDealerDeal(vin);

  if (!result.success) {
    return null;
  }

  const deal = result.data;

  const DEALER_DEAL = {
    title: `Take the next steps on your ${deal.year} ${deal.model}`,
  };

  return (
    <section aria-label="Featured dealer deal" className={className}>
      <div className="hidden lg:block">
        <SectionHeader subtitle="" title={DEALER_DEAL.title} />
      </div>
      <div className="mt-4">
        <DealerDealCard deal={deal} />
      </div>
    </section>
  );
}
