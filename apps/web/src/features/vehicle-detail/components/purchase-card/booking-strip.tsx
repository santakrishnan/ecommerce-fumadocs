"use client";

import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@ucmp/ui";
import { IconCaretLeft, IconCaretRight } from "@ucmp/ui/icons";

export interface BookingStripProps {
  /** Confirmation note shown below the slots (e.g. "You have a test drive at..."). */
  confirmationNote?: string;
  /** Day label displayed above the slots (e.g. "Today", "Tomorrow"). */
  dayLabel: string;
  /** Section heading (e.g. "Schedule a test drive"). */
  heading?: string;
  /** Callback when a time slot is selected. */
  onSlotSelect?: (slot: string) => void;
  /** Available time slots. */
  slots: string[];
}

/**
 * Booking Strip — test drive scheduling carousel for the Purchase Card.
 *
 * Renders:
 * - "Schedule a test drive" heading with carousel navigation arrows
 * - Day label (e.g. "Today")
 * - Horizontally-scrollable time slot buttons (secondary, small)
 * - Optional confirmation note
 *
 * Data sourced from `dealer.extended.testDrive` in the BFF response.
 */
export function BookingStrip({
  confirmationNote,
  dayLabel,
  heading = "Schedule a test drive",
  onSlotSelect,
  slots,
}: BookingStripProps) {
  function handleSelect(slot: string) {
    onSlotSelect?.(slot);
  }

  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 pt-8" data-testid="booking-strip">
      {/* Header row: title + navigation arrows */}
      <Carousel disableArrows>
        <div className="flex items-center justify-between">
          <h3 className="subhead-lg text-text-primary">{heading}</h3>
          <div className="hidden items-center lg:flex">
            <CarouselPrevious
              aria-label="Previous time slots"
              className="static flex size-5 translate-x-0 translate-y-0 border-0 bg-transparent p-0 text-text-primary shadow-none disabled:pointer-events-none disabled:bg-transparent lg:opacity-100"
            >
              <IconCaretLeft className="size-5" />
            </CarouselPrevious>
            <CarouselNext
              aria-label="Next time slots"
              className="static flex size-5 translate-x-0 translate-y-0 border-0 bg-transparent p-0 text-text-primary shadow-none disabled:pointer-events-none disabled:bg-transparent lg:opacity-100"
            >
              <IconCaretRight className="size-5" />
            </CarouselNext>
          </div>
        </div>

        {/* Day label */}
        <p className="body-lg mt-2 mb-4 text-text-primary">{dayLabel}</p>

        {/* Time slot buttons — bleed to card edges, pad first/last inline */}
        <div className="-mx-8">
          <CarouselContent className="gap-1 px-8">
            {slots.map((slot) => (
              <CarouselItem key={slot}>
                <Button
                  aria-label={`Book test drive at ${slot}`}
                  onClick={() => handleSelect(slot)}
                  size="sm"
                  variant="secondary"
                >
                  {slot}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>

      {/* Confirmation note */}
      {confirmationNote && <p className="body-sm mt-2 text-text-secondary">{confirmationNote}</p>}
    </div>
  );
}
