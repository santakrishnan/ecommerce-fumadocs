import { LinkInventoryCard } from "@shared/components/inventory-card";
import { SectionHeader } from "@shared/components/section-header";
import { Carousel, CarouselContent, CarouselItem } from "@ucmp/ui";
import { getSearchRecommendations } from "../services/get-search-recommendations";

interface SearchRecommendationsSectionProps {
  /** Outer wrapper class (e.g. carousel bleed). Applied only when data exists. */
  className?: string;
  /** Section subtitle — defaults to standard copy */
  subtitle?: string;
  /** Section title — defaults to standard copy */
  title?: string;
}

export async function SearchRecommendationsSection({
  className,
  title = "BASED ON YOUR SEARCH FOR COMPACT SUVS",
  subtitle = "I found a few options you haven't seen yet that I think you'll like",
}: SearchRecommendationsSectionProps = {}) {
  const vehicles = await getSearchRecommendations();

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <section aria-label={title.toLowerCase()} className="w-full">
        <SectionHeader subtitle={subtitle} title={title} />
        <div className="mt-4">
          <Carousel>
            <CarouselContent>
              {vehicles.map((vehicle) => (
                <CarouselItem colSpan={{ sm: 2, md: 2, lg: 2 }} key={vehicle.id}>
                  <LinkInventoryCard showSaveButton size="small" vehicle={vehicle} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </div>
  );
}
