import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from "@ucmp/ui";
import Image from "next/image";
import Link from "next/link";
import { cn, formatMileage, formatPrice } from "utils";
import type { DealerDeal } from "../../data/schemas/dealer-deal";

interface DealerDealCardProps {
  /** Optional className for the outer container. */
  className?: string;
  /** The deal data to render — fully data-driven, no hardcoded values. */
  deal: DealerDeal;
  /** Mark as LCP image when above the fold. Default: false */
  priority?: boolean;
}

/**
 * Dealer Deal Card — surfaces a featured vehicle with financing details.
 *
 * Uses the shared Card component from @ucmp/ui for consistency, with layout
 * overrides for the full-bleed hero presentation:
 * - Mobile (< md): Stacked — image on top, info panel below.
 * - Tablet (md → lg): Stacked — 16:9 image on top, info panel below.
 * - Desktop (≥ lg): Full-width image with info panel overlaid inside.
 */
export function DealerDealCard({ deal, className, priority = false }: DealerDealCardProps) {
  const vehicleTitle = `${deal.model} ${deal.trim ?? ""}`.trim();

  return (
    <Card
      aria-label={`Deal: ${deal.year} ${deal.make} ${vehicleTitle}`}
      className={cn(
        "relative rounded-none border-0 bg-[oklch(0.78_0.06_70)] py-0 shadow-none ring-0",
        // Full-bleed on mobile/tablet: cancel the page-grid px-5 gutter on both
        // sides (negative margin + matching width) so the hero touches the
        // screen edges. Reset to inset + rounded on desktop.
        "-mx-5 w-[calc(100%+2.5rem)] hover:scale-100 lg:mx-auto lg:w-full lg:rounded-2xl",
        className
      )}
      data-surface="dark"
      role="article"
    >
      {/* Image section */}
      <div className="relative aspect-[4/3.5] w-full bg-neutral-700 md:aspect-video md:h-auto lg:aspect-[5/2] xl:aspect-[16/5]">
        <Image
          alt={deal.imageAlt}
          className="object-cover object-[25%_60%] md:object-[10%_60%] lg:object-center"
          fill
          placeholder="empty"
          priority={priority}
          sizes="(min-width: 1440px) 100vw"
          src={deal.imageUrl}
        />
        {/* Dark gradient overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/35 via-50% via-transparent to-black/49 opacity-70"
        />
        {/* Gradient that blends image bottom into the deal card content area */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%] bg-linear-to-b from-transparent via-60% via-[oklch(0.78_0.06_70/0.6)] to-[oklch(0.78_0.06_70)] lg:hidden"
        />

        {/* Vehicle meta (bottom-left) */}
        <div className="pointer-events-none absolute bottom-0 left-0 py-4 pr-4 pl-5 lg:p-10">
          <div className="flex flex-col">
            <span className="body-md lg:body-lg text-text-secondary">
              {formatPrice(deal.askingPrice)}
            </span>
            <h3 className="vehicle-title-lg lg:vehicle-title-md mt-1 text-text-primary">
              {vehicleTitle}
            </h3>
            <span className="body-md lg:body-lg mt-3 text-text-secondary">
              {deal.year} · {formatMileage(deal.mileage)}
            </span>
          </div>
        </div>
      </div>

      {/* Financing info panel */}
      <Card
        className={cn(
          "mx-5 mb-5 flex h-auto w-auto flex-col rounded-xl border-0 bg-card-dark px-6 py-8 text-text-primary shadow-none ring-0 hover:scale-100",
          "glass md:px-10 md:py-8 lg:absolute lg:top-5 lg:right-5 lg:bottom-5 lg:mx-0 lg:mb-0 lg:w-1/3 lg:flex-col lg:justify-between lg:rounded-2xl lg:px-8 lg:py-10 xl:w-1/3 xl:flex-col xl:justify-between"
        )}
      >
        <div className="flex flex-col gap-10">
          {deal.urgencyMessage && (
            <CardHeader className="gap-0 p-0">
              <CardTitle className="h3 pr-8 text-text-primary">{deal.urgencyMessage}</CardTitle>
            </CardHeader>
          )}

          <CardContent className="flex flex-col gap-4 px-0 py-0">
            <dl aria-label="Financing details" className="grid grid-cols-3 gap-4">
              <div className="flex min-w-0 flex-col-reverse gap-2">
                <dt className="body-md text-text-primary">Per month</dt>
                <dd className="number-lg text-text-primary">
                  {formatPrice(deal.financing.monthlyPayment)}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col-reverse gap-2">
                <dt className="body-md text-text-primary">APR</dt>
                <dd className="number-lg text-text-primary">{deal.financing.aprPercent}%</dd>
              </div>
              <div className="flex min-w-0 flex-col-reverse gap-2">
                <dt className="body-md text-text-primary">Months</dt>
                <dd className="number-lg text-text-primary">{deal.financing.termMonths}</dd>
              </div>
            </dl>
            <p className="body-md text-text-primary">
              Based on a credit score of {deal.financing.minCreditScore}+
            </p>
          </CardContent>
        </div>

        <CardFooter className="mt-10 px-0 py-0 lg:mt-0">
          <Button
            fullWidth
            nativeButton={false}
            render={<Link href={deal.buyNowHref} />}
            size="lg"
            variant="primary"
          >
            Buy Now
          </Button>
        </CardFooter>
      </Card>
    </Card>
  );
}
