"use client";

import { Button } from "@ucmp/ui";
import { IconArrowRight, IconShare } from "@ucmp/ui/icons";

type AppointmentCtaType = "manage" | "book" | "search" | "share";

interface AppointmentCtaProps {
  type: AppointmentCtaType;
}

/**
 * Appointment interactive elements — "use client".
 *
 * - "share": icon button (top-right of card) — stub, no handler
 * - "manage": "Manage your appointment →" text button (12px semibold, -4% tracking)
 * - "book": full-width "Book appointment" button (primary variant, dark surface — white bg, black text)
 *
 * All are stubs until navigation targets are confirmed.
 */
export function AppointmentCta({ type }: AppointmentCtaProps) {
  if (type === "share") {
    return (
      <Button aria-label="Share appointment" size="icon" surface="dark" variant="text">
        <IconShare className="size-6" />
      </Button>
    );
  }

  if (type === "book") {
    return (
      <Button fullWidth size="sm" surface="dark" variant="primary">
        Book appointment
      </Button>
    );
  }

  if (type === "search") {
    return (
      <Button fullWidth size="sm" surface="dark" variant="primary">
        Search similar to this
      </Button>
    );
  }

  // type === "manage"
  return (
    <Button
      className="w-fit whitespace-nowrap"
      surface="dark"
      trailingIcon={IconArrowRight}
      variant="text"
    >
      Manage your appointment
    </Button>
  );
}
