import { z } from "zod";

// ---------------------------------------------------------------------------
// Base Agent Upstream Wire-Format Schemas
//
// Built on top of @ucmp/sdk-search-api v2 types using Pick/Omit to extend
// them for base/agent additions (beat, message, appliedFilters, etc.). Uses
// z.looseObject() for passthrough objects the BFF does not validate deeply.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Primitives — extend SDK types
// ---------------------------------------------------------------------------

/** Extends SDK Filter with the same shape — key + value/values/min/max. */
export const BaseFilterSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  values: z.array(z.union([z.string(), z.number()])).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export type BaseFilter = z.infer<typeof BaseFilterSchema>;

/** Extends SDK Location with radiusMiles (base/agent addition). */
export const BaseLocationSchema = z.object({
  zipCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMiles: z.number().optional(),
});
export type BaseLocation = z.infer<typeof BaseLocationSchema>;
// BaseLocation is Pick<SdkLocation, 'zipCode'|'latitude'|'longitude'> & { radiusMiles?: number }

/** Extends SDK NextSearchPlan with responseMode + explorationAxes (base/agent additions). */
export const BaseNextSearchPlanSchema = z.object({
  // Loosened from z.string().uuid() — upstream may send non-UUID searchId values
  searchId: z.string(),
  filters: z.array(BaseFilterSchema).optional().default([]),
  location: BaseLocationSchema.optional(),
  responseMode: z.string().optional(),
  explorationAxes: z.array(z.string()).optional(),
});
export type BaseNextSearchPlan = z.infer<typeof BaseNextSearchPlanSchema>;
// Structurally extends SdkNextSearchPlan with optional base/agent fields

/** Matches SDK AttributeOption exactly. */
export const BaseAttributeOptionSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type BaseAttributeOption = z.infer<typeof BaseAttributeOptionSchema>;

/** Matches SDK Attribute exactly. */
export const BaseAttributeSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  value: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  options: z.array(BaseAttributeOptionSchema).optional(),
});
export type BaseAttribute = z.infer<typeof BaseAttributeSchema>;

export const BaseLocationOverrideSchema = z.object({
  source: z.string(),
  status: z.string(),
  active: z.boolean(),
  candidates: z.array(z.unknown()),
});
export type BaseLocationOverride = z.infer<typeof BaseLocationOverrideSchema>;

export const BaseSmartFilterSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  // Loosened from z.enum(["Enum", "Range"]) — upstream may add new filter types.
  // The mapper uses runtime string comparison (f.type === "Range") so this is safe.
  type: z.string(),
  options: z
    .array(
      z.object({
        // Loosened from z.string() — upstream may send numeric values (e.g.
        value: z.union([z.string(), z.number()]).transform(String),
        label: z.string().optional(),
        count: z.number(),
      })
    )
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export type BaseSmartFilter = z.infer<typeof BaseSmartFilterSchema>;

// ---------------------------------------------------------------------------
// Card Item Schemas
//
// Each card uses z.looseObject() for its data payload where the BFF only
// reads a subset of fields — unknown properties pass through untouched.
// ---------------------------------------------------------------------------

export const BaseOptionCardItemSchema = z.object({
  id: z.string(),
  cardType: z.literal("option"),
  nextSearchPlan: BaseNextSearchPlanSchema,
  data: z.looseObject({
    title: z.string(),
    subtitle: z.string().optional(),
    theme: z.string().optional(),
    availableCount: z.number().optional(),
    attributes: z.array(BaseAttributeSchema).optional(),
    advisoryNote: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
});
export type BaseOptionCardItem = z.infer<typeof BaseOptionCardItemSchema>;

export const BaseConceptCardItemSchema = z.object({
  id: z.string(),
  cardType: z.literal("concept"),
  nextSearchPlan: BaseNextSearchPlanSchema,
  data: z.looseObject({
    title: z.string(),
    subtitle: z.string().optional(),
    theme: z.string().optional(),
    availableCount: z.number().optional(),
    conceptId: z.string().optional(),
    advisoryNote: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    attributes: z.array(BaseAttributeSchema).optional(),
  }),
});
export type BaseConceptCardItem = z.infer<typeof BaseConceptCardItemSchema>;

export const BaseInventoryCardItemSchema = z.object({
  id: z.string(),
  cardType: z.literal("inventory"),
  nextSearchPlan: BaseNextSearchPlanSchema,
  data: z.looseObject({
    title: z.string(),
    availableCount: z.number().optional(),
    vin: z.string().optional(),
    vehicleInfo: z.looseObject({}).optional(),
    pricing: z.looseObject({}).optional(),
    media: z.looseObject({}).optional(),
    status: z.looseObject({}).optional(),
    dealerInfo: z.looseObject({}).optional(),
    computed: z.looseObject({}).optional(),
  }),
});
export type BaseInventoryCardItem = z.infer<typeof BaseInventoryCardItemSchema>;

export const BaseComparisonCardItemSchema = z.object({
  id: z.string(),
  cardType: z.literal("comparison"),
  nextSearchPlan: BaseNextSearchPlanSchema,
  data: z.looseObject({
    title: z.string(),
    subtitle: z.string().optional(),
    availableCount: z.number().optional(),
    vin: z.string().optional(),
    advisoryNote: z.string().optional(),
    attributes: z.array(BaseAttributeSchema).optional(),
  }),
});
export type BaseComparisonCardItem = z.infer<typeof BaseComparisonCardItemSchema>;

export const BaseCardItemSchema = z.discriminatedUnion("cardType", [
  BaseOptionCardItemSchema,
  BaseConceptCardItemSchema,
  BaseInventoryCardItemSchema,
  BaseComparisonCardItemSchema,
]);
export type BaseCardItem = z.infer<typeof BaseCardItemSchema>;

// ---------------------------------------------------------------------------
// Cards Container
// ---------------------------------------------------------------------------

export const BaseCardsContainerSchema = z.object({
  // Loosened from z.enum([...]) — upstream may add new response modes.
  // The mapper reads this as a plain string so widening the type is safe.
  responseMode: z.string(),
  summary: z.string(),
  totalCount: z.number(),
  layoutHint: z.string().optional(),
  sectionTitle: z.string().optional(),
  optionLevel: z.string().optional(),
  nextSearchPlan: BaseNextSearchPlanSchema.optional(),
  // Each item is validated individually — unknown cardType values are skipped
  // by the mapper rather than failing the whole payload.
  items: z.array(z.unknown()),
});
export type BaseCardsContainer = z.infer<typeof BaseCardsContainerSchema>;

// ---------------------------------------------------------------------------
// Complete Payload
// ---------------------------------------------------------------------------

/**
 * Base Complete payload — uses z.looseObject() so extra upstream fields
 * (e.g. `filters`, `response`) pass through without failing validation.
 * The normalizer lifts `response.cards` → `cards` before this runs, but
 * other opaque fields may arrive at the payload root.
 */
export const BaseCompletePayloadSchema = z.looseObject({
  // Loosened from z.string().uuid() — upstream may send non-UUID searchId values
  searchId: z.string(),
  // Loosened from z.enum(["Exploration", "Inventory"]) — upstream may add new modes
  searchMode: z.string(),
  // Active/accumulated filter selection. v1 carries this (it emits no
  // smartFilters); v2/base agent rely on smartFilters instead. Optional either way.
  filters: z.array(BaseFilterSchema).optional(),
  smartFilters: z.array(BaseSmartFilterSchema).optional(),
  locationOverride: BaseLocationOverrideSchema.optional(),
  effectiveLocation: BaseLocationSchema.optional(),
  cards: BaseCardsContainerSchema,
});
export type BaseCompletePayload = z.infer<typeof BaseCompletePayloadSchema>;

// ---------------------------------------------------------------------------
// Event Schemas — extend SDK v2 event types with base/agent additions
// ---------------------------------------------------------------------------

/**
 * Base StatusEvent — SDK StatusEvent + beat, message, appliedFilters, searchCriteria.
 * SDK type: Pick<SdkStatusEvent, 'type' | 'searchId' | 'stage'> & base/agent extensions
 */
export const BaseStatusEventSchema = z.object({
  type: z.literal("Status"),
  searchId: z.string(),
  stage: z.string(),
  beat: z.string().optional(),
  message: z.string().optional(),
  appliedFilters: z.array(BaseFilterSchema).optional(),
  searchCriteria: z.array(z.string()).optional(),
});
export type BaseStatusEvent = z.infer<typeof BaseStatusEventSchema>;

/**
 * Base ToolCallEvent — SDK ToolCallEvent + beat, message.
 */
export const BaseToolCallEventSchema = z.object({
  type: z.literal("ToolCall"),
  toolName: z.string(),
  toolCallId: z.string(),
  beat: z.string().optional(),
  message: z.string().optional(),
});
export type BaseToolCallEvent = z.infer<typeof BaseToolCallEventSchema>;

/**
 * Base ToolResultEvent — SDK ToolResultEvent + beat, totalCount, message.
 * Omits SDK's optional `error` field (not present in the base/agent wire format).
 */
export const BaseToolResultEventSchema = z.object({
  type: z.literal("ToolResult"),
  toolCallId: z.string(),
  // Loosened from z.enum(["Ok", "Error"]) — upstream may add new status values
  status: z.string(),
  beat: z.string().optional(),
  totalCount: z.number().optional(),
  message: z.string().optional(),
});
export type BaseToolResultEvent = z.infer<typeof BaseToolResultEventSchema>;

/** Base DeltaEvent — identical to SDK DeltaEvent. */
export const BaseDeltaEventSchema = z.object({
  type: z.literal("Delta"),
  text: z.string(),
});
export type BaseDeltaEvent = z.infer<typeof BaseDeltaEventSchema>;

/** Base CompleteEvent — uses BaseCompletePayload (richer than SDK AgentSearchResult). */
export const BaseCompleteEventSchema = z.object({
  type: z.literal("Complete"),
  payload: BaseCompletePayloadSchema,
});
export type BaseCompleteEvent = z.infer<typeof BaseCompleteEventSchema>;

/** _ExchangeMeta — debug-only frame, stripped by the BFF. Loose to accept any shape. */
export const BaseExchangeMetaEventSchema = z.looseObject({
  type: z.literal("_ExchangeMeta"),
});
export type BaseExchangeMetaEvent = z.infer<typeof BaseExchangeMetaEventSchema>;

/** Union of all base/agent SSE event types. */
export const BaseAgentEventSchema = z.union([
  BaseStatusEventSchema,
  BaseToolCallEventSchema,
  BaseToolResultEventSchema,
  BaseDeltaEventSchema,
  BaseCompleteEventSchema,
  BaseExchangeMetaEventSchema,
]);
export type BaseAgentEvent = z.infer<typeof BaseAgentEventSchema>;
