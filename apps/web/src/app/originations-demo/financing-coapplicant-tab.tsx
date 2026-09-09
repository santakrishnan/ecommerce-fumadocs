"use client";

import { useState } from "react";
import { FinancingCoApplicantContent } from "~/features/origination";
import { submitFinancingCoApplicantAction } from "~/features/origination/actions/submit-financing-coapplicant.action";
import { FINANCING_COAPPLICANT_HEADING } from "~/features/origination/bff/__fixtures__/financing-coapplicant.fixture";
import { DEMO_ORIGINATION_ID } from "~/features/origination/bff/__fixtures__/purchase-method.fixture";
import type { FinancingCoApplicant } from "~/features/origination/bff/contracts/financing-coapplicant-request.schema";

/**
 * Demo owner for the financing co-applicant step.
 *
 * The content component is presentational and only reports the selection via
 * `onSelect`. Here — standing in for the future XState panel — we own the
 * submission with a simple in-flight guard so rapid clicks don't fire multiple
 * requests. Kept intentionally minimal; this tab is temporary.
 */
export function FinancingCoApplicantTab() {
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (financingCoApplicant: FinancingCoApplicant) => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    await submitFinancingCoApplicantAction(DEMO_ORIGINATION_ID, { financingCoApplicant });
    setIsPending(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{FINANCING_COAPPLICANT_HEADING}</h2>
        </div>
      </div>

      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="flex flex-col gap-4 rounded-lg border-2 border-surface-muted border-dashed p-6">
        <FinancingCoApplicantContent onSelect={handleSelect} />
      </div>
    </div>
  );
}
