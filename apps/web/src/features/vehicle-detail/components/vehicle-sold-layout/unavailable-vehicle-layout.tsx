import { PageGrid } from "@ucmp/ui";
import type { ReactNode } from "react";

export interface UnavailableVehicleLayoutProps {
  heroCard: ReactNode;
  recommendations: ReactNode;
}

export function UnavailableVehicleLayout({
  heroCard,
  recommendations,
}: UnavailableVehicleLayoutProps) {
  return (
    <PageGrid data-layout="vehicle-sold-page">
      <section className="col-span-full" data-region="sold-hero">
        {heroCard}
      </section>
      {recommendations}
    </PageGrid>
  );
}
