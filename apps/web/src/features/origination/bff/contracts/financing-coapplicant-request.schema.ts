import { z } from "zod";

/**
 * Validated request for the financing co-applicant step.
 *
 * Like the purchase-method step, this is a fixed choice between two known
 * options, so the schema is a closed enum rather than a validated free-form
 * input. It exists purely as the server action's input guard — Server Actions
 * are publicly callable and TS types are erased at runtime, so the selected
 * value is re-validated here regardless of the caller.
 */
export const financingCoApplicantRequestSchema = z.object({
  financingCoApplicant: z.enum(["own-financing", "co-applicant-financing"]),
});

export type FinancingCoApplicantRequest = z.infer<typeof financingCoApplicantRequestSchema>;
export type FinancingCoApplicant = FinancingCoApplicantRequest["financingCoApplicant"];
