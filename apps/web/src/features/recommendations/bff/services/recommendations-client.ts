import "server-only";

import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";

export function createRecommendationsClient(baseUrl: string) {
  return createServerClient({
    baseUrl,
    serviceName: "Recommendations",
    defaultHeaders: originVerifyHeader(),
  });
}
