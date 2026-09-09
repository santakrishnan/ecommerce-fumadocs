import { READINESS_ITEMS, ReadinessItemCard, ReadinessStepScreen } from "@features/origination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Before you begin financing",
};

/**
 * /originations/readiness — pre-flow gate shown before the user enters the
 * origination steps. Pure informational: no async data, no Suspense needed.
 * Sync page export (PPR shell pattern).
 *
 * ReadinessItemCard is rendered here (server) and passed as children into the
 * ReadinessStepScreen client shell — keeping static card content out of the
 * client bundle entirely.
 */
export default function ReadinessPage() {
  return (
    <ReadinessStepScreen>
      <ReadinessItemCard items={READINESS_ITEMS} />
    </ReadinessStepScreen>
  );
}
