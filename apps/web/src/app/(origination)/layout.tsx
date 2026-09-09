import type { ReactNode } from "react";

/**
 * Origination route group layout. Intentional pass-through: the flow is
 * chrome-less by design (no Header/Footer), and each screen owns its own surface
 * via OriginationLayout. Kept as the documented anchor for that decision and a
 * home for any future group-scoped concern.
 */
export default function OriginationGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
