import "server-only";

import { PurchaseCardRailSkeleton } from "@features/vehicle-detail";
import { PageGrid } from "@ucmp/ui";
import { Suspense } from "react";

interface VdpSkeletonParams {
  make: string;
  model: string;
  trim: string;
  year: string;
}

function formatSegment(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getHeading(params: VdpSkeletonParams) {
  return [params.make, params.model, params.trim].map(formatSegment).join(" ").toUpperCase();
}

// Awaits params inside its own Suspense boundary so the fallback (a bare
// PurchaseCardRailSkeleton) can render — a component passed as a Suspense
// `fallback` cannot itself suspend without bubbling to the parent boundary.
async function VdpRailSkeleton({ paramsPromise }: { paramsPromise: Promise<VdpSkeletonParams> }) {
  const resolved = await paramsPromise;
  return <PurchaseCardRailSkeleton heading={getHeading(resolved)} year={resolved.year} />;
}

export function VdpPageSkeleton({ params }: { params: Promise<VdpSkeletonParams> }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading vehicle details"
      className="relative min-h-dvh"
      data-slot="vdp-loading"
      role="status"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full bg-neutral-300"
        data-slot="hero-background"
      />

      <PageGrid className="relative z-1 pb-8" data-region="body-two-column">
        {/* Mirrors VehicleDetailLayout mobile hero spacer class to avoid skeleton/content jump (height with arbitrary value). */}
        <div aria-hidden="true" className="col-span-full h-[377px] lg:h-0" />
        <aside
          className="col-span-full pb-8 lg:sticky lg:top-8 lg:col-span-4 lg:col-start-9 lg:self-start xl:top-[5.5rem]"
          data-column="right-rail"
        >
          <Suspense fallback={<PurchaseCardRailSkeleton />}>
            <VdpRailSkeleton paramsPromise={params} />
          </Suspense>
        </aside>

        <main
          className="col-span-full mb-8 grid grid-cols-subgrid gap-2 pt-8 lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:pt-(--vdp-hero-offset,80vh)"
          data-column="left"
        >
          <section
            className="col-span-full mb-10 grid grid-cols-subgrid lg:mb-14"
            data-section="description"
          >
            <div
              aria-hidden="true"
              className="invisible col-span-4 h-24 md:col-span-6 lg:col-span-7"
            />
          </section>
          <section className="col-span-full grid grid-cols-subgrid" data-section="detail-cards">
            {/* Keep reserved height using Tailwind scale blocks instead of one magic value. */}
            <div aria-hidden="true" className="col-span-full grid grid-cols-subgrid gap-2">
              <div className="invisible col-span-full h-96" />
              <div className="invisible col-span-full h-80" />
              <div className="invisible col-span-full h-64" />
              <div className="invisible col-span-full h-20" />
            </div>
          </section>
          <section className="col-span-full grid grid-cols-subgrid" data-section="specs">
            <div aria-hidden="true" className="invisible col-span-full h-60" />
          </section>
        </main>
      </PageGrid>

      <section className="relative z-1 lg:py-20" data-region="bottom-full-width">
        <PageGrid className="px-0 lg:px-10" data-section="why-buy">
          <div aria-hidden="true" className="invisible col-span-full h-80" />
        </PageGrid>
      </section>
    </div>
  );
}
