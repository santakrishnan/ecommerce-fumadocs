import type { ItemElement } from "../../components/base/option-item";
import type { PurchaseMethod } from "../contracts/purchase-method-request.schema";

/**
 * Static content for the purchase-method step: the heading, the selectable
 * method options, and the trade-in prompt paragraphs. Kept as a fixture so the
 * copy and options live in one place, separate from the rendering component.
 */

/**
 * Placeholder origination id for the demo. In the real flow this comes from the
 * URL params (or wherever the created application id is threaded through), not
 * from the fixture.
 */
export const DEMO_ORIGINATION_ID = "22222222-2222-4222-8222-222222222222";

export const PURCHASE_METHOD_HEADING = "How would you like to purchase this vehicle?";

export const PURCHASE_METHOD_TRADE_IN_TITLE = "Looking to trade in your car?";
export const PURCHASE_METHOD_TRADE_IN_DESCRIPTION =
  "We'll ask for those details before you finish.";

/**
 * Each item's `id` is a `PurchaseMethod` enum value — the value submitted to
 * `submitPurchaseMethodAction`. The `satisfies` clause keeps the ids aligned
 * with the schema so a typo is a compile error.
 */
export const PURCHASE_METHOD_ITEMS = [
  {
    type: "item",
    id: "finance",
    title: "Financing",
    description: "Pay over time with monthly payments.",
  },
  {
    type: "item",
    id: "cash",
    title: "Cash",
    description: "Pay the full amount today.",
  },
] satisfies (ItemElement & { id: PurchaseMethod })[];
