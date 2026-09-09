import "server-only";

import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";
import type { DealerExtended } from "../contracts/dealer-detail.schema";

/**
 * Upstream dealer details — calls `GET /dealers/{dealerCode}`.
 * Returns null on failure (graceful degradation).
 */
export async function fetchDealerDetail(
  baseUrl: string,
  dealerCode: string,
  traceId: string
): Promise<DealerExtended | null> {
  try {
    const client = createServerClient({
      baseUrl,
      serviceName: "VDP-Dealer",
      defaultHeaders: originVerifyHeader(),
    });

    return await client.get<DealerExtended>(`/dealers/${dealerCode}`, {
      headers: { "X-Trace-Id": traceId },
    });
  } catch {
    // Dealer details are optional — degrade gracefully
    return null;
  }
}
