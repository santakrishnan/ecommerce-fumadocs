import { readTrace } from "@features/search/bff/lib/agent-debug-reader";
import type { AgentStreamTimings } from "@features/search/bff/lib/agent-debug-storage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "../../_components/copy-button";
import { JsonTree } from "../../_components/json-tree";

/** Best-effort frame `type` for the section heading. */
function frameType(frame: unknown): string {
  if (frame !== null && typeof frame === "object" && "type" in frame) {
    const { type } = frame as { type: unknown };
    if (typeof type === "string") {
      return type;
    }
  }
  return "unknown";
}

const formatMs = (value: number | null): string => (value === null ? "—" : `${value} ms`);

/** Time we spent between receiving the finished result and forwarding it on. */
function processingMs(timings: AgentStreamTimings): string {
  if (timings.resultReceivedMs === null || timings.resultSentMs === null) {
    return "—";
  }
  return `${timings.resultSentMs - timings.resultReceivedMs} ms`;
}

const TIMING_ROWS: ReadonlyArray<{ label: string; value: (t: AgentStreamTimings) => string }> = [
  { label: "outcome", value: (t) => t.outcome },
  { label: "total", value: (t) => formatMs(t.totalMs) },
  { label: "upstream response", value: (t) => formatMs(t.upstreamResponseMs) },
  { label: "first event", value: (t) => formatMs(t.firstEventMs) },
  { label: "result received from upstream", value: (t) => formatMs(t.resultReceivedMs) },
  { label: "result sent to browser", value: (t) => formatMs(t.resultSentMs) },
  { label: "our processing", value: processingMs },
  { label: "events received", value: (t) => String(t.eventsReceived) },
  { label: "events sent", value: (t) => String(t.eventsSent) },
  { label: "last event received", value: (t) => t.lastEventReceived ?? "—" },
];

/**
 * `/debug/agent/[searchId]/[traceId]` — full frame-by-frame view of one
 * captured stream. Each raw frame renders in its own collapsible JSON tree with
 * a copy-to-clipboard button so the Complete frame's card payload can be
 * expanded, inspected, and lifted out verbatim.
 *
 * Dev-only (guarded by the parent /debug layout).
 */
export default async function AgentTraceDetailPage({
  params,
}: {
  params: Promise<{ searchId: string; traceId: string }>;
}) {
  const { searchId, traceId } = await params;
  const trace = await readTrace(decodeURIComponent(searchId), decodeURIComponent(traceId));

  if (!trace) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link className="text-sm text-text-secondary hover:underline" href="/debug/agent">
        ← All traces
      </Link>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg">Trace {trace.traceId}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-text-secondary text-xs">
          <dt>searchId</dt>
          <dd>{trace.searchId}</dd>
          <dt>service</dt>
          <dd>{trace.serviceLabel}</dd>
          <dt>captured</dt>
          <dd>{trace.capturedAt}</dd>
          <dt>frames</dt>
          <dd>{trace.frameCount}</dd>
        </dl>
      </section>

      {trace.timings && (
        <section className="flex flex-col gap-1">
          <h3 className="font-mono text-sm text-text-secondary">timings</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-text-secondary text-xs">
            {TIMING_ROWS.map((row) => (
              <div className="contents" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{trace.timings ? row.value(trace.timings) : "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {trace.request !== undefined && (
        <section className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm text-text-secondary">request</h3>
            <CopyButton value={JSON.stringify(trace.request, null, 2)} />
          </div>
          <JsonTree data={trace.request} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        {trace.frames.map((frame, index) => {
          const type = frameType(frame);
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: captured frames are static and never reordered
            <div className="flex flex-col gap-1" key={`${index}-${type}`}>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm text-text-secondary">
                  #{index} · {type}
                </h3>
                <CopyButton value={JSON.stringify(frame, null, 2)} />
              </div>
              <JsonTree data={frame} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
