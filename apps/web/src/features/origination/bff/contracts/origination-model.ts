import { z } from "zod";

/**
 * Canonical origination data model — the single source of truth for the whole
 * flow. Every endpoint and use-case reads/returns the shapes defined here so
 * the step vocabulary and application state never diverge across the feature.
 *
 * PII policy: this model is intentionally PII-free. Raw sensitive inputs
 * (phone, SSN, DOB, income) flow through each step's own dedicated endpoint and
 * are validated server-side, then dropped. Only derived, non-sensitive state
 * (a step's status + timestamp) is carried in the unified application model.
 */

/**
 * The discrete steps of the origination flow. Each screen renders as its own
 * route (no shared client state machine); the frontend PATCHes the same BFF
 * endpoint on every transition to record progress server-side.
 */
export const originationStepEnum = z.enum([
  "purchase-method",
  "own-or-coapplicant-financing",
  "phone-verification",
  "otp-verification",
  "identity",
  "trade-in",
  "down-payment",
  "income",
  "entry",
  "credit-check",
  "offers",
  "scheduling",
  "extra-savings",
  "review",
]);

export type OriginationStep = z.infer<typeof originationStepEnum>;

/** Per-step transition outcome the client reports on a PATCH. */
export const originationStepStatusEnum = z.enum(["started", "completed", "skipped"]);

export type OriginationStepStatus = z.infer<typeof originationStepStatusEnum>;

/** Overall lifecycle state of an origination application. */
export const originationStatusEnum = z.enum(["in-progress", "completed", "abandoned"]);

export type OriginationStatus = z.infer<typeof originationStatusEnum>;

/**
 * Uniform, PII-free state slot for a single step. Absence of a step key in the
 * application's `steps` map means "not yet reached".
 */
export const originationStepStateSchema = z.object({
  status: originationStepStatusEnum,
  updatedAt: z.iso.datetime(),
});

export type OriginationStepState = z.infer<typeof originationStepStateSchema>;

/**
 * The unified origination application state — returned across the whole flow
 * (currently on every PATCH; the future GET returns the same shape).
 *
 * `steps` is a partial record keyed by step, so only reached steps appear.
 * `currentStep` / `completedSteps` / `status` are derived roll-ups the UI can
 * read directly to render the progress bar and branch the flow.
 */
export const originationApplicationSchema = z.object({
  originationId: z.uuid(),
  status: originationStatusEnum,
  currentStep: originationStepEnum,
  completedSteps: z.array(originationStepEnum),
  steps: z.partialRecord(originationStepEnum, originationStepStateSchema),
  updatedAt: z.iso.datetime(),
});

export type OriginationApplication = z.infer<typeof originationApplicationSchema>;
