import "server-only";

import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";
import type { Origination } from "../../types";

/**
 * Upstream origination — calls `GET /origination/{vin}`.
 * Returns `{ kind: "none" }` on failure (graceful degradation).
 */
export async function fetchOrigination(
  baseUrl: string,
  vin: string,
  visitorId: string | null,
  traceId: string
): Promise<Origination> {
  try {
    const client = createServerClient({
      baseUrl,
      serviceName: "VDP-Origination",
      defaultHeaders: originVerifyHeader(),
    });

    const headers: Record<string, string> = { "X-Trace-Id": traceId };
    if (visitorId) {
      headers["X-Visitor-Id"] = visitorId;
    }

    return await client.get<Origination>(`/origination/${vin}`, { headers });
  } catch {
    // Origination is optional — degrade to "none" state
    return { kind: "none" };
  }
}
