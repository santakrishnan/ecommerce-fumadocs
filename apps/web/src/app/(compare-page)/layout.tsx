import { CompareHeader } from "@features/compare/components/compare-header";
import { Footer } from "@layout/footer";
import { Header } from "@layout/header";
import { NavigationBar } from "@shared/components/navigation-bar";
import { Suspense } from "react";
import { PageGrid } from "@/components";

/**
 * Layout for the compare experience at /profile/watchlist.
 *
 * Uses NavigationBar variant="compare" (Back to Profile button) instead of
 * the default profile nav pills, matching the standalone compare-demo header.
 */
export default function ComparePageGroupLayout({ children }: { children: React.ReactNode }) {
  const compareNav = (
    <Suspense>
      <NavigationBar variant="compare" />
    </Suspense>
  );

  return (
    <div
      className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] bg-surface-secondary"
      style={{ gridTemplateAreas: '"header" "body" "footer"' }}
    >
      <CompareHeader>
        <Header locationSlot={null} navSlot={compareNav} />
      </CompareHeader>
      <PageGrid
        as="main"
        className="w-full bg-surface-secondary pt-24 pb-18 lg:pt-30 lg:pb-30"
        style={{ gridArea: "body" }}
      >
        {children}
      </PageGrid>
      <Footer />
    </div>
  );
}
