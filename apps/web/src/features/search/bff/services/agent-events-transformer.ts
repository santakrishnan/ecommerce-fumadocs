import type {
  BaseAgentEvent,
  BaseCompleteEvent,
  BaseCompletePayload,
} from "../contracts/agent-upstream.schema";
import { BaseAgentEventSchema } from "../contracts/agent-upstream.schema";

type CompletePayloadTransformer = (
  payload: BaseCompletePayload,
  runtimeSessionId: string,
  visitorId: string | null
) => Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorEvent(code: string, message: string): Record<string, unknown> {
  return { type: "Error", error: { code, message } };
}

/** Forwards `beat`/`message` onto a base frame only when present on the source event. */
function withBeat(
  base: Record<string, unknown>,
  source: { beat?: string; message?: string }
): Record<string, unknown> {
  return {
    ...base,
    ...(source.beat ? { beat: source.beat } : {}),
    ...(source.message ? { message: source.message } : {}),
  };
}

/**
 * Lifts `payload.response.cards` to `payload.cards` on Complete events so the
 * v1/v2 wire shape parses against the shared base schema. Non-Complete events and
 * already-base-shaped payloads pass through untouched.
 */
export function normalizeCardsEnvelope(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }
  if (raw.type !== "Complete") {
    return raw;
  }
  const payload = raw.payload as Record<string, unknown> | undefined;
  if (!payload || "cards" in payload) {
    return raw;
  }
  const response = payload.response as Record<string, unknown> | undefined;
  const cards = response?.cards;
  if (!cards) {
    return raw;
  }
  const { response: _response, ...payloadRest } = payload;
  return { ...raw, payload: { ...payloadRest, cards } };
}

function stripDebugFromPlan(plan: unknown): unknown {
  if (!isRecord(plan)) {
    return plan;
  }
  const { debug: _debug, ...rest } = plan;
  return rest;
}

function stripDebugFromComplete(event: Record<string, unknown>): Record<string, unknown> {
  const payload = event.payload as Record<string, unknown> | undefined;
  const response = payload?.response as Record<string, unknown> | undefined;
  if (!(payload && response)) {
    return event;
  }

  const results = Array.isArray(response.results)
    ? response.results.map((card) => {
        if (!isRecord(card)) {
          return card;
        }
        return { ...card, nextSearchPlan: stripDebugFromPlan(card.nextSearchPlan) };
      })
    : response.results;

  return {
    ...event,
    payload: {
      ...payload,
      response: {
        ...response,
        results,
        nextSearchPlan: stripDebugFromPlan(response.nextSearchPlan),
      },
    },
  };
}

/** Simplified passthrough frames for non-Complete events. `undefined` = drop. */
function passthroughEvent(event: BaseAgentEvent): Record<string, unknown> | undefined {
  switch (event.type) {
    case "Status":
      return withBeat({ type: "Status", searchId: event.searchId, stage: event.stage }, event);
    case "ToolCall":
      return withBeat(
        { type: "ToolCall", toolName: event.toolName, toolCallId: event.toolCallId },
        event
      );
    case "ToolResult":
      return withBeat(
        { type: "ToolResult", toolCallId: event.toolCallId, status: event.status },
        event
      );
    case "Delta":
      return { type: "Delta", text: event.text };
    default:
      return;
  }
}

function transformCompleteEvent(
  event: BaseCompleteEvent,
  runtimeSessionId: string,
  visitorId: string | null,
  transformCompletePayload: CompletePayloadTransformer,
  logPrefix: string
): Record<string, unknown> {
  try {
    return stripDebugFromComplete(
      transformCompletePayload(event.payload, runtimeSessionId, visitorId)
    );
  } catch (err) {
    console.error(`${logPrefix} Failed to transform Complete payload.`, err);
    return errorEvent(
      "AGENT_COMPLETE_TRANSFORM_FAILED",
      err instanceof Error ? err.message : "Agent Complete transform failed"
    );
  }
}

function* handleParseFailure(
  raw: unknown,
  issues: unknown,
  logPrefix: string
): Generator<Record<string, unknown>> {
  const rawType = isRecord(raw) ? raw.type : undefined;
  if (rawType === "Complete") {
    console.error(
      `${logPrefix} Complete event failed schema validation — surfacing as Error frame.`,
      "issues:",
      issues,
      "raw:",
      JSON.stringify(raw)
    );
    yield errorEvent("AGENT_COMPLETE_PARSE_FAILED", "Agent Complete event failed validation");
    return;
  }
  console.warn(
    `${logPrefix} Dropping unrecognized event (type: ${String(rawType)}).`,
    "issues:",
    issues
  );
}

/**
 * Builds an SSE event transformer for a cards-envelope backend (v1/v2). The
 * only per-version difference is the Complete-payload card mapper — normalize,
 * schema validation, passthrough, and debug-stripping are shared.
 */
export function createAgentEventTransformer(
  transformCompletePayload: CompletePayloadTransformer,
  logPrefix: string,
  normalizeExtra?: (event: unknown) => unknown
) {
  return async function* transformAgentEvents(
    source: AsyncGenerator<unknown>,
    runtimeSessionId: string,
    visitorId: string | null
  ): AsyncGenerator<Record<string, unknown>> {
    for await (const raw of source) {
      const normalized = normalizeCardsEnvelope(raw);
      const adapted = normalizeExtra ? normalizeExtra(normalized) : normalized;
      const parsed = BaseAgentEventSchema.safeParse(adapted);

      if (!parsed.success) {
        yield* handleParseFailure(raw, parsed.error.issues, logPrefix);
        continue;
      }

      const event = parsed.data;

      if (event.type === "Complete") {
        yield transformCompleteEvent(
          event as BaseCompleteEvent,
          runtimeSessionId,
          visitorId,
          transformCompletePayload,
          logPrefix
        );
        continue;
      }

      const passthrough = passthroughEvent(event);
      if (passthrough) {
        yield passthrough;
      }
    }
  };
}
