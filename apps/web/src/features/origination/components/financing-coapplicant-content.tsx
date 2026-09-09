"use client";

import type { ItemElement } from "~/features/origination/components/base/option-item";
import { OptionItemGroup } from "~/features/origination/components/base/option-item-group";
import { FINANCING_COAPPLICANT_ITEMS } from "../bff/__fixtures__/financing-coapplicant.fixture";
import type { FinancingCoApplicant } from "../bff/contracts/financing-coapplicant-request.schema";

interface FinancingCoApplicantContentProps {
  /**
   * Called when the user picks a financing co-applicant option. Submission (and
   * its pending / error / retry handling) is owned by the parent — this
   * component only reports the selection, mirroring how DownPaymentContent and
   * PurchaseMethodContent leave submission to the owning panel/machine.
   */
  onSelect?: (financingCoApplicant: FinancingCoApplicant) => void;
}

/**
 * Financing Co-Applicant Content — static content for the co-applicant screen.
 *
 * Composes the standalone element components directly instead of driving them
 * from a step payload. Copy and options live in
 * `bff/__fixtures__/financing-coapplicant.fixture.ts`.
 *
 * Presentational only: it does not submit. Selecting an option calls `onSelect`
 * with the chosen `FinancingCoApplicant`; the parent decides what to do (submit,
 * advance, show errors). This keeps it consistent with the other step contents
 * and avoids in-flight/failure state living in the content.
 */
export function FinancingCoApplicantContent({ onSelect }: FinancingCoApplicantContentProps) {
  const items: ItemElement[] = FINANCING_COAPPLICANT_ITEMS.map((item) => ({
    ...item,
    onClick: () => onSelect?.(item.id),
  }));

  return <OptionItemGroup items={items} />;
}
