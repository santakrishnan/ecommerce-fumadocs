import { FooterBottom, FooterNavigation, FooterTop } from "@features/footer";
import { PageGrid } from "@ucmp/ui";
import { cn } from "utils";

const FOOTER_BRAND_NAME = "Local Dealers";
const FOOTER_BRAND_TAGLINE = "Find a dealer near you";

interface FooterProps {
  className?: string;
}

/**
 * Footer - Global footer component
 * Server Component — assembles navigation, brand treatment, and legal row.
 * Uses PageGrid to align with the shared page column system.
 * Reused across all pages via RootLayout.
 */
export function Footer({ className }: FooterProps) {
  return (
    <div className={cn("w-full bg-surface-primary", className)} style={{ gridArea: "footer" }}>
      <footer className="font-toyota text-(--states-inverse-muted-foreground)">
        <PageGrid as="div" className="pt-20 pb-20 lg:pb-10">
          {/* Brand block — full width mobile/tablet, 3 cols desktop */}
          <div className="col-span-4 pb-8 md:col-span-8 lg:col-span-3 lg:pb-0">
            <FooterTop brandName={FOOTER_BRAND_NAME} tagline={FOOTER_BRAND_TAGLINE} />
          </div>

          {/* Navigation — columns are direct PageGrid children on desktop */}
          <FooterNavigation />

          {/* Legal row — full width across all breakpoints */}
          <div className="col-span-4 md:col-span-8 lg:col-span-12">
            <FooterBottom />
          </div>
        </PageGrid>
      </footer>
    </div>
  );
}
