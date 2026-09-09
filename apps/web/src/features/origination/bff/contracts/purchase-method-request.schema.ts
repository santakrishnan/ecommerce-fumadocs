import { z } from "zod";

/**
 * Validated request for the purchase-method step.
 *
 * Unlike free-form steps (e.g. down-payment), this step is a fixed choice
 * between two known options, so the schema is a closed enum rather than a
 * validated numeric/text input. It exists purely as the server action's input
 * guard — Server Actions are publicly callable and TS types are erased at
 * runtime, so the selected value is re-validated here regardless of the caller.
 */
export const purchaseMethodRequestSchema = z.object({
  purchaseMethod: z.enum(["finance", "cash"]),
});

export type PurchaseMethodRequest = z.infer<typeof purchaseMethodRequestSchema>;
export type PurchaseMethod = PurchaseMethodRequest["purchaseMethod"];
