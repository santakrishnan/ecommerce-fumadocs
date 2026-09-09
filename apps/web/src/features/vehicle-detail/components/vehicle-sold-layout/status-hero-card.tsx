import { Card } from "@ucmp/ui";
import type { ReactNode } from "react";

export interface StatusHeroCardProps {
  alt: string;
  ctaCard: ReactNode;
  imageUrl: string;
  imageUrlDesktop?: string;
  imageUrlTablet?: string;
}

/**
 * Status Hero Card — unavailable-vehicle image with a status CTA overlay.
 *
 * Mobile: image (aspect-ratio driven) stacked above the CTA card.
 * Card height is content + padding driven — no fixed height.
 * Tablet/Desktop: image fills the card background absolutely. Card height
 * is content-driven with a min-h-128.5 (514px) floor so the image never
 * collapses when the CTA card has sparse content.
 */
export function StatusHeroCard({
  imageUrl,
  imageUrlDesktop,
  imageUrlTablet,
  alt,
  ctaCard,
}: StatusHeroCardProps) {
  return (
    <Card className="relative -mx-5 grid grid-cols-4 rounded-none bg-surface-sold shadow-none ring-0 md:mx-0 md:mt-(--vdp-nav-height,7.5rem) md:min-h-128.5 md:grid-cols-8 md:rounded-xl md:bg-neutral-100 md:shadow-xs md:ring-1 md:ring-foreground/10 lg:grid-cols-12">
      {/* Image — aspect-ratio on mobile, absolute fill behind CTA on tablet/desktop */}
      <div className="relative col-span-full aspect-91/94 md:absolute md:inset-0 md:aspect-auto md:h-full md:rounded-xl">
        <picture>
          {imageUrlDesktop && <source media="(min-width: 1024px)" srcSet={imageUrlDesktop} />}
          {imageUrlTablet && <source media="(min-width: 768px)" srcSet={imageUrlTablet} />}
          <img
            alt={alt}
            className="h-auto w-full object-cover object-center md:absolute md:inset-0 md:h-full md:w-full md:rounded-xl md:object-[10%]"
            fetchPriority="high"
            height={412}
            src={imageUrl}
            width={402}
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-b from-transparent to-surface-sold md:hidden"
        />
      </div>

      <div className="col-span-full p-5 md:relative md:col-span-4 md:col-start-5 md:flex md:h-full md:items-center md:pt-6 md:pr-6 md:pb-6 md:pl-0 lg:col-span-4 lg:col-start-9">
        {ctaCard}
      </div>
    </Card>
  );
}
