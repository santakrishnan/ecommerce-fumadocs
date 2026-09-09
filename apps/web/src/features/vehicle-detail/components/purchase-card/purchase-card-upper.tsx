import { CardBadge, type CardBadgeIconName } from "@shared/components/card";
import {
  Button,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@ucmp/ui";
import { IconPriceTagFilled } from "@ucmp/ui/icons";
import Image from "next/image";
import { formatMileage, formatPrice } from "utils";
import { VehicleDetailStickyCta } from "../vehicle-detail-sticky-cta";
import type {
  PurchaseCardCertification,
  PurchaseCardUpperProps,
  PurchaseCardVehicle,
  PurchasePaymentState,
} from "./purchase-card.types";
import { PurchaseCardInfoTrigger } from "./purchase-card-info-trigger";
import { PurchaseCardSaveToggle } from "./purchase-card-save-toggle";

// Re-export all types so existing imports from this module still work.
export type {
  PurchaseCardCertification,
  PurchaseCardDealer,
  PurchaseCardUpperProps,
  PurchaseCardVehicle,
  PurchasePaymentState,
  PurchaseStateActive,
  PurchaseStateDefault,
  PurchaseStateEstimated,
  PurchaseStateExpired,
} from "./purchase-card.types";

// ─── Helpers ────────────────────────────────────────────────────────

function getBadgeLabel(certification: PurchaseCardCertification | undefined): string {
  if (certification === "gold") {
    return "Gold Certified";
  }
  if (certification === "silver") {
    return "Silver Certified";
  }
  return "Below market";
}

function getBadgeIconName(
  certification: PurchaseCardCertification | undefined
): CardBadgeIconName | undefined {
  if (certification === "gold" || certification === "silver") {
    return;
  }
  return "price-tag-filled";
}

function buildTitle(vehicle: PurchaseCardVehicle): string {
  return [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ").toUpperCase();
}

function getCtaLabel(state: PurchasePaymentState): string {
  switch (state.kind) {
    case "active":
      return "Continue purchase";
    case "expired":
      return "Restart purchase";
    default:
      return "Get pre-approved";
  }
}

function getCtaAriaLabel(state: PurchasePaymentState, title: string): string {
  const action = getCtaLabel(state);
  return `${action} for ${title}`;
}

/**
 * Purchase Card Upper — content region of the VDP purchase panel.
 *
 * Renders header, payment block, CTA, and availability.
 */
export function PurchaseCardUpper({
  availabilitySlot,
  badgeLabel: badgeLabelProp,
  badgeIconName: badgeIconNameProp,
  vehicle,
  dealer,
  enableStickyCta = true,
  paymentState = { kind: "default" },
  isSaved,
  onSaveToggle,
  onInfoClick,
  titleTransitionName,
}: PurchaseCardUpperProps) {
  const { certification, mileage, price: salePrice, year } = vehicle;
  const title = buildTitle(vehicle);
  const badgeLabel = badgeLabelProp ?? getBadgeLabel(certification);
  const badgeIconName = badgeIconNameProp ?? getBadgeIconName(certification);
  const ctaLabel = getCtaLabel(paymentState);
  const ctaAriaLabel = getCtaAriaLabel(paymentState, title);
  const saveToggleControlProps = typeof isSaved === "boolean" ? { isSaved, onSaveToggle } : {};

  return (
    <div className="flex w-full flex-col" data-testid="purchase-card-upper">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <CardHeader className="mb-8 gap-4 px-0 lg:mb-12 lg:gap-10">
        {/* Badge */}
        <CardBadge
          startIcon={
            badgeIconName === "price-tag-filled" ? (
              <IconPriceTagFilled className="text-brand" data-icon="inline-start" />
            ) : undefined
          }
          startIconName={badgeIconName}
          variant="default"
        >
          {badgeLabel}
        </CardBadge>

        {/* Save toggle */}
        <CardAction>
          <PurchaseCardSaveToggle {...saveToggleControlProps} vehicle={vehicle} />
        </CardAction>

        {/* Price, Title, Year·Mileage */}
        <div className="flex flex-col gap-2">
          {/* Price row */}
          <CardDescription className="flex items-baseline gap-2 text-text-primary">
            <span className="body-lg text-text-primary">{formatPrice(salePrice)}</span>
          </CardDescription>

          {/* Title */}
          <CardTitle>
            <h2
              className="vehicle-title-lg text-text-primary"
              style={{ viewTransitionName: titleTransitionName }}
            >
              {title}
            </h2>
          </CardTitle>

          {/* Year · Mileage */}
          <CardDescription className="text-text-primary">
            <p className="body-lg text-text-primary">
              {year} · {formatMileage(mileage)}
            </p>
          </CardDescription>
        </div>
      </CardHeader>

      {/* ─── Payment Block (state-driven) ───────────────────────── */}
      {paymentState.kind !== "default" && (
        <CardContent className="mb-8 flex flex-col gap-2 px-0 py-0 lg:mb-12">
          {paymentState.kind === "estimated" && (
            <div className="flex items-center gap-1">
              <span className="body-lg text-text-primary">
                Estimated payment {formatPrice(paymentState.monthlyPayment)}/mo <br /> with{" "}
                {formatPrice(paymentState.downPayment)} down
              </span>
              <PurchaseCardInfoTrigger onInfoClick={onInfoClick} />
            </div>
          )}

          {paymentState.kind === "active" && (
            <>
              <span className="body-lg text-text-primary">
                Your offer: {paymentState.expiresIn}
              </span>
              <span className="number-lg text-text-primary">
                {formatPrice(paymentState.monthlyPayment)}
                <span className="h3 text-text-primary"> / mo</span>
              </span>
              <span className="body-sm text-text-primary">
                {paymentState.apr}% APR for {paymentState.termMonths} months
              </span>
            </>
          )}

          {paymentState.kind === "expired" && (
            <span className="body-lg text-text-primary">Your previous offer has expired.</span>
          )}
        </CardContent>
      )}

      {/* ─── Primary CTA (sticky on mobile when scrolled out of view) ── */}
      <CardContent className="mb-12 px-0 py-0" data-testid="purchase-cta-wrapper">
        {enableStickyCta ? (
          <VehicleDetailStickyCta ariaLabel={ctaAriaLabel} label={ctaLabel} />
        ) : (
          <Button aria-label={ctaAriaLabel} fullWidth size="lg" type="button" variant="primary">
            {ctaLabel}
          </Button>
        )}
      </CardContent>

      {/* ─── Availability Block ──────────────────────────────────── */}
      <CardFooter className="flex-col items-stretch gap-8 px-0">
        {availabilitySlot ?? (
          <div className="flex cursor-pointer items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="subhead-lg text-text-primary">Available at {dealer.name}</span>
              <span className="body-lg text-text-primary">{dealer.address}</span>
            </div>
            {!!dealer.mapThumbnailUrl && (
              <Image
                alt={`Map showing ${dealer.name} location`}
                className="shrink-0 rounded-xl object-cover"
                height={71}
                src={dealer.mapThumbnailUrl}
                width={71}
              />
            )}
          </div>
        )}
        <Separator className="hidden lg:block" />
      </CardFooter>
    </div>
  );
}
