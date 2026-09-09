"use client";

import dynamic from "next/dynamic";
import type { RecordVehicleViewProps } from "./record-vehicle-view";

/**
 * Client boundary for RecordVehicleView.
 *
 * The underlying component reads the TanStack DB browsing-history collection
 * via `useLiveQuery`, which calls `useSyncExternalStore` without a server
 * snapshot — so it must be loaded with `ssr: false` (only valid inside a
 * Client Component). Since the component renders nothing visible, no loading
 * fallback is needed.
 */
const RecordVehicleView = dynamic(
  () => import("./record-vehicle-view").then((m) => m.RecordVehicleView),
  { ssr: false }
);

export function RecordVehicleViewClient({ vehicle }: RecordVehicleViewProps) {
  return <RecordVehicleView vehicle={vehicle} />;
}
