import { transformV1CompletePayload } from "../mappers/agent-v1-card.mapper";
import { createAgentEventTransformer } from "./agent-events-transformer";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * v1-only normalizer applied before the shared transformer.
 *
 * 1. Backfills beat/message on Status events that lack them, using the
 *    `stage` value as both — so the shopper-facing checklist renders
 *    even though v1 doesn't send beat/message natively.
 *
 * 2. Backfills label/count on v1 smart-filter options that omit them,
 *    so the non-compliant v1 shape conforms to the shared schema.
 */
function normalizeV1Event(event: unknown): unknown {
  if (!isRecord(event)) {
    return event;
  }

  // Beat backfill: Status events without a beat get beat=stage, message=stage.
  const withBeatFilled: Record<string, unknown> =
    event.type === "Status" && !event.beat && typeof event.stage === "string"
      ? { ...event, beat: event.stage, message: event.stage }
      : event;

  // Smart-filter backfill (Complete events only).
  if (withBeatFilled.type !== "Complete") {
    return withBeatFilled;
  }
  const payload = withBeatFilled.payload;
  if (!(isRecord(payload) && Array.isArray(payload.smartFilters))) {
    return withBeatFilled;
  }

  const smartFilters = payload.smartFilters.map((filter) => {
    if (!(isRecord(filter) && Array.isArray(filter.options))) {
      return filter;
    }
    const options = filter.options.map((option) => {
      if (!isRecord(option)) {
        return option;
      }
      return {
        ...option,
        label: option.label ?? String(option.value ?? ""),
        count: typeof option.count === "number" ? option.count : 0,
      };
    });
    return { ...filter, options };
  });

  return { ...withBeatFilled, payload: { ...payload, smartFilters } };
}

const transformV1Events = createAgentEventTransformer(
  transformV1CompletePayload,
  "[agent-v1-transformer]",
  normalizeV1Event
);

export { transformV1Events };
