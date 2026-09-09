"use client";

import { useState } from "react";
import { PurchaseMethodContent } from "~/features/origination";
import { submitPurchaseMethodAction } from "~/features/origination/actions/submit-purchase-method.action";
import {
  DEMO_ORIGINATION_ID,
  PURCHASE_METHOD_HEADING,
} from "~/features/origination/bff/__fixtures__/purchase-method.fixture";
import type { PurchaseMethod } from "~/features/origination/bff/contracts/purchase-method-request.schema";

/**
 * Demo owner for the purchase-method step.
 *
 * The content component is presentational and only reports the selection via
 * `onSelect`. Here — standing in for the future XState panel — we own the
 * submission with a simple in-flight guard so rapid clicks don't fire multiple
 * requests. Kept intentionally minimal; this tab is temporary.
 */
export function PurchaseMethodTab() {
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (purchaseMethod: PurchaseMethod) => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    await submitPurchaseMethodAction(DEMO_ORIGINATION_ID, { purchaseMethod });
    setIsPending(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{PURCHASE_METHOD_HEADING}</h2>
        </div>
      </div>

      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="flex flex-col gap-4 rounded-lg border-2 border-surface-muted border-dashed p-6">
        <PurchaseMethodContent onSelect={handleSelect} />
      </div>
    </div>
  );
}
