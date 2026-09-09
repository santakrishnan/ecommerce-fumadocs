"use client";

import type {
  DealerInsight,
  DealerInsightHoursEntry,
  DealerInsightResponse,
} from "@features/vehicle-detail/bff";
import { normalizeImageUrl } from "@shared/lib/media";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
  DialogTopBar,
  DialogTrigger,
  Rating,
} from "@ucmp/ui";
import type { ReactElement } from "react";
import { useState } from "react";
import { useDealerInsight } from "../../hooks/use-dealer-insight";
import { withVdpViewTransition } from "../../lib/vdp-view-transition";
import { DealerGallery } from "./dealer-gallery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealerInfoDialogProps {
  /** Dealer code used to fetch dealer insight data from the BFF. */
  dealerCode: string;
  /** Server-prefetched dealer insight data — avoids loading state on dialog open. */
  initialData?: DealerInsightResponse;
  /** The trigger element that opens the dialog (e.g. dealer/map thumbnail button). */
  trigger: ReactElement;
}

/** Grouped hours range (e.g. "Mon - Thu" → "9:00 AM – 9:00 PM") */
interface GroupedHoursEntry {
  hours: string;
  label: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Groups consecutive days with the same hours into range labels.
 * e.g. "Mon - Thu" → "9:00 AM - 9:00 PM"
 */
function groupHoursEntries(entries: DealerInsightHoursEntry[]): GroupedHoursEntry[] {
  const groups: GroupedHoursEntry[] = [];

  for (const entry of entries) {
    const last = groups.at(-1);

    if (last && last.hours === entry.hours) {
      // Extend range: "Mon" becomes "Mon - Thu"
      const dash = last.label.indexOf(" - ");
      const first = dash === -1 ? last.label : last.label.slice(0, dash);
      last.label = `${first} - ${entry.day}`;
    } else {
      groups.push({ label: entry.day, hours: entry.hours });
    }
  }

  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dealer Info Dialog — renders dealer details in a modal overlay.
 *
 * When `initialData` is provided (prefetched server-side in PurchaseCardRail),
 * the dialog opens instantly without a loading skeleton. Falls back to
 * client-side fetch if prefetched data is unavailable.
 */
export function DealerInfoDialog({ trigger, dealerCode, initialData }: DealerInfoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, isError } = useDealerInsight({
    dealerCode,
    enabled: isOpen,
    initialData,
  });

  const handleOpenChange = (open: boolean) => {
    withVdpViewTransition(() => setIsOpen(open));
  };

  const dealer = data?.dealer;

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <div style={{ viewTransitionName: isOpen ? undefined : "vdp-dealer-dialog" }}>
        <DialogTrigger render={trigger} />
      </div>
      <DialogContent
        aria-label={dealer?.dealerName}
        className="overflow-hidden pb-0 lg:w-screen lg:pb-0"
        style={{ viewTransitionName: isOpen ? "vdp-dealer-dialog" : undefined }}
      >
        <DialogTopBar />
        <DialogBody className="flex flex-col gap-8 overflow-x-clip pb-12">
          {isLoading && <DealerInfoSkeleton />}
          {isError && <DealerInfoError />}
          {dealer && <DealerInfoContent dealer={dealer} />}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

function DealerInfoContent({ dealer }: { dealer: DealerInsight }) {
  const photos = dealer.media.photos.map((photo) => normalizeImageUrl(photo.url, ""));
  const mapUrl = normalizeImageUrl(dealer.media.mapThumbnail?.url, "");
  const grouped = dealer.hours ? groupHoursEntries(dealer.hours.weeklySchedule) : [];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-6">
        <h2 className="h1 lg:h2">{dealer.dealerName}</h2>
        <DialogTitle className="sr-only">{dealer.dealerName}</DialogTitle>
        {dealer.rating && (
          <span className="subhead-lg lg:subhead-sm flex items-center gap-4">
            <span>{dealer.rating.value}</span>
            <Rating value={dealer.rating.value} />
            <span>
              {dealer.rating.reviewCount.toLocaleString()} {dealer.rating.reviewSource} reviews
            </span>
          </span>
        )}
      </div>

      {/* Contact & Hours */}
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3">
        <dt className="subhead-lg lg:subhead-sm">Address</dt>
        <dd className="body-lg lg:body-md">
          {`${dealer.address.line1}, ${dealer.address.city}, ${dealer.address.state} ${dealer.address.postalCode}`}
        </dd>

        {dealer.phone && (
          <>
            <dt className="subhead-lg lg:subhead-sm">Phone</dt>
            <dd>
              <a className="body-lg lg:body-md" href={`tel:${dealer.phone}`}>
                {dealer.phone}
              </a>
            </dd>
          </>
        )}

        {dealer.hours && (
          <>
            <dt className="subhead-lg lg:subhead-sm">Hours</dt>
            <dd className="flex flex-col gap-1">
              <p className="body-lg lg:body-md">{dealer.hours.statusText}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                {grouped.map((group) => (
                  <div
                    className="body-lg lg:body-md col-span-2 grid grid-cols-subgrid"
                    key={group.label}
                  >
                    <dt className="body-lg lg:body-md">{group.label}</dt>
                    <dd className="body-lg lg:body-md">{group.hours}</dd>
                  </div>
                ))}
              </dl>
            </dd>
          </>
        )}
      </dl>

      {/* Gallery */}
      {(photos.length > 0 || mapUrl) && <DealerGallery mapThumbnailUrl={mapUrl} photos={photos} />}
    </>
  );
}

// ─── Loading & Error States ───────────────────────────────────────────────────

function DealerInfoSkeleton() {
  return (
    <div className="mt-16 flex flex-col gap-6" data-testid="dealer-info-loading">
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-4 flex flex-col gap-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-4 h-52 w-full animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function DealerInfoError() {
  return (
    <div
      className="mt-16 flex flex-col items-center gap-4 py-12 text-center"
      data-testid="dealer-info-error"
    >
      <p className="body-lg text-text-secondary">
        Unable to load dealer information. Please try again later.
      </p>
    </div>
  );
}
