import "server-only";

import { type AgentVersion, resolveAgentVersion } from "@config/agent-backend";
import { resolveAgentBackend } from "./resolve-agent-backend";

/**
 * Kicks off (but doesn't await) resolution of the upstream agent version from
 * the httpOnly cookie. Deliberately unawaited — awaiting here would read
 * cookies() during prerender and block the PPR shell
 * (nextjs.org/docs/messages/blocking-prerender-runtime). Callers pass the
 * returned promise to a client boundary that unwraps it with use().
 */
export function resolveInitialAgentVersion(): Promise<AgentVersion> {
  return Promise.resolve()
    .then(() => resolveAgentBackend())
    .then(resolveAgentVersion);
}
