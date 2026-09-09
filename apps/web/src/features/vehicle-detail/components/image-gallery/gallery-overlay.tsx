"use client";

import { PageGrid } from "@ucmp/ui";
import { useEffect, useRef, useState } from "react";
import type { HotspotData, VehicleImage } from "../../types/image-gallery";
import { DetailImageCard } from "../detail-image-card";
import { ExpandOverlay, useExpandOverlay } from "../expand-overlay";
import { OverlayHeader } from "../expand-overlay/overlay-header";
import type { AnchorSection } from "./gallery-anchor-bar";
import { GalleryAnchorBar } from "./gallery-anchor-bar";
import { GalleryImage } from "./gallery-image";
import { groupImagesBySection } from "./group-images-by-section";

interface GalleryOverlayProps {
  conditionHotspots?: HotspotData[];
  /** Alt text for the trigger card's cover image. */
  coverImageAlt: string;
  /** Cover image URL rendered on the gallery trigger card. */
  coverImageUrl: string;
  images: VehicleImage[];
  keyFeaturesHotspots?: HotspotData[];
  make?: string;
  model?: string;
  threeSixtyManifestUrl?: string | null;
  trim?: string;
  year?: number | string;
}

function GalleryOverlay({
  conditionHotspots,
  coverImageAlt,
  coverImageUrl,
  images,
  keyFeaturesHotspots,
  make,
  model,
  threeSixtyManifestUrl = null,
  trim,
  year,
}: GalleryOverlayProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const overlay = useExpandOverlay(triggerRef);
  const hasImages = images.length > 0;

  const trigger = (
    <DetailImageCard
      imageAlt={coverImageAlt}
      imageUrl={coverImageUrl}
      label="Image Gallery"
      onAction={hasImages ? overlay.open : undefined}
      ref={triggerRef}
      showActionButton
      size="large"
    />
  );

  const vehicleTitle =
    make && model ? `${make} ${model}${trim ? ` ${trim}` : ""}`.toUpperCase() : undefined;

  const [imagesBySection, presentSections] = groupImagesBySection(images);

  return (
    <>
      {trigger}

      {hasImages && overlay.isMounted && (
        <ExpandOverlay
          ariaLabel="Image gallery"
          background={<div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />}
          contentVisible={overlay.contentVisible}
          onCollapseEnd={overlay.onCollapseEnd}
          onRequestClose={overlay.close}
          phase={overlay.phase}
          sourceRect={overlay.sourceRect}
        >
          <GalleryOverlayContent
            conditionHotspots={conditionHotspots}
            contentVisible={overlay.contentVisible}
            imagesBySection={imagesBySection}
            keyFeaturesHotspots={keyFeaturesHotspots}
            onClose={overlay.close}
            presentSections={presentSections}
            threeSixtyManifestUrl={threeSixtyManifestUrl}
            vehicleTitle={vehicleTitle}
            year={year}
          />
        </ExpandOverlay>
      )}
    </>
  );
}

// ─── Gallery overlay content ────────────────────────────────────────────────

interface GalleryOverlayContentProps {
  conditionHotspots?: HotspotData[];
  contentVisible: boolean;
  imagesBySection: Partial<Record<VehicleImage["type"], VehicleImage[]>>;
  keyFeaturesHotspots?: HotspotData[];
  onClose: () => void;
  presentSections: VehicleImage["type"][];
  threeSixtyManifestUrl: string | null;
  vehicleTitle?: string;
  year?: number | string;
}

function GalleryOverlayContent({
  conditionHotspots,
  contentVisible,
  imagesBySection,
  keyFeaturesHotspots,
  onClose,
  presentSections,
  threeSixtyManifestUrl,
  vehicleTitle,
  year,
}: GalleryOverlayContentProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /** Tracks which section is currently most prominent in the scroll view. */
  const [activeSection, setActiveSection] = useState<AnchorSection | undefined>(
    threeSixtyManifestUrl ? "360" : presentSections[0]
  );

  // Focus the close button once content becomes visible
  useEffect(() => {
    if (!contentVisible) {
      return;
    }
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [contentVisible]);

  // Scroll-spy: highlight the anchor tab matching the section most visible at the top.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || presentSections.length === 0) {
      return;
    }

    // Cache element refs once — avoids repeated getElementById on every scroll tick.
    const sectionEls = presentSections.map((section) => ({
      section,
      el: document.getElementById(`gallery-section-${section}`),
    }));

    const heroEl = threeSixtyManifestUrl ? document.getElementById("gallery-section-360") : null;

    const is360Active = (scrollTop: number): boolean => {
      if (!heroEl) {
        return false;
      }
      return scrollTop < heroEl.offsetHeight * 0.5;
    };

    let rafId: ReturnType<typeof requestAnimationFrame> | null = null;
    const handleScroll = () => {
      if (rafId !== null) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;

        if (is360Active(container.scrollTop)) {
          setActiveSection("360");
          return;
        }

        const containerRect = container.getBoundingClientRect();
        // A section becomes "active" once its top edge is within the top half of the container.
        const threshold = containerRect.top + containerRect.height * 0.5;
        let current: VehicleImage["type"] = presentSections[0] ?? "exterior";
        for (const { section, el } of sectionEls) {
          if (el && el.getBoundingClientRect().top <= threshold) {
            current = section;
          }
        }
        setActiveSection(current);
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount so the initial section is highlighted immediately.
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [presentSections]);

  let globalIndex = 0;

  return (
    <div className="flex h-full w-full flex-col" data-slot="gallery-overlay" data-surface="dark">
      <OverlayHeader
        closeLabel="Close gallery"
        closeRef={closeButtonRef}
        onClose={onClose}
        title={vehicleTitle ?? "Image Gallery"}
        year={year}
      />

      <PageGrid className="min-h-0 w-full flex-1 overflow-hidden pb-8">
        <GalleryAnchorBar
          activeSection={activeSection}
          className="col-span-full lg:col-span-1"
          hasThreeSixty={!!threeSixtyManifestUrl}
          sections={presentSections}
        />

        <div
          className="scrollbar-none col-span-full flex min-w-0 flex-1 flex-col gap-15 overflow-y-auto [-ms-overflow-style:none] lg:col-span-9 lg:col-start-4 [&::-webkit-scrollbar]:hidden"
          ref={scrollContainerRef}
        >
          {presentSections.map((section) => {
            const sectionImages = imagesBySection[section] ?? [];

            return (
              <section
                className="flex flex-col gap-4"
                id={`gallery-section-${section}`}
                key={section}
              >
                <ul className="mx-auto flex w-full flex-col gap-4">
                  {sectionImages.map((image) => {
                    // Only the absolute first image across all sections gets the GalleryTabBar
                    // hero widget (360 viewer + tab). Requires a live manifest URL — without one
                    // there is no 360 viewer to show, so the first image renders as a regular
                    // image + ManifestHotspotOverlay like all other images.
                    const isHero = globalIndex === 0 && !!threeSixtyManifestUrl;
                    const isPriority = globalIndex < 3;
                    globalIndex++;

                    return (
                      <li id={isHero ? "gallery-section-360" : undefined} key={image.url}>
                        <GalleryImage
                          conditionHotspots={conditionHotspots}
                          image={image}
                          isHero={isHero}
                          keyFeaturesHotspots={keyFeaturesHotspots}
                          priority={isPriority}
                          threeSixtyManifestUrl={threeSixtyManifestUrl}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </PageGrid>
    </div>
  );
}

export type { GalleryOverlayProps };
export { GalleryOverlay };
