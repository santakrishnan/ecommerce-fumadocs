import type { OriginationApplication } from "./origination-model";
import { originationApplicationSchema } from "./origination-model";

// Re-export the lifecycle enum from the canonical model for existing importers.
export { type OriginationStatus, originationStatusEnum } from "./origination-model";

/**
 * The PATCH origination response IS the unified application model — every
 * transition returns the full, canonical `OriginationApplication` so the client
 * reads one consistent shape across the whole flow.
 */
export const patchOriginationResponseSchema = originationApplicationSchema;

export type PatchOriginationResponse = OriginationApplication;
