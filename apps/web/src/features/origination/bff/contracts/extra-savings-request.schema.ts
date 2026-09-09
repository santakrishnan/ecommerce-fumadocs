import { z } from "zod";

/**
 * Validated request for the extra-savings step — a selection map keyed by
 * option `value`, matching the fixture options. The two checkboxes are
 * independent (multi-select), so each flag defaults to `false`; opting in to
 * nothing is a valid choice.
 */
export const extraSavingsRequestSchema = z.object({
  military: z.boolean({ message: "Invalid military/veteran status selection" }).default(false),
  graduate: z.boolean({ message: "Invalid graduate status selection" }).default(false),
});

export type ExtraSavingsRequest = z.infer<typeof extraSavingsRequestSchema>;
