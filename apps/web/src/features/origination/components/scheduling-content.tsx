"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@ucmp/ui";
import { IconCaretLeft, IconCaretRight } from "@ucmp/ui/icons";
import { useController, useForm } from "react-hook-form";
import type { SchedulingDay, SchedulingTimeSlot } from "../bff/__fixtures__/scheduling.fixture";
import {
  type SchedulingRequest,
  schedulingRequestSchema,
} from "../bff/contracts/scheduling-request.schema";

// Integration note: there is no Continue button on this screen — selecting a
// time slot sets the form value, and XState advances the flow once it is wired.
interface SchedulingContentProps {
  days: SchedulingDay[];
  initialData?: Partial<SchedulingRequest>;
}

export const SCHEDULING_TITLE = "You're all set.";
export const SCHEDULING_DESCRIPTION =
  "Choose a time to come to the dealership to complete your paperwork and pick up your car.";

// Formats an ISO date (YYYY-MM-DD) as e.g. "August 21, 2026".
function formatDateHeading(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year as number, (month as number) - 1, day as number);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SchedulingContent({ days, initialData }: SchedulingContentProps) {
  const { control } = useForm<SchedulingRequest>({
    resolver: standardSchemaResolver(schedulingRequestSchema),
    defaultValues: {
      date: initialData?.date ?? days[0]?.date ?? "",
      time: initialData?.time ?? "",
    },
    mode: "onChange",
  });

  const { field: dateField } = useController({ control, name: "date" });
  const { field: timeField } = useController({ control, name: "time" });

  const dayIndex = Math.max(
    0,
    days.findIndex((day) => day.date === dateField.value)
  );
  const currentDay = days[dayIndex];
  const canGoPrevious = dayIndex > 0;
  const canGoNext = dayIndex < days.length - 1;

  // No bookable days available — nothing to render.
  if (!currentDay) {
    return null;
  }

  function goToDay(nextIndex: number) {
    const nextDay = days[nextIndex];
    if (!nextDay) {
      return;
    }
    dateField.onChange(nextDay.date);
    timeField.onChange("");
  }

  function handleSelectSlot(slot: SchedulingTimeSlot) {
    if (!slot.available) {
      return;
    }
    timeField.onChange(slot.time);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Day selector */}
      <div className="flex items-center justify-between">
        <span className="subhead-lg text-text-primary">{currentDay.label}</span>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous day"
            disabled={!canGoPrevious}
            onClick={() => goToDay(dayIndex - 1)}
            size="icon-sm"
            variant="tertiary"
          >
            <IconCaretLeft />
          </Button>
          <Button
            aria-label="Next day"
            disabled={!canGoNext}
            onClick={() => goToDay(dayIndex + 1)}
            size="icon-sm"
            variant="tertiary"
          >
            <IconCaretRight />
          </Button>
        </div>
      </div>

      <p className="body-sm text-text-secondary">{formatDateHeading(currentDay.date)}</p>

      {/* Time slots — selecting one sets the form value; XState advances the flow. */}
      <div className="flex flex-col gap-2">
        {currentDay.timeSlots.map((slot) => (
          <Button
            className="subhead-lg h-18 justify-center rounded-2xl"
            disabled={!slot.available}
            fullWidth
            key={slot.time}
            onClick={() => handleSelectSlot(slot)}
            size="lg"
            variant="secondary"
          >
            {slot.time}
          </Button>
        ))}
      </div>
    </div>
  );
}
