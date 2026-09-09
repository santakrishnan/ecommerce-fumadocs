import type { DealerOfferData } from "@features/landing/types";
import type { ComparisonCardContentProps } from "@shared/components/comparison-card";
import type { EditorialCardData } from "@shared/components/editorial-card";
import type { Vehicle } from "@shared/components/inventory-card";
import type { ModelCardContentProps } from "@shared/components/model-card";
import type { SpecCardContentProps } from "@shared/components/spec-card";
import type { TrimVehicle } from "@shared/components/trim-card";
import type { NextSearchPlan } from "../lib/agent-search-turns-collection";

/**
 * Discriminated union of all card types that can appear in search results.
 *
 * Every item may carry a `nextSearchPlan`. When present, the card renders as
 * a button that submits the plan as the next turn. When absent, the card
 * renders as a link (inventory → VDP, editorial → href) or static display.
 *
 * To add a new card type:
 * 1. Add a new member to this union (one line)
 * 2. Add a renderer entry in `lib/render-result-card.tsx`
 * 3. Return the new type from the hook/API
 */
export type SearchResultItem =
  | {
      type: "model";
      id: string;
      data: ModelCardContentProps;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "inventory";
      id: string;
      data: Vehicle;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "dealer-offer";
      id: string;
      data: DealerOfferData;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "editorial";
      id: string;
      data: EditorialCardData;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "comparison";
      id: string;
      data: ComparisonCardContentProps;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "trim";
      id: string;
      data: TrimVehicle;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "spec";
      id: string;
      data: SpecCardContentProps;
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "pill";
      id: string;
      data: { title: string };
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    }
  | {
      type: "nudge";
      id: string;
      data: { title: string; subtitle?: string };
      nextSearchPlan?: NextSearchPlan;
      sourceHint?: ClickSourceHint;
    };

/**
 * Hint from the BFF card mapper about what turn source a click should produce.
 * Base-mapped cards set this from their `type` discriminator. Legacy V2 raw
 * cards leave it undefined.
 */
export type ClickSourceHint = "pill" | "card";
