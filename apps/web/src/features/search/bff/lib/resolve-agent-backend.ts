import "server-only";

import {
  AGENT_BACKEND_COOKIE,
  agentBackendSchema,
  DEFAULT_AGENT_BACKEND,
} from "@config/agent-backend";
import { cookies } from "next/headers";

/**
 * Minimal structural type for anything that exposes `.get(name)`.
 * Satisfied by both `NextRequest.cookies` (RequestCookies) and the
 * `ReadonlyRequestCookies` returned by `cookies()` from `next/headers`.
 */
interface CookieGetter {
  get(name: string): { value: string } | undefined;
}

/**
 * Resolve the active search agent backend for the current request.
 *
 * Precedence (highest first):
 *   1. `demo-agent-backend` cookie — set via `/demo-settings`, no redeploy needed
 *   2. `SEARCH_AGENT_BACKEND` env var
 *   3. {@link DEFAULT_AGENT_BACKEND} ("v2")
 *
 * A missing or unrecognized cookie value is ignored and resolution falls
 * through to the env var, so a stale cookie can never wedge the stream. The
 * env value is returned verbatim (even if unknown) so the caller's switch can
 * surface its own "unknown backend" error frame — matching prior behavior.
 *
 * @param requestCookies - Pass `request.cookies` from a Route Handler to read
 *   directly from the request object instead of the dynamic `next/headers`
 *   store, which participates in the render lifecycle and can block streaming
 *   SSE responses. When omitted (Server Component / Server Action context),
 *   falls back to `cookies()` from `next/headers`.
 */
export async function resolveAgentBackend(requestCookies?: CookieGetter): Promise<string> {
  try {
    const cookieStore = requestCookies ?? (await cookies());
    const cookieValue = cookieStore.get(AGENT_BACKEND_COOKIE)?.value?.trim();
    const parsed = agentBackendSchema.safeParse(cookieValue);
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // `cookies()` is only available inside a request scope. If it throws (e.g.
    // a unit test invoking the route directly), fall back to the env var rather
    // than failing the agent stream.
  }

  // Reads process.env directly — see ADR-0011 §7 (Documented exceptions).
  return process.env.SEARCH_AGENT_BACKEND?.trim() || DEFAULT_AGENT_BACKEND;
}
