"use client";

import { Button } from "@ucmp/ui";
import { IconInfo } from "@ucmp/ui/icons";

interface PurchaseCardInfoTriggerProps {
  onInfoClick?: () => void;
}

/** Client island for the payment-info trigger in estimated state. */
export function PurchaseCardInfoTrigger({ onInfoClick }: PurchaseCardInfoTriggerProps) {
  return (
    <Button
      aria-label="Payment estimate details"
      className="inline-flex items-start border-transparent p-0 text-text-secondary shadow-none outline-none ring-0 hover:border-transparent hover:shadow-none hover:ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent"
      nativeButton
      onClick={onInfoClick}
      size="sm"
      variant="tertiary"
    >
      <IconInfo className="size-6 text-text-primary" />
    </Button>
  );
}
