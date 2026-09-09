"use client";

import type { VdpCertificationModal } from "@features/vehicle-detail/bff";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
  DialogTrigger,
} from "@ucmp/ui";

import { IconAdd, IconCheckmark } from "@ucmp/ui/icons";
import { useState } from "react";
import { cn } from "utils";
import { withVdpViewTransition } from "../lib/vdp-view-transition";

export type WarrantyInfo = VdpCertificationModal;
export type WarrantyCoverageItem = WarrantyInfo["rows"][number];

interface WarrantyInfoModalProps {
  warranty: WarrantyInfo;
}

export function WarrantyInfoModal({ warranty }: WarrantyInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    withVdpViewTransition(() => setIsOpen(open));
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <div style={{ viewTransitionName: isOpen ? undefined : "vdp-warranty-modal" }}>
        <DialogTrigger
          render={
            <Button
              aria-label="More certification details"
              className="relative"
              size="icon-sm"
              surface="dark"
              variant="secondary"
            />
          }
        >
          <IconAdd className="size-4" />
        </DialogTrigger>
      </div>
      <DialogContent
        className="lg:pb-0"
        innerClassName="lg:px-10"
        style={{ viewTransitionName: isOpen ? "vdp-warranty-modal" : undefined }}
      >
        <DialogTopBar className="pt-5 pb-5 md:pt-6 md:pb-6" />
        <DialogHeader>
          <DialogTitle className="h1 md:h3 w-77.5">{warranty.title}</DialogTitle>
          <DialogDescription className="body-md w-full text-text-secondary">
            {warranty.description}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="scrollbar-none mt-10 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {warranty.rows.map((item) => (
              <li
                className={cn(
                  "mt-8 flex min-h-12.5 items-center border-divider border-b pb-8 last:border-b-0",
                  item.value.type === "check"
                    ? "gap-8 lg:justify-between lg:gap-0"
                    : "justify-between"
                )}
                key={item.label}
              >
                <span
                  className={cn(
                    "body-md text-left text-text-primary lg:w-74 lg:flex-none",
                    item.value.type === "check" ? "flex-1" : "w-1/2 shrink-0 md:w-auto md:flex-1"
                  )}
                >
                  {item.label}
                </span>
                {item.value.type === "check" ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <IconCheckmark aria-hidden="true" className="size-3 text-white" />
                  </span>
                ) : (
                  <span className="body-md w-1/2 shrink-0 text-right text-text-secondary md:w-auto md:max-w-62.5 lg:w-74 lg:max-w-none">
                    {item.value.text}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
