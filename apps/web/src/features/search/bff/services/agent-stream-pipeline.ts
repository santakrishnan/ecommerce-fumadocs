import "server-only";

import { mapCaughtToAgentError } from "../errors/agent.errors";
import { type AgentTraceCapture, createAgentTraceCapture } from "../lib/agent-debug-recorder";
import {
  AGENT_DEBUG_ENABLED,
  type AgentStreamOutcome,
  type AgentStreamTimings,
} from "../lib/agent-debug-storage";
import { createAgentErrorStream, createAgentSseResponse } from "../lib/sse";
import { parseSseStream } from "../lib/sse-line-parser";

type EventTransform = (parsed: AsyncGenerator<unknown>) => AsyncGenerator<Record<string, unknown>>;

interface AgentStreamPipelineOptions {
  body: unknown;
  ensureTerminalEvent?: boolean;
  headers: Record<string, string>;
  serviceLabel: string;
  signal?: AbortSignal;
  transform: EventTransform;
  url: string;
}

const TERMINAL_EVENT_TYPES = new Set(["Complete", "Error"]);

type StreamEndReason = "cancelled" | "closed" | "error";

interface StreamClock {
  eventsReceived: number;
  eventsSent: number;
  firstEventAt?: number;
  lastEventReceived?: string;
  resultReceivedAt?: number;
  resultSentAt?: number;
  startedAt: number;
  upstreamResponseAt?: number;
}

function eventTypeOf(value: unknown): string | undefined {
  if (value !== null && typeof value === "object" && "type" in value) {
    const type = (value as { type: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return;
}

function outcomeFor(reason: StreamEndReason, clock: StreamClock): AgentStreamOutcome {
  if (reason === "cancelled") {
    return "client-disconnected";
  }
  if (reason === "error") {
    return "failed";
  }
  return clock.resultReceivedAt === undefined ? "failed" : "completed";
}

function buildTimings(clock: StreamClock, reason: StreamEndReason): AgentStreamTimings {
  const since = (at?: number) => (at === undefined ? null : at - clock.startedAt);
  return {
    outcome: outcomeFor(reason, clock),
    totalMs: Date.now() - clock.startedAt,
    upstreamResponseMs: since(clock.upstreamResponseAt),
    firstEventMs: since(clock.firstEventAt),
    resultReceivedMs: since(clock.resultReceivedAt),
    resultSentMs: since(clock.resultSentAt),
    eventsReceived: clock.eventsReceived,
    eventsSent: clock.eventsSent,
    lastEventReceived: clock.lastEventReceived ?? null,
  };
}

// Records raw upstream frames into the capture and timestamps their arrival.
async function* tapUpstream(
  source: AsyncGenerator<unknown>,
  capture: AgentTraceCapture,
  clock: StreamClock
): AsyncGenerator<unknown> {
  for await (const frame of source) {
    clock.eventsReceived += 1;
    clock.firstEventAt ??= Date.now();
    const type = eventTypeOf(frame);
    if (type) {
      clock.lastEventReceived = type;
      if (TERMINAL_EVENT_TYPES.has(type)) {
        clock.resultReceivedAt ??= Date.now();
      }
    }
    capture.frames.push({ receivedAt: Date.now() - clock.startedAt, frame });
    yield frame;
  }
}

// Times the events sent to the browser and persists the trace once the stream settles.
async function* tapEmitted(
  events: AsyncGenerator<Record<string, unknown>>,
  capture: AgentTraceCapture,
  clock: StreamClock
): AsyncGenerator<Record<string, unknown>> {
  let reason: StreamEndReason = "cancelled";
  try {
    for await (const event of events) {
      clock.eventsSent += 1;
      if (typeof event.type === "string" && TERMINAL_EVENT_TYPES.has(event.type)) {
        clock.resultSentAt ??= Date.now();
      }
      yield event;
    }
    reason = "closed";
  } catch (err) {
    reason = "error";
    throw err;
  } finally {
    await capture.persist(buildTimings(clock, reason));
  }
}

async function* withTerminalGuard(
  events: AsyncGenerator<Record<string, unknown>>,
  serviceLabel: string
): AsyncGenerator<Record<string, unknown>> {
  let sawTerminal = false;

  for await (const event of events) {
    if (typeof event.type === "string" && TERMINAL_EVENT_TYPES.has(event.type)) {
      sawTerminal = true;
    }
    yield event;
  }

  if (!sawTerminal) {
    yield {
      type: "Error",
      error: {
        code: "AGENT_INCOMPLETE_STREAM",
        message: `${serviceLabel} stream ended without a Complete event`,
      },
    };
  }
}

function serializeEventsToSseStream(
  events: AsyncGenerator<Record<string, unknown>>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          for await (const value of events) {
            if (cancelled) {
              break;
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
          }
          if (!cancelled) {
            controller.close();
          }
        } catch (err) {
          if (!cancelled) {
            controller.error(err);
          }
        }
      })();
    },
    cancel() {
      cancelled = true;
      events.return?.(undefined as never);
    },
  });
}

async function runAgentStreamPipeline({
  url,
  headers,
  body,
  signal,
  transform,
  serviceLabel,
  ensureTerminalEvent = false,
}: AgentStreamPipelineOptions): Promise<Response> {
  const capture = AGENT_DEBUG_ENABLED ? createAgentTraceCapture(serviceLabel, body) : null;
  const clock: StreamClock = { eventsReceived: 0, eventsSent: 0, startedAt: Date.now() };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
    clock.upstreamResponseAt = Date.now();

    if (response.status === 404) {
      return new Response(null, { status: 404 });
    }

    if (!(response.ok && response.body)) {
      // Surface the upstream error body — the reason for a 400/4xx lives here,
      // not in the status code. Always logged server-side; echoed to the client
      // stream outside production so the /api error frame is self-explanatory.
      const detail = await response.text().catch(() => "");
      console.error(
        `[agent-stream-pipeline] ${serviceLabel} upstream error ${response.status}:`,
        detail || "(empty body)"
      );
      const suffix =
        detail && process.env.NODE_ENV !== "production" ? ` — ${detail.slice(0, 500)}` : "";
      return createAgentSseResponse(
        createAgentErrorStream(
          "InternalError",
          `${serviceLabel} responded with ${response.status}${suffix}`
        )
      );
    }

    const parsed = parseSseStream(response.body);
    // When capture is on, record raw upstream frames (pre-Zod) and time the
    // stream; the trace and its timeline surface in the /debug/agent viewer.
    const upstreamSource = capture ? tapUpstream(parsed, capture, clock) : parsed;
    const transformed = transform(upstreamSource);
    const guarded = ensureTerminalEvent
      ? withTerminalGuard(transformed, serviceLabel)
      : transformed;
    const emitted = capture ? tapEmitted(guarded, capture, clock) : guarded;
    const sseStream = serializeEventsToSseStream(emitted);

    return createAgentSseResponse(sseStream);
  } catch (err) {
    const error = mapCaughtToAgentError(err);
    return createAgentSseResponse(createAgentErrorStream(error.code, error.message));
  }
}

export { runAgentStreamPipeline };
