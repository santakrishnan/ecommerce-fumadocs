"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ContinueShoppingVdpSkeleton } from "./continue-shopping-vdp-skeleton";

/**
 * Client boundary for the VDP continue-shopping carousel.
 *
 * The connected carousel reads the TanStack DB recently-viewed collection via
 * `useLiveQuery`, which has no server snapshot — loaded with `ssr: false`
 * (only supported inside a Client Component). The skeleton reserves space in
 * the static shell while the IndexedDB read completes, reducing CLS.
 */
const ContinueShoppingVdpConnected = dynamic(
  () => import("./continue-shopping-vdp-connected").then((m) => m.ContinueShoppingVdpConnected),
  { ssr: false }
);

export interface ContinueShoppingVdpClientProps {
  /** Outer wrapper class. */
  className?: string;
  /** VIN of the currently viewed vehicle — excluded from the carousel. */
  excludeVin: string;
}

export function ContinueShoppingVdpClient({
  className,
  excludeVin,
}: ContinueShoppingVdpClientProps) {
  return (
    <Suspense fallback={<ContinueShoppingVdpSkeleton className={className} />}>
      <ContinueShoppingVdpConnected className={className} excludeVin={excludeVin} />
    </Suspense>
  );
}
