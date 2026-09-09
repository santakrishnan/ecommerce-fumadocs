import { listTraces } from "@features/search/bff/lib/agent-debug-reader";
import { AGENT_DEBUG_ENABLED } from "@features/search/bff/lib/agent-debug-storage";
import Link from "next/link";
import { RefreshButton } from "./_components/refresh-button";
import { clearAgentTracesAction } from "./actions";

/**
 * `/debug/agent` — index of captured agent SSE streams, newest first.
 *
 * Dev-only (guarded by the parent /debug layout). Reads the gitignored
 * `.debug/search` tree; capture must be enabled with `SEARCH_AGENT_DEBUG=true`.
 * Async server component: this route is never statically rendered — it's a
 * filesystem-backed dev tool, so the sync-page/PPR guidance doesn't apply.
 */
export default async function AgentDebugIndexPage() {
  const traces = await listTraces();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-lg">Agent stream traces ({traces.length})</h2>
        <div className="flex items-center gap-2">
          <RefreshButton />
          {traces.length > 0 && (
            <form action={clearAgentTracesAction}>
              <button
                className="rounded border border-divider px-3 py-1 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
                type="submit"
              >
                Clear all
              </button>
            </form>
          )}
        </div>
      </div>

      {traces.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {AGENT_DEBUG_ENABLED
            ? "No captures yet. Run a search and the raw upstream stream will be recorded here."
            : "Trace capture is off. Set SEARCH_AGENT_DEBUG=true in apps/web/.env.local and restart pnpm dev to record streams."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {traces.map((trace) => (
            <li key={`${trace.searchId}/${trace.traceId}`}>
              <Link
                className="flex flex-col gap-1 rounded-lg border border-divider p-4 transition-colors hover:bg-surface-secondary"
                href={`/debug/agent/${encodeURIComponent(trace.searchId)}/${encodeURIComponent(trace.traceId)}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {trace.responseMode && (
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-xs">
                      {trace.responseMode}
                    </span>
                  )}
                  <span className="text-text-secondary text-xs">{trace.serviceLabel}</span>
                  {trace.outcome && (
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-xs">
                      {trace.outcome}
                    </span>
                  )}
                  <span className="text-text-secondary text-xs">
                    {trace.frameCount} frame{trace.frameCount === 1 ? "" : "s"}
                  </span>
                  {typeof trace.totalMs === "number" && (
                    <span className="text-text-secondary text-xs">{trace.totalMs} ms</span>
                  )}
                  <span className="ml-auto text-text-secondary text-xs">{trace.capturedAt}</span>
                </div>
                {trace.query ? (
                  <p className="font-medium text-sm">“{trace.query}”</p>
                ) : (
                  <p className="text-sm text-text-secondary italic">(no query — card click)</p>
                )}
                {trace.summary && <p className="text-sm text-text-secondary">{trace.summary}</p>}
                <p className="font-mono text-text-secondary text-xs">
                  {trace.searchId} · {trace.traceId}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
