import { z } from "zod";

export const downPaymentRequestSchema = z.object({
  downPaymentAmount: z.coerce
    .number({ message: "Please enter a down payment amount" })
    .positive("Amount must be greater than $0"),
});

export type DownPaymentRequest = z.infer<typeof downPaymentRequestSchema>;
