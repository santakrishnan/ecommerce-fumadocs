import { z } from "zod";

export const nonTaxableIncomeSourceSchema = z.object({
  type: z.string().min(1, "Please select a source"),
  annualAmount: z.coerce
    .number({ message: "Please enter an amount" })
    .int("Amount must be a whole number")
    .nonnegative("Amount cannot be negative"),
});

export const incomeRequestSchema = z.object({
  annualGrossIncome: z.coerce
    .number({ message: "Please enter your annual gross income" })
    .int("Amount must be a whole number")
    .nonnegative("Amount cannot be negative"),
  currency: z.literal("USD").default("USD"),
  nonTaxableSources: z.array(nonTaxableIncomeSourceSchema).optional(),
});

export type NonTaxableIncomeSource = z.infer<typeof nonTaxableIncomeSourceSchema>;
export type IncomeRequest = z.infer<typeof incomeRequestSchema>;
