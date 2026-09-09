"use client";

import { Tabs, TabsList, TabsTrigger } from "@ucmp/ui";
import { cn } from "utils";
import type { ImageSection, VehicleImage } from "../../types/image-gallery";

/** Extends `ImageSection` with the synthetic "360" anchor for the hero viewer. */
type AnchorSection = ImageSection | "360";

type SectionType = VehicleImage["type"];

const SECTION_LABELS: Record<SectionType, string> = {
  exterior: "Exterior",
  interior: "Interior",
  detail: "Detail",
  "non-vehicle": "Other",
};

interface GalleryAnchorBarProps {
  /** When provided the tabs become controlled and the active tab mirrors the scrolled-to section. */
  activeSection?: AnchorSection;
  className?: string;
  /** When true, prepends a "360 View" tab that scrolls back to the hero viewer. */
  hasThreeSixty?: boolean;
  sections: SectionType[];
}

function scrollToAnchor(section: AnchorSection) {
  document.getElementById(`gallery-section-${section}`)?.scrollIntoView({ behavior: "smooth" });
}

function GalleryAnchorBar({
  activeSection,
  className,
  hasThreeSixty = false,
  sections,
}: GalleryAnchorBarProps) {
  if (sections.length === 0 && !hasThreeSixty) {
    return null;
  }

  const defaultValue: AnchorSection = hasThreeSixty ? "360" : (sections[0] ?? "exterior");

  // Controlled (scroll-spy) when activeSection is provided; uncontrolled otherwise.
  // Using a spread avoids passing both value + defaultValue simultaneously.
  const tabsValue = activeSection
    ? ({ value: activeSection } as const)
    : ({ defaultValue } as const);

  return (
    <nav
      aria-label="Jump to image section"
      className={cn(className)}
      data-slot="gallery-anchor-bar"
    >
      {/* Mobile + tablet: horizontal tabs at top */}
      <div className="pb-4 lg:hidden">
        <Tabs {...tabsValue} orientation="horizontal" surface="dark">
          <TabsList variant="default">
            {hasThreeSixty && (
              <TabsTrigger key="360" onClick={() => scrollToAnchor("360")} size="lg" value="360">
                360° View
              </TabsTrigger>
            )}
            {sections.map((section) => (
              <TabsTrigger
                key={section}
                onClick={() => scrollToAnchor(section)}
                size="lg"
                value={section}
              >
                {SECTION_LABELS[section]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop: vertical tabs on left */}
      <div className="hidden lg:block">
        <Tabs {...tabsValue} orientation="vertical" surface="dark">
          <TabsList variant="default">
            {hasThreeSixty && (
              <TabsTrigger
                className="justify-start"
                key="360"
                onClick={() => scrollToAnchor("360")}
                size="lg"
                value="360"
              >
                360° View
              </TabsTrigger>
            )}
            {sections.map((section) => (
              <TabsTrigger
                className="justify-start"
                key={section}
                onClick={() => scrollToAnchor(section)}
                size="lg"
                value={section}
              >
                {SECTION_LABELS[section]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
}

export type { AnchorSection, GalleryAnchorBarProps };
export { GalleryAnchorBar };
