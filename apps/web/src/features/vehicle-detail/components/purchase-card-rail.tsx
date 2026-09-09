import "server-only";

import { DEFAULT_PROFILE_TIER, PROFILE_TIER_COOKIE, profileTierSchema } from "@config/profile-tier";
import {
  buildExistingAppointment,
  type TestDriveVehicle,
  todayDateOnly,
} from "@features/test-drive-booking";
import { getVdpBookingState } from "@features/test-drive-booking/bff";
import { DEALER_BAY_RIDGE } from "@features/vehicle-detail/__fixtures__";
import type { DealerExtended } from "@features/vehicle-detail/bff/contracts/dealer-detail.schema";
import type { VdpCertificationTier } from "@features/vehicle-detail/flags/vdp-flags.constants";
import { PanelCard } from "@shared/components/card";
import { VIEW_TRANSITION_NAME_TITLE } from "@shared/components/shared-hero-transition";
import { Button, Separator, Skeleton } from "@ucmp/ui";
import { IconCaretRight, IconSaved } from "@ucmp/ui/icons";
import { cookies } from "next/headers";
import Image from "next/image";
import { Suspense } from "react";
import type { VdpApiResponse } from "../bff/contracts/vdp-response.schema";
import {
  detectCardState,
  toPurchaseCardFromApi,
  toSoldCardFromApi,
} from "../mappers/to-purchase-card-from-api";
import { DealerInsightLoader, DealerInsightSkeleton } from "./dealer-insight-loader";
import { PurchaseCard } from "./purchase-card";
import { BookingSection } from "./purchase-card/booking-section";
import { StatusCard } from "./sold-card";

type TestDrive = NonNullable<DealerExtended["testDrive"]>;
// DealerInfoData.testDrive is typed optional/nullable; ?? provides a safe static fallback
// that mirrors the fixture value and ensures DEFAULT_TEST_DRIVE is always a TestDrive.
const DEFAULT_TEST_DRIVE: TestDrive = DEALER_BAY_RIDGE.testDrive ?? {
  date: new Date().toISOString().slice(0, 10),
  dayLabel: "Today",
  slots: ["12:00 PM", "2:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"],
};

export function resolveTestDrive(
  testDrive: DealerExtended["testDrive"],
  fallback: TestDrive = DEFAULT_TEST_DRIVE
): TestDrive {
  if (testDrive?.slots.length) {
    return testDrive;
  }

  return fallback;
}

export interface PurchaseCardRailProps {
  /** Certification tier (resolved upstream from the flag cookie). */
  certification: VdpCertificationTier;
  /** Pre-fetched VDP API response — avoids a duplicate BFF call. */
  vdpData: VdpApiResponse;
}

export interface PurchaseCardRailSkeletonProps {
  heading?: string;
  year?: string;
}

/**
 * Purchase Card right-rail — renders either a PurchaseCard (active) or StatusCard.
 *
 * Receives the already-fetched `vdpData` from the page so the BFF is called
 * only once per request (in `getVehicleStatus`).
 *
 * Dealer insight is fetched independently in a <Suspense>-wrapped async leaf
 * (DealerInsightLoader) so it does not block the purchase card shell from streaming.
 * The dealerCode and traceId are derived from `vdpData` — no need to pass them explicitly.
 */
export async function PurchaseCardRail({ certification, vdpData }: PurchaseCardRailProps) {
  const response = vdpData;
  const cardState = detectCardState(response);

  // ─── Sold Vehicle → StatusCard ───────────────────────────────────────────
  if (cardState === "sold") {
    const { vehicle, dealer, soldDate } = toSoldCardFromApi(response);
    return <StatusCard dealer={dealer} soldDate={soldDate} vehicle={vehicle} />;
  }

  // ─── Active Vehicle → PurchaseCard ───────────────────────────────────────
  const { vehicle, dealer, dealerInfo, paymentState, badgeLabel, badgeIconName } =
    toPurchaseCardFromApi(response, certification);

  const testDrive = resolveTestDrive(dealerInfo.testDrive);

  // Derive dealer insight inputs from the VDP response (no prop drilling needed)
  const dealerCode = response.data.dealer?.dealerCode;
  const traceId = response.meta.traceId;

  const { state: bookingState, appointment: bookedAppointment } = await getVdpBookingState(
    vehicle.vin,
    dealer.dealerCode
  );
  const currentVehicle: TestDriveVehicle = {
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    title: [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ").toUpperCase(),
  };
  const tierCookie = (await cookies()).get(PROFILE_TIER_COOKIE)?.value;
  const parsedTier = profileTierSchema.safeParse(tierCookie);
  const isAnonymous = (parsedTier.success ? parsedTier.data : DEFAULT_PROFILE_TIER) === "t0";

  const viewedDate = todayDateOnly();
  const initialAppointment =
    bookedAppointment ??
    buildExistingAppointment({
      dealerAddress: dealer.address,
      dealerCode: dealer.dealerCode,
      dealerName: dealer.name,
      currentVehicle,
      slots: testDrive.slots,
      state: bookingState,
    });

  // Use collision-safe shared constant for view-transition-name.
  // The clicked card's title gets this name dynamically at click time.
  const titleTransitionName = VIEW_TRANSITION_NAME_TITLE;

  return (
    <PurchaseCard
      availabilitySlot={
        dealerCode && traceId ? (
          <Suspense fallback={<DealerInsightSkeleton />}>
            <DealerInsightLoader
              dealerCode={dealerCode}
              traceId={traceId}
              trigger={
                <Button
                  className="flex w-full items-center justify-between gap-4 rounded-xl text-left"
                  variant="text"
                >
                  {/* Mobile/Tablet: dealer name + chevron only */}
                  <span className="inline-flex items-end gap-1 lg:hidden">
                    <span className="subhead-lg text-text-primary">Available at {dealer.name}</span>
                    <IconCaretRight className="size-3.5 text-text-primary" />
                  </span>

                  {/* Desktop: full address + map thumbnail */}
                  <span className="hidden flex-col gap-1 lg:flex">
                    <span className="subhead-lg text-text-primary underline-offset-2">
                      Available at {dealer.name}
                    </span>
                    <span className="body-lg text-text-primary">{dealer.address}</span>
                  </span>
                  {!!dealer.mapThumbnailUrl && (
                    <Image
                      alt={`Map showing ${dealer.name} location`}
                      className="hidden shrink-0 rounded-xl object-cover lg:block"
                      height={71}
                      src={dealer.mapThumbnailUrl}
                      width={71}
                    />
                  )}
                </Button>
              }
            />
          </Suspense>
        ) : null
      }
      badgeIconName={badgeIconName}
      badgeLabel={badgeLabel}
      bookingStrip={
        <BookingSection
          currentVehicle={currentVehicle}
          dayLabel={testDrive.dayLabel}
          dealerAddress={dealer.address}
          dealerCode={dealer.dealerCode}
          dealerName={dealer.name}
          initialAppointment={initialAppointment}
          isAnonymous={isAnonymous}
          slots={testDrive.slots}
          state={bookingState}
          viewedDate={viewedDate}
        />
      }
      dealer={dealer}
      paymentState={paymentState}
      titleTransitionName={titleTransitionName}
      vehicle={vehicle}
    />
  );
}

/** Lightweight skeleton for the rail's Suspense fallback. */
export function PurchaseCardRailSkeleton({
  heading = "Car name",
  year,
}: PurchaseCardRailSkeletonProps) {
  return (
    <PanelCard
      aria-hidden="true"
      className="w-full max-w-none bg-surface-secondary px-8 pt-12 pb-14 lg:max-w-md xl:max-w-none"
      data-slot="purchase-card-skeleton"
      data-surface="light"
    >
      <div className="flex w-full flex-col text-text-primary-light">
        {/* ─── Header: badge + save (matches CardHeader mb-8) ─── */}
        <div className="mb-8 flex items-start justify-between">
          {/* Figma label ~84.875x16 + pill padding (t/b 4, l 4, r 8) ≈ 96.875x24. */}
          <Skeleton className="h-6 w-24 rounded-full bg-surface-primary" />
          <span className="inline-flex size-5 items-center justify-center">
            <IconSaved className="size-6" />
          </span>
        </div>

        {/* ─── Price / Title / Year·Mileage (inside CardHeader gap-2) ─── */}
        <div className="flex flex-col gap-2 uppercase">
          <p className="body-lg">$00,000</p>
          <h3 className="vehicle-title-lg">{heading}</h3>
          <p className="body-lg">{year ? `${year} · Mileage` : "Year · Mileage"}</p>
        </div>

        {/* ─── Payment placeholder (matches CardContent mb-12) ─── */}
        <div className="mt-8 mb-12 flex flex-col gap-2">
          {/* Figma long line ~267px; Tailwind closest scale is max-w-64 (256px). */}
          <Skeleton className="h-4 w-64 max-w-full bg-surface-primary" />
          <Skeleton className="h-4 w-40 max-w-full bg-surface-primary" />
        </div>

        {/* ─── CTA button (matches Button size="lg" min-h-11 + py-5 ≈ h-14, mb-12) ─── */}
        <div className="mb-12">
          <Skeleton className="h-14 w-full rounded-full bg-surface-muted" />
        </div>

        {/* ─── Availability: dealer + map (matches CardFooter gap-8) ─── */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-64 max-w-full bg-surface-primary" />
              <Skeleton className="h-4 w-40 max-w-full bg-surface-primary" />
            </div>
            {/* Use Tailwind scale (72px) instead of an arbitrary pixel value for maintainability. */}
            <Skeleton className="size-18 shrink-0 rounded-xl bg-surface-primary" />
          </div>
          <Separator />
        </div>

        {/* ─── Booking strip (matches BookingStrip pt-8 gap-4) ─── */}
        <div className="flex flex-col gap-4 pt-8">
          <p className="subhead-lg">Schedule a test drive</p>
          {/* Day label spacer (matches body-lg mt-2 mb-4) */}
          <div aria-hidden="true" className="mt-2 mb-4 h-5" />
          {/* Pills — bleed to card edges (matches -mx-8 + px-8, Pill min-h-12) */}
          <div className="-mx-8 overflow-hidden">
            <div className="flex items-center gap-1 px-8">
              {Array.from({ length: 6 }, (_, slot) => slot + 1).map((slot) => (
                <Skeleton
                  className="h-12 min-h-12 w-24 shrink-0 rounded-full bg-surface-primary"
                  key={`booking-slot-${slot}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
