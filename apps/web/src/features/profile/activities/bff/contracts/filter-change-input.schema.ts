import { dimensionIdEnum } from "@ucmp/sdk-visitor-profile-api";
import { z } from "zod";

/**
 * Local input contract for the SRP filter-change Server Actions.
 *
 * This is the *public, client-safe* shape callers send across the BFF boundary.
 * It is deliberately decoupled from the generated `@ucmp/sdk-visitor-profile-api`
 * `FilterEntry` type: search UI code produces this DTO, and the translation to
 * the SDK contract happens inside the activities use cases (see
 * `record-filter-changed.ts`). Keeping the SDK type behind this boundary stops
 * generated-contract churn from leaking into feature UI code.
 *
 * The schemas also harden the Server Actions themselves — those actions are
 * public endpoints callers can invoke outside the UI, so every field is
 * validated (uuid search id, discriminated filter shape, bounded sizes) before
 * any identity resolution or upstream call happens.
 */

/** Upper bound on any single free-text filter value / smart-filter name. */
const MAX_VALUE_LENGTH = 200;
/** Upper bound on the number of values inside one MultiEnum filter entry. */
const MAX_MULTI_ENUM_VALUES = 100;
/** Upper bound on the size of a reported active-filter set. */
const MAX_FILTER_SET = 100;

/** Valid SDK dimension keys, sourced from the generated enum so the local */
/** contract stays in sync with the upstream dimension registry. */
const DIMENSION_KEYS = Object.values(dimensionIdEnum) as [string, ...string[]];

const dimensionKeySchema = z.enum(DIMENSION_KEYS);
const boundedString = z.string().min(1).max(MAX_VALUE_LENGTH);
const scalarValue = z.union([boundedString, z.number(), z.boolean()]);

const enumEntrySchema = z.object({
  key: dimensionKeySchema,
  filterType: z.literal("Enum"),
  value: scalarValue,
});

const multiEnumEntrySchema = z.object({
  key: dimensionKeySchema,
  filterType: z.literal("MultiEnum"),
  values: z
    .array(z.union([boundedString, z.number()]))
    .min(1)
    .max(MAX_MULTI_ENUM_VALUES),
});

const rangeEntrySchema = z.object({
  key: dimensionKeySchema,
  filterType: z.literal("Range"),
  min: z.number().optional(),
  max: z.number().optional(),
});

const booleanEntrySchema = z.object({
  key: dimensionKeySchema,
  filterType: z.literal("Boolean"),
  enabled: z.boolean(),
});

/**
 * A single filter the visitor added/removed, in local (non-SDK) form.
 *
 * Discriminated on `filterType`. Range entries must carry at least one bound —
 * an empty range is rejected so malformed payloads never reach the upstream.
 */
export const filterChangeEntrySchema = z
  .discriminatedUnion("filterType", [
    enumEntrySchema,
    multiEnumEntrySchema,
    rangeEntrySchema,
    booleanEntrySchema,
  ])
  .refine(
    (entry) => entry.filterType !== "Range" || entry.min !== undefined || entry.max !== undefined,
    { message: "Range filter entry must define at least one of min or max." }
  );

const searchIdSchema = z.uuid();
const filterSetSchema = z.array(filterChangeEntrySchema).max(MAX_FILTER_SET);

export const recordFilterAddedInputSchema = z.object({
  searchId: searchIdSchema,
  filter: filterChangeEntrySchema,
  filters: filterSetSchema.optional(),
});

export const recordFilterRemovedInputSchema = z.object({
  searchId: searchIdSchema,
  filter: filterChangeEntrySchema,
  filters: filterSetSchema.optional(),
});

export const recordSmartFilterRemovedInputSchema = z.object({
  searchId: searchIdSchema,
  name: boundedString,
  filters: z.array(filterChangeEntrySchema).min(1).max(MAX_FILTER_SET),
});

/** A single filter the visitor added/removed, in local (non-SDK) form. */
export type FilterChangeEntry = z.infer<typeof filterChangeEntrySchema>;
export type RecordFilterAddedInput = z.infer<typeof recordFilterAddedInputSchema>;
export type RecordFilterRemovedInput = z.infer<typeof recordFilterRemovedInputSchema>;
export type RecordSmartFilterRemovedInput = z.infer<typeof recordSmartFilterRemovedInputSchema>;
