"use client";

import type { ItemElement } from "~/features/origination/components/base/option-item";
import { OptionItemGroup } from "~/features/origination/components/base/option-item-group";
import {
  PURCHASE_METHOD_ITEMS,
  PURCHASE_METHOD_TRADE_IN_DESCRIPTION,
  PURCHASE_METHOD_TRADE_IN_TITLE,
} from "../bff/__fixtures__/purchase-method.fixture";
import type { PurchaseMethod } from "../bff/contracts/purchase-method-request.schema";

interface PurchaseMethodContentProps {
  /**
   * Called when the user picks a purchase method. Submission (and its pending /
   * error / retry handling) is owned by the parent — this component only reports
   * the selection, mirroring how DownPaymentContent leaves submission to the
   * owning panel/machine.
   */
  onSelect?: (purchaseMethod: PurchaseMethod) => void;
}

/**
 * Purchase Method Content — static content for the first originations screen.
 *
 * Composes the standalone element components directly instead of driving them
 * from a step payload. Copy and options live in
 * `bff/__fixtures__/purchase-method.fixture.ts`.
 *
 * Presentational only: it does not submit. Selecting an option calls `onSelect`
 * with the chosen `PurchaseMethod`; the parent decides what to do (submit,
 * advance, show errors). This keeps it consistent with DownPaymentContent and
 * avoids in-flight/failure state living in the content.
 */
export function PurchaseMethodContent({ onSelect }: PurchaseMethodContentProps) {
  const items: ItemElement[] = PURCHASE_METHOD_ITEMS.map((item) => ({
    ...item,
    onClick: () => onSelect?.(item.id),
  }));

  return (
    <>
      <OptionItemGroup items={items} />
      <p className="pt-12 font-bold lg:pt-14">{PURCHASE_METHOD_TRADE_IN_TITLE}</p>
      <p>{PURCHASE_METHOD_TRADE_IN_DESCRIPTION}</p>
    </>
  );
}
