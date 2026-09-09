import { z } from "zod";
import { originationStepEnum, originationStepStatusEnum } from "./origination-model";

// Step vocabulary is owned by the canonical model; re-exported here so existing
// importers of this module keep working.
export {
  type OriginationStep,
  type OriginationStepStatus,
  originationStepEnum,
  originationStepStatusEnum,
} from "./origination-model";

/**
 * Validated request for PATCH origination — sent on every state transition.
 *
 * Intentionally carries NO step payload/PII: sensitive data (phone, SSN, DOB,
 * income) flows through each step's own dedicated endpoint. This PATCH only
 * advances the flow's recorded position, so it is safe to call frequently and
 * never places PII in a URL or cache key.
 */
export const patchOriginationRequestSchema = z.object({
  originationId: z.uuid(),
  step: originationStepEnum,
  status: originationStepStatusEnum.default("completed"),
});

export type PatchOriginationRequest = z.infer<typeof patchOriginationRequestSchema>;
