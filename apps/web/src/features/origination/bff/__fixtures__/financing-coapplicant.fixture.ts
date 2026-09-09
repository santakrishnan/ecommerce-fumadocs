import type { ItemElement } from "../../components/base/option-item";
import type { FinancingCoApplicant } from "../contracts/financing-coapplicant-request.schema";

/**
 * Static content for the financing co-applicant step: the heading and the two
 * selectable options. Kept as a fixture so the copy and options live in one
 * place, separate from the rendering component.
 */

export const FINANCING_COAPPLICANT_HEADING = "Are you financing with a co-applicant?";

/**
 * Each item's `id` is a `FinancingCoApplicant` enum value — the value submitted
 * to `submitFinancingCoApplicantAction`. The `satisfies` clause keeps the ids
 * aligned with the schema so a typo is a compile error.
 */
export const FINANCING_COAPPLICANT_ITEMS = [
  {
    type: "item",
    id: "own-financing",
    title: "I am financing on my own",
  },
  {
    type: "item",
    id: "co-applicant-financing",
    title: "I have a co-applicant",
    description: "A well-qualified co-applicant may help you qualify for better financing options.",
  },
] satisfies (ItemElement & { id: FinancingCoApplicant })[];
