import "server-only";

import type { AgentVersion } from "@config/agent-backend";
import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import { transformV1Events } from "./agent-v1-transformer";
import { transformV2Events } from "./agent-v2-transformer";

/**
 * The one place to register per-version agent behaviour. `agent-upstream` and
 * `agent-payload` look up behaviour here instead of branching on version. A new
 * version = one entry in {@link AGENT_VERSION_HANDLERS} plus its transformer and
 * card mapper.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Space-joined values of every `filters` entry, in order (v1 embeds filter
 * context in the query). Multi-value filters contribute all their values.
 */
function filterValuesPrefix(filters: unknown): string {
  if (!Array.isArray(filters)) {
    return "";
  }
  const values: string[] = [];
  for (const entry of filters) {
    if (!isRecord(entry)) {
      continue;
    }
    if (Array.isArray(entry.values)) {
      for (const value of entry.values) {
        if (value != null) {
          values.push(String(value));
        }
      }
    } else if (entry.value != null) {
      values.push(String(entry.value));
    }
  }
  return values.join(" ");
}

/**
 * v1 query composition: `"<filterValues> - <query>"`, or just one side when the
 * other is empty.
 */
function composeV1Query(query: string | undefined, filters: unknown): string {
  const prefix = filterValuesPrefix(filters);
  const userQuery = typeof query === "string" ? query.trim() : "";

  if (!prefix) {
    return userQuery;
  }

  return userQuery ? `${prefix} - ${userQuery}` : prefix;
}

type EventTransform = (
  parsed: AsyncGenerator<unknown>,
  runtimeSessionId: string,
  visitorId: string | null
) => AsyncGenerator<Record<string, unknown>>;

interface AgentVersionHandler {
  /** Request-side query composition; a truthy result becomes `body.query`. */
  readonly composeQuery?: (query: string | undefined, filters: unknown) => string | undefined;
  /** Response event transformer. */
  readonly transform: EventTransform;
}

/** Per-version behaviour, keyed by version. */
export const AGENT_VERSION_HANDLERS: Record<AgentVersion, AgentVersionHandler> = {
  v1: {
    transform: transformV1Events,
    composeQuery: composeV1Query,
  },
  v2: {
    transform: transformV2Events,
  },
  // v3 isn't in the SDK enum yet. Reuse the v2 typed-envelope transformer as a
  // starting point so we can exercise v3 against the live API; swap in a
  // dedicated transformer once the v3 wire shape is finalised.
  v3: {
    transform: transformV2Events,
  },
};

/** Looks up the registered handler for `version`, defaulting when absent. */
export function agentVersionHandler(version: AgentVersion | undefined): AgentVersionHandler {
  return AGENT_VERSION_HANDLERS[version ?? DEFAULT_AGENT_VERSION];
}
