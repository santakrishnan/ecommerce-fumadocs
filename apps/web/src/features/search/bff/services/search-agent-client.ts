import "server-only";

import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";

export function createSearchAgentClient(baseUrl: string) {
  return createServerClient({
    baseUrl,
    defaultHeaders: originVerifyHeader(),
    serviceName: "SearchAgent",
  });
}
