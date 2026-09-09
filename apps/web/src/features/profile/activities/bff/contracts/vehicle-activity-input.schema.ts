import type {
  VehicleBookmarkedActivity,
  VehicleClickedActivity,
  VehicleRef,
  VehicleUnbookmarkedActivity,
  VehicleViewedActivity,
} from "@ucmp/sdk-visitor-profile-api";
import { pageSourceEnum } from "@ucmp/sdk-visitor-profile-api";
import { VIN_PATTERN } from "utils";
import { z } from "zod";

/**
 * Runtime input contract for the vehicle activity Server Action.
 *
 * Each schema's output type is anchored to the corresponding SDK activity type
 * with `visitorId`, `sessionId`, and `timestamp` omitted — those are
 * server-only fields filled in by the use-case after identity resolution.
 *
 * The SDK ships TypeScript types only (no Zod schemas), so `z.object` provides
 * runtime validation. `z.custom` is used for fields whose SDK types are string
 * unions or object types that `z.enum` / `z.object` alone would widen to
 * `string` or `object` rather than the correct literal/branded type. The
 * TypeScript `satisfies` operator on each schema member verifies structural
 * assignability to the SDK type at compile time, so generated-contract changes
 * surface as type errors here rather than drifting silently.
 *
 * Invalid payloads resolve silently (no throw) to preserve the fire-and-forget
 * contract. Server Actions are reachable outside the UI, so this validation
 * runs before any identity resolution or upstream call.
 */

/** Server-only fields stripped from all anonymous event schemas. */
type ServerFields = "visitorId" | "sessionId" | "timestamp";

const PAGE_SOURCE_VALUES = Object.values(pageSourceEnum);

/**
 * Runtime validator for PageSource.
 *
 * `z.enum(Object.values(...))` widens to `string`; `z.custom` preserves the
 * `PageSource` literal union so schema output is assignable to SDK types.
 */
const pageSourceSchema = z.custom<(typeof pageSourceEnum)[keyof typeof pageSourceEnum]>(
  (val) => typeof val === "string" && PAGE_SOURCE_VALUES.includes(val as never)
);

/**
 * Runtime validator for VehicleRef.
 *
 * Validates the two required fields (vin, title) at the boundary; optional
 * fields are passed through — the SDK type and the upstream service own their
 * validation. Anchored to `VehicleRef` so the inferred schema type stays in
 * sync with the SDK contract.
 */
const vehicleRefSchema = z.custom<VehicleRef>(
  (val) =>
    typeof val === "object" &&
    val !== null &&
    typeof (val as VehicleRef).vin === "string" &&
    VIN_PATTERN.test((val as VehicleRef).vin) &&
    typeof (val as VehicleRef).title === "string" &&
    (val as VehicleRef).title.length > 0
);

export const vehicleClickedInputSchema = z.object({
  type: z.literal("visitorActivity.vehicle.clicked"),
  vehicle: vehicleRefSchema,
  source: pageSourceSchema,
  position: z.number().int().min(0).optional(),
  searchId: z.string().uuid().optional(),
}) satisfies z.ZodType<Omit<VehicleClickedActivity, ServerFields>>;

export const vehicleViewedInputSchema = z.object({
  type: z.literal("visitorActivity.vehicle.viewed"),
  vehicle: vehicleRefSchema,
  source: pageSourceSchema.optional(),
  searchId: z.string().uuid().optional(),
}) satisfies z.ZodType<Omit<VehicleViewedActivity, ServerFields>>;

export const vehicleBookmarkedInputSchema = z.object({
  type: z.literal("visitorActivity.vehicle.bookmarked"),
  vehicle: vehicleRefSchema,
  source: pageSourceSchema.optional(),
}) satisfies z.ZodType<Omit<VehicleBookmarkedActivity, ServerFields>>;

export const vehicleUnbookmarkedInputSchema = z.object({
  type: z.literal("visitorActivity.vehicle.unbookmarked"),
  vehicle: vehicleRefSchema,
}) satisfies z.ZodType<Omit<VehicleUnbookmarkedActivity, ServerFields>>;

/**
 * Discriminated union of all four anonymous vehicle activity inputs.
 * Validated at the Server Action boundary before the use-case runs.
 */
export const anonymousVehicleActivitySchema = z.discriminatedUnion("type", [
  vehicleClickedInputSchema,
  vehicleViewedInputSchema,
  vehicleBookmarkedInputSchema,
  vehicleUnbookmarkedInputSchema,
]);

export type AnonymousVehicleActivityInput = z.infer<typeof anonymousVehicleActivitySchema>;
