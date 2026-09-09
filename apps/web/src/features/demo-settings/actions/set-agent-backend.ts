"use server";

import {
  AGENT_BACKEND_COOKIE,
  agentBackendCookie,
  agentBackendSchema,
} from "@config/agent-backend";
import { cookies } from "next/headers";

export interface SetAgentBackendResult {
  success: boolean;
}

/**
 * Persist the selected search agent backend in the `demo-agent-backend` cookie.
 *
 * Takes effect on the next agent request: `getSearchAgentStream` reads this
 * cookie fresh on every `POST /api/v1/search/agent`, so no redeploy or app
 * restart is needed. The value is validated against the closed backend enum
 * before it is written — an invalid value is a no-op.
 *
 * Server Actions are publicly-callable endpoints and TypeScript types are
 * erased at runtime, so the payload is validated here regardless of the caller.
 */
export async function setAgentBackend(value: string): Promise<SetAgentBackendResult> {
  const parsed = agentBackendSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(AGENT_BACKEND_COOKIE, parsed.data, {
    httpOnly: agentBackendCookie.httpOnly,
    secure: agentBackendCookie.secure,
    sameSite: agentBackendCookie.sameSite,
    path: agentBackendCookie.path,
    maxAge: agentBackendCookie.maxAge,
  });

  return { success: true };
}

/**
 * Clear the `demo-agent-backend` cookie so backend selection falls back to the
 * `SEARCH_AGENT_BACKEND` env var (the deploy default).
 */
export async function resetAgentBackend(): Promise<SetAgentBackendResult> {
  const cookieStore = await cookies();
  cookieStore.delete(AGENT_BACKEND_COOKIE);
  return { success: true };
}
