"use client";

import { Button } from "@ucmp/ui";
import { IconEllipsis } from "@ucmp/ui/icons";

/**
 * Trade-In Overflow Menu — "use client" island.
 *
 * Stub "..." button for edit/remove actions (TBD — separate ticket).
 * Follows the AppointmentCta pattern of a small client island within
 * a Server Component card.
 */
export function TradeInOverflowMenu() {
  return (
    <Button
      aria-label="More options"
      onClick={() => {
        // TODO: implement edit/remove actions (PEDXF-XXX)
      }}
      size="icon-sm"
      variant="text"
    >
      <IconEllipsis className="size-5" />
    </Button>
  );
}
