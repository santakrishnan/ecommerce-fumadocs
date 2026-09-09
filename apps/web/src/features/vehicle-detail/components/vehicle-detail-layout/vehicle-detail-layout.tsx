import { PageGrid } from "@ucmp/ui";
import type { ReactNode } from "react";

export interface VehicleDetailLayoutProps {
  /** Full-width section below "Why buy": continue shopping carousel */
  continueShopping?: ReactNode;
  /** Left column: description block */
  description?: ReactNode;
  /** Left column: detail cards grid (exterior, interior, wheels, specs, etc.) */
  detailCards: ReactNode;
  /** Full-bleed hero background (image behind both columns) */
  hero: ReactNode;
  /** Right rail: vehicle info card (title, price, save, CTA, test drive) */
  rightRail: ReactNode;
  /** Left column: vehicle specs table (Carfax, warranty, key features) */
  specs: ReactNode;
  /** Full-width section: "Why buy" card */
  whyBuy: ReactNode;
}

/**
 * Vehicle Detail Page layout shell.
 *
 * A Server Component that provides the spatial composition for the VDP.
 * All content is accepted via named slot props — no data fetching or
 * client interactivity lives here.
 *
 * Uses PageGrid for responsive margins and max-width constraint,
 * matching the same grid system as the /welcome-back and other pages.
 *
 * Navigation and footer are rendered by the parent page — this layout only
 * handles the VDP body content.
 *
 * Layout structure (from Figma node 4331:99314):
 * - Full-bleed hero background image behind both columns
 * - Two-column overlay: left content (col-span-8) + sticky right rail (col-span-4)
 * - Full-width bottom section: "Why buy" card
 *
 * @see https://www.figma.com/design/S84HaAL9hckSZcWm8k2Vk2/Handoff?node-id=4331-99314
 */
export function VehicleDetailLayout({
  continueShopping,
  hero,
  description,
  detailCards,
  specs,
  rightRail,
  whyBuy,
}: VehicleDetailLayoutProps) {
  return (
    <div className="flex flex-col" data-layout="vehicle-detail-page">
      {/* ─── Fixed hero background — full viewport, stays behind content ─── */}
      <div className="fixed inset-0 z-0 h-dvh overflow-hidden" data-slot="hero-background">
        {hero}
      </div>

      <PageGrid className="z-1" data-region="body-two-column">
        {/* Spacer — matches hero height on mobile so content starts below the image */}
        <div aria-hidden="true" className="col-span-full aspect-[16/9] lg:h-0" />

        {/* Right Rail — first in DOM for mobile stack, pinned right on desktop */}
        <aside
          className="lg:scrollbar-none col-span-full pb-8 lg:sticky lg:top-8 lg:col-span-4 lg:col-start-9 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto xl:top-[5.5rem] xl:max-h-[calc(100dvh-5.5rem)]"
          data-column="right-rail"
        >
          {rightRail}
        </aside>

        {/* Left Column — pushed down on desktop to overlap below hero fold */}
        <main
          className="col-span-full mb-8 grid grid-cols-subgrid gap-2 pt-8 lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:pt-(--vdp-hero-offset,80vh)"
          data-column="left"
        >
          {description && (
            <section
              className="col-span-full mb-10 grid grid-cols-subgrid lg:mb-14"
              data-section="description"
            >
              {description}
            </section>
          )}
          <section className="col-span-full grid grid-cols-subgrid" data-section="detail-cards">
            {detailCards}
          </section>
          <section className="col-span-full grid grid-cols-subgrid" data-section="specs">
            {specs}
          </section>
        </main>
      </PageGrid>

      {/* ─── Full-Width Bottom Section ─── */}
      <section className="z-1 bg-surface-secondary lg:py-20" data-region="bottom-full-width">
        <PageGrid className="px-0 lg:px-10" data-section="why-buy">
          {whyBuy}
          {continueShopping && (
            <div className="col-span-full px-5 pt-20 lg:px-0" data-slot="continue-shopping">
              {continueShopping}
            </div>
          )}
        </PageGrid>
      </section>
    </div>
  );
}
