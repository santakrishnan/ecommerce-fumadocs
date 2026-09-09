import { searchByTaxonomy } from "@features/search/actions/search-by-taxonomy";
import { InventoryCardCarousel } from "@shared/components/inventory-card";
import { SectionHeader } from "@shared/components/section-header";

interface SimilarVehiclesProps {
  vin: string;
}

/**
 * Async server component that fetches similar available vehicles for a given VIN
 * via the `searchByTaxonomy` Server Action and renders them as an inventory
 * card carousel. Returns `null` (section hidden) when:
 * - No location cookie is set
 * - No similar vehicles are found
 * - The upstream search fails
 *
 * Used on the sold vehicle page where the VIN is known at render time.
 */
export async function SimilarVehicles({ vin }: SimilarVehiclesProps) {
  const result = await searchByTaxonomy(vin, { limit: 3 });

  if (!result.success || result.vehicles.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="similar-vehicles-heading"
      className="col-span-full mt-16 pb-20"
      data-section="similar-vehicles"
    >
      <SectionHeader
        id="similar-vehicles-heading"
        subtitle=""
        title="Similar vehicles available now"
      />

      <div className="mt-6 -mr-5 lg:-mr-10">
        <InventoryCardCarousel
          activitySource="Vdp"
          aria-label="Similar vehicles available now"
          colSpan={{ sm: 4, md: 4, lg: 4 }}
          showSaveIcon
          size="large"
          variant="gradient"
          vehicles={result.vehicles}
        />
      </div>
    </section>
  );
}
