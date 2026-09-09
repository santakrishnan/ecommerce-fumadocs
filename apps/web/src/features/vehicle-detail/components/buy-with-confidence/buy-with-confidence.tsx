import { normalizeImageUrl } from "@shared/lib/media";
import { Card } from "@ucmp/ui";
import { IconCheckmark, IconToyotaX } from "@ucmp/ui/icons";
import Image from "next/image";
import { cn } from "utils";
import type { BuyWithConfidenceData } from "../../__fixtures__/buy-with-confidence.fixture";

export interface BuyWithConfidenceProps {
  /** Additional class names for the outer container. */
  className?: string;
  /** Content payload — heading, image, benefits. */
  data: BuyWithConfidenceData;
}

const HEADING_ID = "buy-with-confidence-heading";

/**
 * Buy with no hidden surprises — VDP trust / benefits block.
 *
 * Mobile/tablet: Image (aspect-487/451.5) stacked above the glassmorphism
 * content card. Card height is content + padding driven — no fixed height.
 *
 * Desktop (lg+): Full-cover background image behind the glassmorphism info
 * panel placed at grid columns 9–12 via subgrid. Card height is driven by
 * the content panel (min-h sets a floor).
 */
export function BuyWithConfidence({ data, className }: BuyWithConfidenceProps) {
  return (
    <Card
      aria-labelledby={HEADING_ID}
      className={cn(
        "relative col-span-full overflow-hidden border-0 p-0 shadow-none ring-0",
        // Mobile/tablet: stacked layout with warm-grey bg, no rounding
        "rounded-none bg-warm-grey",
        // Desktop: subgrid layout with full-cover image, rounded card
        "lg:grid lg:min-h-128.5 lg:grid-cols-subgrid lg:rounded-xl lg:bg-transparent",
        className
      )}
      data-surface="dark"
      role="region"
    >
      {/* Background image — aspect-ratio on mobile/tablet, full-cover fill on desktop */}
      {/* Figma: 487×451.5 (mobile/tablet) — height is content-driven on desktop */}
      <div className="relative aspect-487/451.5 w-full lg:absolute lg:inset-0 lg:aspect-auto">
        <Image
          alt={data.image.alt}
          className="size-full object-cover object-[38%_center] lg:object-center"
          fill
          loading="eager"
          sizes="100vw"
          src={normalizeImageUrl(data.image.src)}
        />
        {/* Gradient blending image bottom into warm-grey (mobile/tablet only) */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-[10%]",
            "bg-linear-to-b from-transparent via-60% via-warm-grey/60 to-warm-grey",
            "lg:hidden"
          )}
        />
      </div>

      {/* Card positioning wrapper — overlap on mobile, subgrid on desktop */}
      <div
        className={cn(
          "-mt-24 px-5 pb-5",
          "lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:mt-5 lg:mr-5 lg:self-start lg:pb-5 lg:pl-0"
        )}
      >
        <Card
          className={cn(
            "flex flex-col gap-9 bg-black/30 px-8 py-10 shadow-none backdrop-blur-md",
            "lg:gap-10 lg:bg-black/60"
          )}
        >
          <div className="flex flex-col items-start gap-3">
            <IconToyotaX aria-hidden className="size-5 text-text-primary lg:text-brand" />
            <h2 className="h3 max-w-71.5 text-text-primary" id={HEADING_ID}>
              {data.heading}
            </h2>
          </div>

          <ul aria-labelledby={HEADING_ID} className="flex w-full flex-col divide-y divide-divider">
            {data.benefits.map((benefit, index) => (
              <li
                className={cn("flex gap-1", index === 0 ? "pb-6" : "py-6 last:pb-0")}
                key={benefit.id}
              >
                <IconCheckmark aria-hidden className="mt-0.5 size-5 shrink-0 text-text-primary" />
                <div className="flex flex-col gap-2">
                  <p className="subhead-lg text-text-primary">{benefit.title}</p>
                  <p className="body-sm max-w-58.5 text-text-secondary md:max-w-none lg:max-w-58.5">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Card>
  );
}
