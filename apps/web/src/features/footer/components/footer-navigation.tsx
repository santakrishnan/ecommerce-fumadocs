import { footerSections } from "../data/footer-links";
import { FooterLinkList } from "./footer-link-list";
import { FooterNavigationAccordion } from "./footer-navigation-accordion";

/**
 * FooterNavigation: single responsive rendering path.
 * Desktop: link columns as direct PageGrid children for proper grid alignment.
 * Mobile/tablet: accordion (Client Component boundary pushed to leaf).
 */
export function FooterNavigation() {
  const activeSections = footerSections.filter((s) => s.links.length > 0);

  if (activeSections.length === 0) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="Footer navigation"
        className="hidden lg:col-span-9 lg:grid lg:grid-cols-subgrid"
      >
        {activeSections.map((section, index) => {
          const isLastSection = index === activeSections.length - 1;
          return (
            <div
              className={isLastSection ? "col-span-1 min-w-0" : "col-span-2 min-w-0"}
              key={section.title}
            >
              <h3 className="subhead-sm mb-5 text-text-primary">{section.title}</h3>
              <FooterLinkList links={section.links} />
            </div>
          );
        })}
      </nav>

      <nav
        aria-label="Footer navigation"
        className="col-span-4 border-divider border-b md:col-span-8 lg:hidden"
      >
        <FooterNavigationAccordion sections={activeSections} />
      </nav>
    </>
  );
}
