"use client";

import type { Vehicle } from "@shared/components/inventory-card";
import { lazy, Suspense } from "react";
import { ContinueShoppingSkeleton } from "./continue-shopping-skeleton";

const ContinueShoppingConnected = lazy(() =>
  import("./continue-shopping-connected").then((m) => ({ default: m.ContinueShoppingConnected }))
);

export interface ContinueShoppingClientProps {
  className?: string;
  newToday: Vehicle[];
  stickyHeader?: boolean;
}

export function ContinueShoppingClient({
  className,
  newToday,
  stickyHeader,
}: ContinueShoppingClientProps) {
  return (
    <Suspense fallback={<ContinueShoppingSkeleton className={className} />}>
      <ContinueShoppingConnected
        className={className}
        newToday={newToday}
        stickyHeader={stickyHeader}
      />
    </Suspense>
  );
}
