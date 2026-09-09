import { phoneVerificationRequestSchema } from "@features/origination/bff/contracts";
import { normalizePhone } from "@features/origination/lib/format-phone";
import { z } from "zod";

const phoneFormValueSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(phoneVerificationRequestSchema.shape.phone);

export const phoneFormSchema = z.object({
  phone: phoneFormValueSchema,
});

export type PhoneFormValues = z.infer<typeof phoneFormSchema>;
