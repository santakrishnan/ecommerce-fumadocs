"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button, Popover, PopoverBackdrop, PopoverContent, PopoverTrigger } from "@ucmp/ui";
import { IconLocation } from "@ucmp/ui/icons";
import { useState, useSyncExternalStore } from "react";
import { LOCATION_QUERY_KEY } from "../data/constants";
import { LocationPillSkeleton } from "./location-pill-skeleton";
import { ZipCodePopoverContent } from "./zip-code-popover";

export interface LocationPillProps {
  /**
   * ZIP resolved server-side from the cookie. Absent on a first visit —
   * the pill renders a skeleton until the client location context resolves
   * (fingerprint enrichment seeds the `["location"]` slice).
   */
  zipCode?: string;
}

/**
 * Interactive location pill shell.
 *
 * Displays a live view of the shared `["location"]` React Query slice — the
 * client-side location context. Every writer flows through that slice
 * (fingerprint enrich seed, manual ZIP change, post-refresh rehydration), so
 * the pill updates the moment any of them resolves, without waiting for a
 * server round-trip. The server-resolved prop is the fallback when the slice
 * is empty, which keeps SSR and the first client render identical.
 *
 * With no value from either source, renders a same-sized skeleton a real
 * location always replaces it without layout shift.
 */
export function LocationPill({ zipCode }: LocationPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const displayZip = useSyncExternalStore(
    (onStoreChange) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          Array.isArray(event.query.queryKey) &&
          event.query.queryKey.length === 1 &&
          event.query.queryKey[0] === LOCATION_QUERY_KEY[0]
        ) {
          onStoreChange();
        }
      }),
    () =>
      queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY)?.zipCode || zipCode || null,
    () => zipCode || null
  );

  if (!displayZip) {
    return <LocationPillSkeleton />;
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label="Change location"
            className="h-14 min-w-26"
            leadingIcon={IconLocation}
            size="lg"
            variant="secondary"
          >
            {displayZip}
          </Button>
        }
      />
      {/* Dark modal backdrop — dismisses popover on click */}
      <PopoverBackdrop />
      {/* Negative offsets temporary added to match design, we need to find a better approach for this */}
      <PopoverContent
        align="start"
        alignOffset={-254}
        aria-label="Change your location"
        role="dialog"
        side="bottom"
        sideOffset={-56}
      >
        <ZipCodePopoverContent
          key={displayZip}
          onSuccess={() => setIsOpen(false)}
          zipCode={displayZip}
        />
      </PopoverContent>
    </Popover>
  );
}
