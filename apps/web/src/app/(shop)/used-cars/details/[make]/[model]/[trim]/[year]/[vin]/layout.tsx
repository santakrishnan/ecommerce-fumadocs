import { Footer } from "@layout/footer";
import { VdpNavigationBar } from "@shared/components/navigation-bar/vdp-navigation-bar";
import { PageGrid } from "@ucmp/ui";
import { type ReactNode, Suspense } from "react";

/**
 * Wraps both VDP states (active + sold) with shared navigation and footer.
 * Keeps the fixed header and footer in a single place rather than duplicating
 * them inside each layout component.
 */
export default function VdpVinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-clip [--vdp-hero-offset:calc(100dvh-17rem)] [--vdp-nav-height:7.5rem]">
      <header
        className="pointer-events-none fixed top-0 right-0 left-0 z-10 bg-transparent"
        data-slot="navigation"
      >
        <PageGrid
          aria-label="Vehicle detail navigation"
          as="nav"
          className="h-24 items-center *:pointer-events-auto lg:h-30"
        >
          <div className="col-span-2 flex items-center md:col-span-4 lg:col-span-3">
            <Suspense>
              <VdpNavigationBar />
            </Suspense>
          </div>
        </PageGrid>
      </header>
      {children}
      <Footer className="relative z-1" />
    </div>
  );
}
