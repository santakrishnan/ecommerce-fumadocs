"use client";

import { CardBadge } from "@shared/components/card";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Eyebrow,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ucmp/ui";
import { IconBinocular, IconCaretRight, IconEllipsis, IconInfo, IconToyotaX } from "@ucmp/ui/icons";
import Image from "next/image";
import { useState } from "react";
import { formatMileage, formatPrice } from "utils";

import { AddNoteDialog } from "../dialog/add-note-dialog";
import { WatchlistNoteDisplay } from "../watchlist-note-display";

import type {
  OverflowMenuItem,
  PaymentEstimate,
  PaymentOffer,
  WatchlistCardProps,
} from "./watchlist-card-types";

// ─── Internal sub-components ────────────────────────────────────────────────

function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More options"
        className="absolute top-3 right-3 z-10"
        render={<Button leadingIcon={IconEllipsis} size="icon-sm" variant="secondary" />}
      />
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.key} onClick={item.onSelect} variant={item.variant}>
            {item.icon && <item.icon aria-hidden="true" className="size-4" />}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EstimatePaymentSection({ payment }: { payment: PaymentEstimate }) {
  return (
    <div data-slot="watchlist-card-payment">
      <div className="body-md lg:body-lg text-text-primary">
        Estimated payment <span>{formatPrice(payment.monthly)}/mo</span>{" "}
        <span className="lg:hidden">with {formatPrice(payment.down)} down</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              aria-label="Payment information"
              className="ml-1 inline-flex align-middle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconInfo aria-hidden="true" className="size-4 text-text-secondary" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Estimated monthly payment based on standard financing terms.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="body-md lg:body-lg hidden text-text-primary lg:block">
        with {formatPrice(payment.down)} down
      </p>
    </div>
  );
}

function OfferPaymentSection({ payment }: { payment: PaymentOffer }) {
  return (
    <div className="flex flex-col gap-3" data-slot="watchlist-card-payment">
      <div className="flex flex-col gap-1">
        <p className="body-sm md:body-md text-text-primary">Your offer: {payment.expiry}</p>
        <p className="number-lg text-text-primary">
          {formatPrice(payment.monthly)}
          <span className="heading-h3 text-text-primary"> / mo</span>
        </p>
      </div>
      <p className="body-sm text-text-primary">
        {payment.apr}% APR for {payment.termMonths} months
      </p>
    </div>
  );
}

// ─── WatchlistCard ──────────────────────────────────────────────────────────

/**
 * WatchlistCard — self-contained, prop-driven vehicle card for the watchlist.
 *
 * Supports three visual states:
 * 1. **Default** (available vehicle) — price, payment estimate, badge, footer
 * 2. **Sold** — dimmed image, "Vehicle sold" badge, sold subtitle, no price/payment/footer
 * 3. **Active Offer** — price, offer payment (expiry + monthly + APR/term), badge, footer
 *
 * The payment area switches layout via the discriminated `type` field
 * on the `payment` prop ("estimate" vs "offer").
 */
export function WatchlistCard({
  badge,
  featureTag,
  imageAlt,
  imageSrc,
  make,
  mileage,
  model,
  note,
  originalPrice,
  overflowItems = [],
  payment,
  price,
  sold,
  trim,
  vin,
  watchingCount,
  year,
}: WatchlistCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savedNote, setSavedNote] = useState<string | undefined>(note);

  const title = `${make} ${model}${trim ? ` ${trim}` : ""}`.toUpperCase();
  const isSold = sold != null;
  const showStrikethrough = !isSold && originalPrice != null && originalPrice > price;

  // Replace the "add-note" overflow item with "Add a note" / "Edit note" trigger
  const resolvedOverflowItems = overflowItems.map((item) =>
    item.key === "add-note" || item.key === "share"
      ? {
          ...item,
          label: savedNote ? "Edit note" : "Add a note",
          onSelect: () => setDialogOpen(true),
        }
      : item
  );

  return (
    <>
      <article
        aria-label={isSold ? `${title} — Sold` : `${title} — ${formatPrice(price)}`}
        className="flex flex-col gap-4 md:grid md:grid-cols-8 md:gap-2"
        data-slot="watchlist-card"
        data-state={isSold ? "sold" : "default"}
      >
        {/* ── Media — full width on mobile, 3 cols on tablet+ ── */}
        <Card className="relative aspect-[107/60] overflow-clip p-0 md:col-span-3 md:aspect-[104/123]">
          <Image
            alt={imageAlt}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 30vw"
            src={imageSrc}
          />

          {/* Sold overlay — semi-transparent white */}
          {isSold && <div className="absolute inset-0 z-0 bg-white/50" />}

          {/* Badge (top-left) */}
          {badge && (
            <CardBadge
              className="absolute top-4 left-4 z-10"
              startIcon={badge.startIcon}
              startIconName={badge.iconName}
              variant={badge.variant ?? "inverse"}
            >
              {badge.label}
            </CardBadge>
          )}

          {/* Overflow trigger (top-right) */}
          {resolvedOverflowItems.length > 0 && <OverflowMenu items={resolvedOverflowItems} />}
        </Card>

        {/* ── Content — below image on mobile, right 5 cols on tablet+ ── */}
        <div className="flex items-center md:col-span-5 md:ml-6 md:pt-2 lg:pb-2">
          {/* Layout wrapper: title+payment at top, footer at bottom */}
          <div className="flex h-full w-full flex-col gap-6 md:justify-between md:gap-5 lg:justify-between lg:gap-10">
            {/* Title + Payment wrapper */}
            <div className="flex max-h-57.25 flex-col gap-6">
              {/* Title block */}
              <div className="flex flex-col gap-2" data-slot="watchlist-card-title-block">
                {/* Price — hidden for sold */}
                {!isSold && (
                  <div className="flex items-baseline gap-2">
                    <span className="body-md md:body-lg text-text-primary">
                      {formatPrice(price)}
                    </span>
                    {showStrikethrough && (
                      <span className="body-md md:body-lg text-text-secondary line-through">
                        {formatPrice(originalPrice as number)}
                      </span>
                    )}
                  </div>
                )}

                {/* Make / Model / Trim */}
                <p className="vehicle-title-lg md:vehicle-title-md text-text-primary">{title}</p>

                {/* Sold subtitle OR Year • Mileage */}
                {isSold ? (
                  <p className="body-md md:body-lg text-text-secondary">
                    Sold on {sold.date} at {sold.dealer}
                  </p>
                ) : (
                  <p className="body-md md:body-lg text-text-primary">
                    {year} • {formatMileage(mileage)}
                  </p>
                )}
              </div>

              {/* Payment area — hidden for sold */}
              {!isSold && payment?.type === "estimate" && (
                <EstimatePaymentSection payment={payment} />
              )}
              {!isSold && payment?.type === "offer" && <OfferPaymentSection payment={payment} />}
            </div>

            {/* Footer + note */}
            <div className="flex flex-col gap-4">
              {/* Footer — hidden for sold */}
              {!isSold && (
                <div
                  className="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-4"
                  data-slot="watchlist-card-footer"
                >
                  {watchingCount != null && watchingCount > 0 && (
                    <Eyebrow className="text-text-secondary">
                      <IconBinocular aria-hidden="true" />
                      {watchingCount} watching
                    </Eyebrow>
                  )}
                  {featureTag && (
                    <Eyebrow className="text-text-secondary">
                      <IconToyotaX aria-hidden="true" />
                      {featureTag}
                    </Eyebrow>
                  )}
                </div>
              )}

              {/* Inline note — rendered below the footer */}
              {savedNote && <WatchlistNoteDisplay note={savedNote} />}
            </div>
          </div>

          {/* ── Caret (right edge) — vertically centered, hidden on mobile ── */}
          <IconCaretRight
            aria-hidden="true"
            className="hidden size-5 shrink-0 text-text-secondary md:block"
          />
        </div>
      </article>

      <AddNoteDialog
        initialNote={savedNote}
        onOpenChange={setDialogOpen}
        onSaveNote={(newNote) => setSavedNote(newNote)}
        open={dialogOpen}
        vin={vin ?? ""}
      />
    </>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

/**
 * Size-matched skeleton for the WatchlistCard.
 * Use as Suspense fallback — prevents layout shift.
 */
export function WatchlistCardSkeleton() {
  return (
    <div className="grid grid-cols-8 gap-2" data-slot="watchlist-card-skeleton">
      {/* Image placeholder */}
      <Skeleton className="col-span-3 aspect-[104/123] rounded-xl" />

      {/* Content placeholder */}
      <div className="col-span-5 ml-6 flex flex-col justify-between py-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
